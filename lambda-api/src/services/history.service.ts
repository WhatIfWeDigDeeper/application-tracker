import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLE_NAME } from './dynamodb.client.js';
import { appPK, historySK } from '../types/dynamo.js';
import type { HistoryItem } from '../types/dynamo.js';
import type {
  ApplicationResponse,
  HistoryEntryResponse,
  PaginatedHistoryResponse,
  FieldChange,
} from '../types/api.js';

const FIELD_LABELS: Record<string, string> = {
  companyName: 'Company Name',
  positionTitle: 'Position Title',
  dateApplied: 'Date Applied',
  status: 'Status',
  companyUrl: 'Company URL',
  jobPostingUrl: 'Job Posting URL',
  companyCareerUrl: 'Career Page URL',
  companyCategory: 'Company Category',
  skillsMatch: 'Skills Match',
  jobSource: 'Job Source',
  coverLetterRequired: 'Cover Letter Required',
  specialRequirements: 'Special Requirements',
  salaryMin: 'Min Salary',
  salaryMax: 'Max Salary',
  notes: 'Notes',
  offerDueDate: 'Offer Due Date',
  isArchived: 'Archived',
};

export async function getNextSequence(applicationId: string): Promise<number> {
  // Atomically increment historySequence on the application item
  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: appPK(applicationId), SK: appPK(applicationId) },
      UpdateExpression: 'ADD historySequence :inc',
      ExpressionAttributeValues: { ':inc': 1 },
      ReturnValues: 'UPDATED_NEW',
    })
  );
  return Number(result.Attributes?.['historySequence'] ?? 1);
}

export async function recordHistory(
  applicationId: string,
  description: string,
  snapshot: ApplicationResponse
): Promise<void> {
  const sequence = await getNextSequence(applicationId);
  const item: HistoryItem = {
    PK: appPK(applicationId),
    SK: historySK(sequence),
    id: uuidv4(),
    applicationId,
    sequence,
    description,
    snapshot,
    createdAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );
}

export async function listHistory(
  applicationId: string,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedHistoryResponse> {
  // Query all history items for this application (newest first via ScanIndexForward=false)
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: {
        ':pk': appPK(applicationId),
        ':prefix': 'HIST#',
      },
      ScanIndexForward: false,
    })
  );

  const rows = (result.Items ?? []) as HistoryItem[];
  const total = rows.length;

  // Offset-based pagination in-memory
  const offset = (page - 1) * limit;
  const pageRows = rows.slice(offset, offset + limit);

  const entries: HistoryEntryResponse[] = pageRows.map((row, index) => {
    const thisSnapshot = row.snapshot;
    let changes: FieldChange[] = [];

    // The "before" is the next item in the array (older entry, since sorted newest-first)
    const olderRow = pageRows[index + 1] ?? rows[offset + index + 1];
    if (olderRow) {
      changes = computeFieldDiffs(olderRow.snapshot, thisSnapshot);
    }

    return {
      id: row.id,
      sequence: row.sequence,
      description: row.description,
      changes,
      createdAt: row.createdAt,
    };
  });

  return { entries, total, page, limit };
}

export async function getHistoryEntry(
  applicationId: string,
  sequence: number
): Promise<HistoryItem | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: appPK(applicationId), SK: historySK(sequence) },
    })
  );
  return result.Item ? (result.Item as HistoryItem) : null;
}

export function computeFieldDiffs(
  before: ApplicationResponse,
  after: ApplicationResponse
): FieldChange[] {
  const changes: FieldChange[] = [];

  for (const [field, label] of Object.entries(FIELD_LABELS)) {
    const oldValue = (before as Record<string, unknown>)[field];
    const newValue = (after as Record<string, unknown>)[field];

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({ field, label, oldValue, newValue });
    }
  }

  const oldStages = JSON.stringify(before.interviewStages);
  const newStages = JSON.stringify(after.interviewStages);
  if (oldStages !== newStages) {
    changes.push({
      field: 'interviewStages',
      label: 'Interview Stages',
      oldValue: before.interviewStages,
      newValue: after.interviewStages,
    });
  }

  return changes;
}

export function buildDescription(action: string, details?: string): string {
  switch (action) {
    case 'create':
      return `Created application ${details || ''}`.trim();
    case 'update':
      return `Updated ${details || ''}`.trim();
    case 'delete':
      return 'Deleted application';
    case 'archive':
      return 'Archived application';
    case 'restore':
      return 'Restored from archive';
    case 'restore_version':
      return `Restored to version ${details}`;
    case 'stage_add':
      return `Added interview stage "${details}"`;
    case 'stage_update':
      return `Updated interview stage "${details}"`;
    case 'stage_delete':
      return `Removed interview stage "${details}"`;
    default:
      return details || action;
  }
}
