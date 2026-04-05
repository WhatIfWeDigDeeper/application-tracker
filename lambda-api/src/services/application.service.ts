import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLE_NAME } from './dynamodb.client.js';
import {
  appPK,
  stageSK,
  historySK,
  gsi1PK,
  gsiSK,
  GSI2_ACTIVE,
} from '../types/dynamo.js';
import type { ApplicationItem, StageItem, HistoryItem } from '../types/dynamo.js';
import type {
  CreateApplicationInput,
  UpdateApplicationInput,
  ListApplicationsQuery,
  ApplicationResponse,
  PaginatedApplicationsResponse,
  InterviewStageResponse,
} from '../types/api.js';
import { recordHistory, buildDescription } from './history.service.js';

const FIELD_LABELS_MAP: Record<string, string> = {
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
};

// Fetch all stage items for an application (sorted by order)
async function fetchStages(applicationId: string): Promise<StageItem[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: {
        ':pk': appPK(applicationId),
        ':prefix': 'STAGE#',
      },
    })
  );
  const stages = (result.Items ?? []) as StageItem[];
  return stages.sort((a, b) => a.order - b.order);
}

function toStageResponse(stage: StageItem): InterviewStageResponse {
  return {
    id: stage.id,
    name: stage.name,
    order: stage.order,
    isCompleted: stage.isCompleted,
    completedDate: stage.completedDate,
    notes: stage.notes,
    performanceRating: stage.performanceRating,
  };
}

function toApplicationResponse(
  item: ApplicationItem,
  stages: StageItem[]
): ApplicationResponse {
  return {
    id: item.id,
    companyName: item.companyName,
    positionTitle: item.positionTitle,
    dateApplied: item.dateApplied,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    companyUrl: item.companyUrl,
    jobPostingUrl: item.jobPostingUrl,
    companyCareerUrl: item.companyCareerUrl,
    companyCategory: item.companyCategory,
    skillsMatch: item.skillsMatch,
    jobSource: item.jobSource,
    coverLetterRequired: item.coverLetterRequired,
    specialRequirements: item.specialRequirements,
    salaryMin: item.salaryMin,
    salaryMax: item.salaryMax,
    notes: item.notes,
    offerDueDate: item.offerDueDate,
    isArchived: item.isArchived,
    interviewStages: stages.map(toStageResponse),
  };
}

function buildApplicationItem(
  id: string,
  fields: Omit<ApplicationItem, 'PK' | 'SK' | 'GSI1PK' | 'GSI1SK' | 'GSI2PK' | 'GSI2SK'>
): ApplicationItem {
  const gsi1pk = gsi1PK(fields.status, fields.isArchived);
  const gsi1sk = gsiSK(fields.updatedAt, id);
  const item: ApplicationItem = {
    PK: appPK(id),
    SK: appPK(id),
    GSI1PK: gsi1pk,
    GSI1SK: gsi1sk,
    ...fields,
  };
  if (!fields.isArchived) {
    item.GSI2PK = GSI2_ACTIVE;
    item.GSI2SK = gsi1sk;
  }
  return item;
}

export async function getApplicationItem(id: string): Promise<ApplicationItem | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: appPK(id), SK: appPK(id) },
    })
  );
  return result.Item ? (result.Item as ApplicationItem) : null;
}

export async function getApplication(id: string): Promise<ApplicationResponse | null> {
  const item = await getApplicationItem(id);
  if (!item) return null;
  const stages = await fetchStages(id);
  return toApplicationResponse(item, stages);
}

// Touch updatedAt and refresh GSI keys — used by stage mutations
export async function touchApplication(id: string): Promise<ApplicationResponse | null> {
  const item = await getApplicationItem(id);
  if (!item) return null;

  const now = new Date().toISOString();
  const updatedItem: ApplicationItem = {
    ...item,
    updatedAt: now,
    GSI1PK: gsi1PK(item.status, item.isArchived),
    GSI1SK: gsiSK(now, id),
  };
  if (!item.isArchived) {
    updatedItem.GSI2PK = GSI2_ACTIVE;
    updatedItem.GSI2SK = gsiSK(now, id);
  } else {
    delete updatedItem.GSI2PK;
    delete updatedItem.GSI2SK;
  }

  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: updatedItem }));
  const stages = await fetchStages(id);
  return toApplicationResponse(updatedItem, stages);
}

