import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.provider.js';
import { applications, interviewStages, type InterviewStage } from '../database/schema.js';
import type { CreateInterviewStageInput, UpdateInterviewStageInput, InterviewStageResponse } from '../types/api.js';
import { formatDate } from './shared.js';
import { HistoryClient, buildDescription } from './history.client.js';

function toStageResponse(stage: InterviewStage): InterviewStageResponse {
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

@Injectable()
export class InterviewStagesService {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    @Inject(HistoryClient) private historyService: HistoryClient,
  ) {}

  async createInterviewStage(
    applicationId: string,
    input: CreateInterviewStageInput
  ): Promise<InterviewStageResponse | null> {
    const app = await this.db.query.applications.findFirst({
      where: eq(applications.id, applicationId),
    });

    if (!app) return null;

    const [stage] = await this.db
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

    await this.db.update(applications).set({ updatedAt: new Date() }).where(eq(applications.id, applicationId));

    await this.historyService.recordHistory(applicationId, buildDescription('stage_add', input.name));

    return toStageResponse(stage);
  }

  async updateInterviewStage(
    applicationId: string,
    stageId: string,
    input: UpdateInterviewStageInput
  ): Promise<InterviewStageResponse | null> {
    const existing = await this.db.query.interviewStages.findFirst({
      where: and(eq(interviewStages.id, stageId), eq(interviewStages.applicationId, applicationId)),
    });

    if (!existing) return null;

    const updateValues: Partial<typeof interviewStages.$inferInsert> = {};

    if (input.name !== undefined) updateValues.name = input.name;
    if (input.order !== undefined) updateValues.order = input.order;
    if (input.isCompleted !== undefined) updateValues.isCompleted = input.isCompleted;
    if (input.completedDate !== undefined) updateValues.completedDate = input.completedDate;
    if (input.notes !== undefined) updateValues.notes = input.notes;
    if (input.performanceRating !== undefined) updateValues.performanceRating = input.performanceRating;

    const [updated] = await this.db
      .update(interviewStages)
      .set(updateValues)
      .where(and(eq(interviewStages.id, stageId), eq(interviewStages.applicationId, applicationId)))
      .returning();

    await this.db.update(applications).set({ updatedAt: new Date() }).where(eq(applications.id, applicationId));

    await this.historyService.recordHistory(applicationId, buildDescription('stage_update', existing.name));

    return toStageResponse(updated);
  }

  async deleteInterviewStage(applicationId: string, stageId: string): Promise<boolean> {
    const stage = await this.db.query.interviewStages.findFirst({
      where: and(eq(interviewStages.id, stageId), eq(interviewStages.applicationId, applicationId)),
    });

    if (stage) {
      await this.historyService.recordHistory(applicationId, buildDescription('stage_delete', stage.name));
    }

    const result = await this.db
      .delete(interviewStages)
      .where(and(eq(interviewStages.id, stageId), eq(interviewStages.applicationId, applicationId)))
      .returning({ id: interviewStages.id });

    if (result.length > 0) {
      await this.db.update(applications).set({ updatedAt: new Date() }).where(eq(applications.id, applicationId));
      return true;
    }

    return false;
  }
}
