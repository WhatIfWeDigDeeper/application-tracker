import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLE_NAME } from './dynamodb.client.js';
import { appPK, stageSK } from '../types/dynamo.js';
import type { StageItem } from '../types/dynamo.js';
import type {
  CreateInterviewStageInput,
  UpdateInterviewStageInput,
  InterviewStageResponse,
} from '../types/api.js';
import { getApplication, touchApplication } from './application.service.js';
import { recordHistory, buildDescription } from './history.service.js';

function toStageResponse(item: StageItem): InterviewStageResponse {
  return {
    id: item.id,
    name: item.name,
    order: item.order,
    isCompleted: item.isCompleted,
    completedDate: item.completedDate,
    notes: item.notes,
    performanceRating: item.performanceRating,
  };
}

export async function getStagesByApplicationId(applicationId: string): Promise<StageItem[]> {
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

export async function createInterviewStage(
  applicationId: string,
  input: CreateInterviewStageInput
): Promise<InterviewStageResponse | null> {
  // Verify application exists
  const app = await getApplication(applicationId);
  if (!app) return null;

  const stageId = uuidv4();
  const item: StageItem = {
    PK: appPK(applicationId),
    SK: stageSK(stageId),
    id: stageId,
    applicationId,
    name: input.name,
    order: input.order,
    isCompleted: input.isCompleted ?? false,
    completedDate: input.completedDate ?? null,
    notes: input.notes ?? null,
    performanceRating: input.performanceRating ?? null,
  };

  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));

  // Touch application updatedAt and get updated snapshot
  const updatedApp = await touchApplication(applicationId);
  if (updatedApp) {
    await recordHistory(applicationId, buildDescription('stage_add', input.name), updatedApp);
  }

  return toStageResponse(item);
}

export async function updateInterviewStage(
  applicationId: string,
  stageId: string,
  input: UpdateInterviewStageInput
): Promise<InterviewStageResponse | null> {
  // Check stage exists and belongs to this application
  const existing = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: appPK(applicationId), SK: stageSK(stageId) },
    })
  );

  if (!existing.Item) return null;
  const stage = existing.Item as StageItem;

  // Build updated item
  const updated: StageItem = {
    ...stage,
    name: input.name !== undefined ? input.name : stage.name,
    order: input.order !== undefined ? input.order : stage.order,
    isCompleted: input.isCompleted !== undefined ? input.isCompleted : stage.isCompleted,
    completedDate:
      input.completedDate !== undefined ? (input.completedDate ?? null) : stage.completedDate,
    notes: input.notes !== undefined ? (input.notes ?? null) : stage.notes,
    performanceRating:
      input.performanceRating !== undefined
        ? (input.performanceRating ?? null)
        : stage.performanceRating,
  };

  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: updated }));

  const updatedApp = await touchApplication(applicationId);
  if (updatedApp) {
    await recordHistory(
      applicationId,
      buildDescription('stage_update', stage.name),
      updatedApp
    );
  }

  return toStageResponse(updated);
}

export async function deleteInterviewStage(
  applicationId: string,
  stageId: string
): Promise<boolean> {
  // Fetch stage first for history description
  const existing = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: appPK(applicationId), SK: stageSK(stageId) },
    })
  );

  if (!existing.Item) return false;
  const stage = existing.Item as StageItem;

  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: appPK(applicationId), SK: stageSK(stageId) },
    })
  );

  const updatedApp = await touchApplication(applicationId);
  if (updatedApp) {
    await recordHistory(
      applicationId,
      buildDescription('stage_delete', stage.name),
      updatedApp
    );
  }

  return true;
}

export async function deleteAllStagesForApplication(applicationId: string): Promise<void> {
  const stages = await getStagesByApplicationId(applicationId);
  for (const stage of stages) {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: appPK(applicationId), SK: stageSK(stage.id) },
      })
    );
  }
}

// Export for use in application restore
export { toStageResponse };