export async function listApplications(
  query: ListApplicationsQuery
): Promise<PaginatedApplicationsResponse> {
  const {
    status,
    companyCategory,
    jobSource,
    skillsMatchMin,
    includeArchived,
    sortBy,
    sortDir,
    page,
    limit,
  } = query;

  // Scan with FilterExpression (appropriate at job-tracker scale)
  const filterParts: string[] = ['begins_with(SK, :appPrefix)'];
  const expressionValues: Record<string, unknown> = { ':appPrefix': 'APP#' };

  if (!includeArchived) {
    filterParts.push('isArchived = :archived');
    expressionValues[':archived'] = false;
  }

  if (status) {
    const statuses = status.split(',').map((s) => s.trim());
    if (statuses.length === 1) {
      filterParts.push('#st = :status');
      expressionValues[':status'] = statuses[0];
    } else {
      const placeholders = statuses.map((_, i) => `:st${i}`);
      filterParts.push(`#st IN (${placeholders.join(', ')})`);
      statuses.forEach((s, i) => {
        expressionValues[`:st${i}`] = s;
      });
    }
  }

  if (companyCategory) {
    filterParts.push('companyCategory = :companyCategory');
    expressionValues[':companyCategory'] = companyCategory;
  }

  if (jobSource) {
    filterParts.push('jobSource = :jobSource');
    expressionValues[':jobSource'] = jobSource;
  }

  if (skillsMatchMin != null) {
    filterParts.push('skillsMatch >= :skillsMatchMin');
    expressionValues[':skillsMatchMin'] = skillsMatchMin;
  }

  const expressionNames: Record<string, string> = {};
  if (status) {
    expressionNames['#st'] = 'status';
  }

  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: filterParts.join(' AND '),
      ExpressionAttributeValues: expressionValues,
      ...(Object.keys(expressionNames).length > 0
        ? { ExpressionAttributeNames: expressionNames }
        : {}),
    })
  );

  const items = (result.Items ?? []) as ApplicationItem[];

  // Sort
  items.sort((a, b) => {
    let aVal: string | null;
    let bVal: string | null;

    if (sortBy === 'companyName') {
      aVal = a.companyName.toLowerCase();
      bVal = b.companyName.toLowerCase();
    } else if (sortBy === 'dateApplied') {
      aVal = a.dateApplied;
      bVal = b.dateApplied;
    } else {
      aVal = a.updatedAt;
      bVal = b.updatedAt;
    }

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const total = items.length;

  // Paginate in-memory
  const offset = (page - 1) * limit;
  const pageItems = items.slice(offset, offset + limit);

  // Fetch stages for each application on the current page
  const responses = await Promise.all(
    pageItems.map(async (item) => {
      const stages = await fetchStages(item.id);
      return toApplicationResponse(item, stages);
    })
  );

  return { items: responses, page, limit, total };
}

export async function createApplication(
  input: CreateApplicationInput
): Promise<ApplicationResponse> {
  const id = uuidv4();
  const now = new Date().toISOString();
  const status = input.status ?? 'unsubmitted';
  const dateApplied =
    status === 'unsubmitted' ? null : (input.dateApplied ?? now.split('T')[0]);

  const item = buildApplicationItem(id, {
    id,
    companyName: input.companyName,
    positionTitle: input.positionTitle,
    status,
    dateApplied,
    createdAt: now,
    updatedAt: now,
    companyUrl: input.companyUrl ?? null,
    jobPostingUrl: input.jobPostingUrl ?? null,
    companyCareerUrl: input.companyCareerUrl ?? null,
    companyCategory: input.companyCategory ?? null,
    skillsMatch: input.skillsMatch ?? null,
    jobSource: input.jobSource ?? null,
    coverLetterRequired: input.coverLetterRequired ?? null,
    specialRequirements: input.specialRequirements ?? null,
    salaryMin: input.salaryMin ?? null,
    salaryMax: input.salaryMax ?? null,
    notes: input.notes ?? null,
    offerDueDate: null,
    isArchived: false,
    historySequence: 0,
  });

  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));

  const response = toApplicationResponse(item, []);
  await recordHistory(
    id,
    buildDescription('create', `${input.companyName} - ${input.positionTitle}`),
    response
  );

  return response;
}

