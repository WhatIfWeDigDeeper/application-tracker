/**
 * HistoryClient — drop-in replacement for the old local HistoryService.
 *
 * Public interface is identical so existing call sites in ApplicationsService,
 * CsvService, InterviewStagesService, and ApplicationsController are unchanged.
 *
 * Internally:
 * - Reads application snapshots from the local Drizzle DB (nest-api still owns
 *   the applications + interview_stages tables)
 * - Delegates storage/retrieval to nest-history-api over gRPC
 * - Computes field-level diffs locally (snapshot contents are opaque to the
 *   gRPC service; only nest-api knows the schema)
 */

import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.provider.js';
import { applications, interviewStages } from '../database/schema.js';
import { toApplicationResponse } from './shared.js';
import type {
  ApplicationResponse,
  HistoryEntryResponse,
  PaginatedHistoryResponse,
} from '../types/api.js';
import type { HistoryServiceClient } from '../generated/history/v1/history.js';

export const HISTORY_CLIENT = 'HISTORY_PACKAGE';

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
export class HistoryClient implements OnModuleInit {
  private grpc!: HistoryServiceClient;

  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    @Inject(HISTORY_CLIENT) private readonly client: ClientGrpc,
  ) {}

  onModuleInit(): void {
    this.grpc = this.client.getService<HistoryServiceClient>('HistoryService');
  }

  // ---------------------------------------------------------------------------
  // Public API — same signatures as the old HistoryService
  // ---------------------------------------------------------------------------

  async recordHistory(applicationId: string, description: string): Promise<void> {
    const snapshot = await this.captureSnapshot(applicationId);
    if (!snapshot) return;

    const snapshotBytes = Buffer.from(JSON.stringify(snapshot), 'utf-8');
    await firstValueFrom(
      this.grpc.recordHistory({ applicationId, description, snapshot: snapshotBytes })
    );
  }

  async listHistory(
    applicationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<PaginatedHistoryResponse> {
    let response;
    try {
      response = await firstValueFrom(
        this.grpc.listHistory({ applicationId, page, limit })
      );
    } catch (err) {
      console.warn(`[listHistory] gRPC call failed for ${applicationId}:`, err);
      return { entries: [], total: 0, page, limit };
    }

    const responseEntries = response.entries ?? [];
    const entries: HistoryEntryResponse[] = responseEntries.map((entry, index) => {
      const thisSnapshot = JSON.parse(
        Buffer.from(entry.snapshot).toString('utf-8')
      ) as ApplicationResponse;

      let changes: FieldChange[] = [];
      const olderEntry = responseEntries[index + 1];
      if (olderEntry) {
        const olderSnapshot = JSON.parse(
          Buffer.from(olderEntry.snapshot).toString('utf-8')
        ) as ApplicationResponse;
        changes = computeFieldDiffs(olderSnapshot, thisSnapshot);
      }

      return {
        id: entry.id,
        sequence: entry.sequence,
        description: entry.description,
        changes,
        createdAt: entry.createdAt,
      };
    });

    return { entries, total: response.total, page: response.page, limit: response.limit };
  }

  async restoreToVersion(
    applicationId: string,
    targetSequence: number
  ): Promise<ApplicationResponse | null> {
    const snapshotResp = await firstValueFrom(
      this.grpc.getSnapshotAtVersion({ applicationId, sequence: targetSequence })
    );

    if (!snapshotResp.found) return null;

    const snapshot = JSON.parse(
      Buffer.from(snapshotResp.snapshot).toString('utf-8')
    ) as ApplicationResponse;

    await this.db.transaction(async (trx) => {
      await trx
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

      await trx.delete(interviewStages).where(eq(interviewStages.applicationId, applicationId));

      if (snapshot.interviewStages && snapshot.interviewStages.length > 0) {
        await trx.insert(interviewStages).values(
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
    });

    try {
      await this.recordHistory(applicationId, buildDescription('restore_version', String(targetSequence)));
    } catch (err) {
      console.warn(`[restoreToVersion] Failed to record history for ${applicationId}:`, err);
    }

    return this.captureSnapshot(applicationId);
  }

  async deleteHistory(applicationId: string): Promise<void> {
    await firstValueFrom(this.grpc.deleteHistory({ applicationId }));
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async captureSnapshot(applicationId: string): Promise<ApplicationResponse | null> {
    const app = await this.db.query.applications.findFirst({
      where: eq(applications.id, applicationId),
      with: { interviewStages: true },
    });

    if (!app) return null;
    return toApplicationResponse(app, app.interviewStages);
  }
}

// ---------------------------------------------------------------------------
// Pure helpers — kept here so existing imports still resolve
// ---------------------------------------------------------------------------

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
