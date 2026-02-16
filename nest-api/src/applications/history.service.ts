import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.provider.js';
import { applicationHistory, applications, interviewStages } from '../database/schema.js';
import { toApplicationResponse } from './shared.js';
import type { ApplicationResponse, HistoryEntryResponse, PaginatedHistoryResponse } from '../types/api.js';

interface FieldChange {
  field: string;
  label: string;
  oldValue: unknown;
  newValue: unknown;
}

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

@Injectable()
export class HistoryService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  async captureSnapshot(applicationId: string): Promise<ApplicationResponse | null> {
    const app = await this.db.query.applications.findFirst({
      where: eq(applications.id, applicationId),
      with: { interviewStages: true },
    });

    if (!app) return null;
    return toApplicationResponse(app, app.interviewStages);
  }

  async getNextSequence(applicationId: string): Promise<number> {
    const result = await this.db
      .select({ maxSeq: sql<number>`coalesce(max(${applicationHistory.sequence}), 0)` })
      .from(applicationHistory)
      .where(eq(applicationHistory.applicationId, applicationId));

    return Number(result[0]?.maxSeq ?? 0) + 1;
  }

  async recordHistory(applicationId: string, description: string): Promise<void> {
    const snapshot = await this.captureSnapshot(applicationId);
    if (!snapshot) return;

    const sequence = await this.getNextSequence(applicationId);

    await this.db.insert(applicationHistory).values({
      applicationId,
      sequence,
      description,
      snapshot,
    });
  }

  async listHistory(
    applicationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<PaginatedHistoryResponse> {
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(applicationHistory)
      .where(eq(applicationHistory.applicationId, applicationId));

    const total = Number(countResult[0]?.count || 0);

    const offset = (page - 1) * limit;
    const rows = await this.db
      .select()
      .from(applicationHistory)
      .where(eq(applicationHistory.applicationId, applicationId))
      .orderBy(desc(applicationHistory.sequence))
      .limit(limit)
      .offset(offset);

    const entries: HistoryEntryResponse[] = rows.map((row, index) => {
      const thisSnapshot = row.snapshot as ApplicationResponse;
      let changes: FieldChange[] = [];

      const olderRow = rows[index + 1];
      if (olderRow) {
        const olderSnapshot = olderRow.snapshot as ApplicationResponse;
        changes = computeFieldDiffs(olderSnapshot, thisSnapshot);
      }

      return {
        id: row.id,
        sequence: row.sequence,
        description: row.description,
        changes,
        createdAt: row.createdAt.toISOString(),
      };
    });

    return { entries, total, page, limit };
  }

  async restoreToVersion(
    applicationId: string,
    targetSequence: number
  ): Promise<ApplicationResponse | null> {
    const entry = await this.db.query.applicationHistory.findFirst({
      where: and(
        eq(applicationHistory.applicationId, applicationId),
        eq(applicationHistory.sequence, targetSequence)
      ),
    });

    if (!entry) return null;

    const snapshot = entry.snapshot as ApplicationResponse;

    await this.db
      .update(applications)
      .set({
        companyName: snapshot.companyName,
        positionTitle: snapshot.positionTitle,
        dateApplied: snapshot.dateApplied,
        status: snapshot.status,
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
        updatedAt: new Date(),
      })
      .where(eq(applications.id, applicationId));

    await this.db.delete(interviewStages).where(eq(interviewStages.applicationId, applicationId));

    if (snapshot.interviewStages && snapshot.interviewStages.length > 0) {
      await this.db.insert(interviewStages).values(
        snapshot.interviewStages.map((s) => ({
          applicationId,
          name: s.name,
          order: s.order,
          isCompleted: s.isCompleted,
          completedDate: s.completedDate || null,
          notes: s.notes,
          performanceRating: s.performanceRating,
        }))
      );
    }

    await this.recordHistory(applicationId, buildDescription('restore_version', String(targetSequence)));

    return this.captureSnapshot(applicationId);
  }
}

export function computeFieldDiffs(before: ApplicationResponse, after: ApplicationResponse): FieldChange[] {
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