export async function updateApplication(
  id: string,
  input: UpdateApplicationInput
): Promise<ApplicationResponse | null> {
  const existing = await getApplicationItem(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updated: ApplicationItem = { ...existing, updatedAt: now };

  if (input.companyName !== undefined) updated.companyName = input.companyName;
  if (input.positionTitle !== undefined) updated.positionTitle = input.positionTitle;
  if (input.dateApplied !== undefined) updated.dateApplied = input.dateApplied;
  if (input.status !== undefined) {
    updated.status = input.status;
    if (input.status === 'unsubmitted') updated.dateApplied = null;
  }
  if (input.companyUrl !== undefined) updated.companyUrl = input.companyUrl;
  if (input.jobPostingUrl !== undefined) updated.jobPostingUrl = input.jobPostingUrl;
  if (input.companyCareerUrl !== undefined) updated.companyCareerUrl = input.companyCareerUrl;
  if (input.companyCategory !== undefined) updated.companyCategory = input.companyCategory;
  if (input.skillsMatch !== undefined) updated.skillsMatch = input.skillsMatch;
  if (input.jobSource !== undefined) updated.jobSource = input.jobSource;
  if (input.coverLetterRequired !== undefined)
    updated.coverLetterRequired = input.coverLetterRequired;
  if (input.specialRequirements !== undefined)
    updated.specialRequirements = input.specialRequirements;
  if (input.salaryMin !== undefined) updated.salaryMin = input.salaryMin;
  if (input.salaryMax !== undefined) updated.salaryMax = input.salaryMax;
  if (input.notes !== undefined) updated.notes = input.notes;
  if (input.offerDueDate !== undefined) updated.offerDueDate = input.offerDueDate;

  // Refresh GSI keys
  updated.GSI1PK = gsi1PK(updated.status, updated.isArchived);
  updated.GSI1SK = gsiSK(now, id);
  if (!updated.isArchived) {
    updated.GSI2PK = GSI2_ACTIVE;
    updated.GSI2SK = gsiSK(now, id);
  } else {
    delete updated.GSI2PK;
    delete updated.GSI2SK;
  }

  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: updated }));

  const stages = await fetchStages(id);
  const response = toApplicationResponse(updated, stages);

  const changedFields = Object.keys(input)
    .filter((key) => key in FIELD_LABELS_MAP)
    .map((key) => FIELD_LABELS_MAP[key]);
  if (changedFields.length > 0) {
    await recordHistory(id, buildDescription('update', changedFields.join(', ')), response);
  }

  return response;
}

export async function deleteApplication(id: string): Promise<boolean> {
  const existing = await getApplicationItem(id);
  if (!existing) return false;

  // Query all items for this PK (stages + history + the application itself)
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': appPK(id) },
      ProjectionExpression: 'PK, SK',
    })
  );

  const keys = result.Items ?? [];

  // Delete all items in batches of 25 (DynamoDB limit)
  for (let i = 0; i < keys.length; i += 25) {
    const batch = keys.slice(i, i + 25);
    for (const key of batch) {
      await docClient.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: { PK: key['PK'], SK: key['SK'] },
        })
      );
    }
  }

  return true;
}

