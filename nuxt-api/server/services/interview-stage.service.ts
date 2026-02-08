import { eq, and } from 'drizzle-orm';
import { db } from '../db/client';
import { applications, interviewStages, type DbInterviewStage } from '../db/schema';
import type { InterviewStage } from '~~/shared/types';
import type { z } from 'zod';
import type { CreateInterviewStageSchema, UpdateInterviewStageSchema } from '../utils/validation';

type CreateInterviewStageInput = z.infer<typeof CreateInterviewStageSchema>;
type UpdateInterviewStageInput = z.infer<typeof UpdateInterviewStageSchema>;

// Helper to format date for response
function formatDate(date: string | Date | null): string | null {
  if (!date) return null;
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
}

// Transform DB stage to API response
function toStageResponse(stage: DbInterviewStage): InterviewStage {
  return {
    id: stage.id,
    name: stage.name,
    order: stage.order,
    isCompleted: stage.isCompleted,
    completedDate: formatDate(stage.completedDate),
    notes: stage.notes,
    performanceRating: stage.performanceRating,
  };
}

export async function createInterviewStage(
  applicationId: string,
  input: CreateInterviewStageInput,
): Promise<InterviewStage | null> {
  // Check if application exists
  const app = await db.query.applications.findFirst({
    where: eq(applications.id, applicationId),
  });

  if (!app) return null;

  const [stage] = await db
    .insert(interviewStages)
    .values({
      applicationId,
      name: input.name,
      order: input.order,
      isCompleted: input.isCompleted ?? false,
      completedDate: input.completedDate || null,
      notes: input.notes || null,
      performanceRating: input.performanceRating || null,
    })
    .returning();

  // Update application's updatedAt
  await db.update(applications).set({ updatedAt: new Date() }).where(eq(applications.id, applicationId));

  return toStageResponse(stage);
}

export async function updateInterviewStage(
  applicationId: string,
  stageId: string,
  input: UpdateInterviewStageInput,
): Promise<InterviewStage | null> {
  // Check if stage exists and belongs to application
  const existing = await db.query.interviewStages.findFirst({
    where: and(eq(interviewStages.id, stageId), eq(interviewStages.applicationId, applicationId)),
  });

  if (!existing) return null;

  // Build update values
  const updateValues: Partial<typeof interviewStages.$inferInsert> = {};

  if (input.name !== undefined) updateValues.name = input.name;
  if (input.order !== undefined) updateValues.order = input.order;
  if (input.isCompleted !== undefined) updateValues.isCompleted = input.isCompleted;
  if (input.completedDate !== undefined) updateValues.completedDate = input.completedDate;
  if (input.notes !== undefined) updateValues.notes = input.notes;
  if (input.performanceRating !== undefined) updateValues.performanceRating = input.performanceRating;

  const [updated] = await db
    .update(interviewStages)
    .set(updateValues)
    .where(and(eq(interviewStages.id, stageId), eq(interviewStages.applicationId, applicationId)))
    .returning();

  // Update application's updatedAt
  await db.update(applications).set({ updatedAt: new Date() }).where(eq(applications.id, applicationId));

  return toStageResponse(updated);
}

export async function deleteInterviewStage(applicationId: string, stageId: string): Promise<boolean> {
  const result = await db
    .delete(interviewStages)
    .where(and(eq(interviewStages.id, stageId), eq(interviewStages.applicationId, applicationId)))
    .returning({ id: interviewStages.id });

  if (result.length > 0) {
    // Update application's updatedAt
    await db.update(applications).set({ updatedAt: new Date() }).where(eq(applications.id, applicationId));
    return true;
  }

  return false;
}