export async function archiveApplication(id: string): Promise<ApplicationResponse | null> {
  const existing = await getApplicationItem(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updated: ApplicationItem = {
    ...existing,
    isArchived: true,
    updatedAt: now,
    GSI1PK: gsi1PK(existing.status, true),
    GSI1SK: gsiSK(now, id),
  };
  // Remove GSI2 keys (archived items don't appear in active listing)
  delete updated.GSI2PK;
  delete updated.GSI2SK;

  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: updated }));

  const stages = await fetchStages(id);
  const response = toApplicationResponse(updated, stages);
  await recordHistory(id, buildDescription('archive'), response);

  return response;
}

export async function restoreApplication(id: string): Promise<ApplicationResponse | null> {
  const existing = await getApplicationItem(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updated: ApplicationItem = {
    ...existing,
    isArchived: false,
    updatedAt: now,
    GSI1PK: gsi1PK(existing.status, false),
    GSI1SK: gsiSK(now, id),
    GSI2PK: GSI2_ACTIVE,
    GSI2SK: gsiSK(now, id),
  };

  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: updated }));

  const stages = await fetchStages(id);
  const response = toApplicationResponse(updated, stages);
  await recordHistory(id, buildDescription('restore'), response);

  return response;
}

export async function restoreToVersion(
  applicationId: string,
  targetSequence: number
): Promise<ApplicationResponse | null> {
  // Fetch the history entry
  const histResult = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: appPK(applicationId),
        SK: historySK(targetSequence),
      },
    })
  );

  if (!histResult.Item) return null;
  const histEntry = histResult.Item as HistoryItem;
  const snapshot = histEntry.snapshot;

  const existing = await getApplicationItem(applicationId);
  if (!existing) return null;

  const now = new Date().toISOString();

  // Rebuild application item from snapshot
  const restored: ApplicationItem = buildApplicationItem(applicationId, {
    id: applicationId,
    companyName: snapshot.companyName,
    positionTitle: snapshot.positionTitle,
    status: snapshot.status,
    dateApplied: snapshot.dateApplied,
    createdAt: existing.createdAt,
    updatedAt: now,
    companyUrl: snapshot.companyUrl,
    jobPostingUrl: snapshot.jobPostingUrl,
    companyCareerUrl: snapshot.companyCareerUrl,
    companyCategory: snapshot.companyCategory,
    skillsMatch: snapshot.skillsMatch,
    jobSource: snapshot.jobSource,
    coverLetterRequired: snapshot.coverLetterRequired,
    specialRequirements: snapshot.specialRequirements,
    salaryMin: snapshot.salaryMin,
    salaryMax: snapshot.salaryMax,
    notes: snapshot.notes,
    offerDueDate: snapshot.offerDueDate,
    isArchived: snapshot.isArchived,
    historySequence: existing.historySequence,
  });

  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: restored }));

  // Delete all current stages
  const currentStages = await fetchStages(applicationId);
  for (const stage of currentStages) {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: appPK(applicationId), SK: stageSK(stage.id) },
      })
    );
  }

  // Re-insert stages from snapshot
  for (const s of snapshot.interviewStages) {
    const stageItem: StageItem = {
      PK: appPK(applicationId),
      SK: stageSK(s.id),
      id: s.id,
      applicationId,
      name: s.name,
      order: s.order,
      isCompleted: s.isCompleted,
      completedDate: s.completedDate,
      notes: s.notes,
      performanceRating: s.performanceRating,
    };
    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: stageItem }));
  }

  const response = toApplicationResponse(restored, snapshot.interviewStages.map((s) => ({
    PK: appPK(applicationId),
    SK: stageSK(s.id),
    id: s.id,
    applicationId,
    name: s.name,
    order: s.order,
    isCompleted: s.isCompleted,
    completedDate: s.completedDate,
    notes: s.notes,
    performanceRating: s.performanceRating,
  })));

  await recordHistory(
    applicationId,
    buildDescription('restore_version', String(targetSequence)),
    response
  );

  return response;
}

// Exported for use by interview-stage.service
export { fetchStages, toApplicationResponse, toStageResponse };
