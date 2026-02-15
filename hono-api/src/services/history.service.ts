import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { applicationHistory, applications, interviewStages } from '../db/schema.js';
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

export async function captureSnapshot(applicationId: string): Promise<ApplicationResponse | null> {
  const app = await db.query.applications.findFirst({
    where: eq(applications.id, applicationId),
    with: { interviewStages: true },
  });

  if (!app) return null;
  return toApplicationResponse(app, app.interviewStages);
}

export async function getNextSequence(applicationId: string): Promise<number> {
  const result = await db
    .select({ maxSeq: sql<number>`coalesce(max(${applicationHistory.sequence}), 0)` })
    .from(applicationHistory)
    .where(eq(applicationHistory.applicationId, applicationId));

  return Number(result[0]?.maxSeq ?? 0) + 1;
}

export async function recordHistory(applicationId: string, description: string): Promise<void> {
  const snapshot = await captureSnapshot(applicationId);
  if (!snapshot) return;

  const sequence = await getNextSequence(applicationId);

  await db.insert(applicationHistory).values({
    applicationId,
    sequence,
    description,
    snapshot,
  });
}

export async function listHistory(
  applicationId: string,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedHistoryResponse> {
  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(applicationHistory)
    .where(eq(applicationHistory.applicationId, applicationId));

  const total = Number(countResult[0]?.count || 0);

  // Get paginated entries (newest first)
  const offset = (page - 1) * limit;
  const rows = await db
    .select()
    .from(applicationHistory)
    .where(eq(applicationHistory.applicationId, applicationId))
    .orderBy(desc(applicationHistory.sequence))
    .limit(limit)
    .offset(offset);

  // Build entries with diffs
  // Each entry's snapshot = state AFTER that change.
  // To show what changed, compare the previous entry's snapshot (before) to this entry's snapshot (after).
  // Entries are sorted newest first: [newest, ..., oldest]
  const entries: HistoryEntryResponse[] = rows.map((row, index) => {
    const thisSnapshot = row.snapshot as ApplicationResponse;
    let changes: FieldChange[] = [];

    // The "before" state is the next item in the array (older entry), or empty for the first-ever entry
    const olderRow = rows[index + 1];
    if (olderRow) {
      const olderSnapshot = olderRow.snapshot as ApplicationResponse;
      changes = computeFieldDiffs(olderSnapshot, thisSnapshot);
    }
    // For the oldest entry (creation), changes stays empty — no "before" to compare against

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

export async function restoreToVersion(
  applicationId: string,
  targetSequence: number
): Promise<ApplicationResponse | null> {
  // Find the history entry
  const entry = await db.query.applicationHistory.findFirst({
    where: and(
      eq(applicationHistory.applicationId, applicationId),
      eq(applicationHistory.sequence, targetSequence)
    ),
  });

  if (!entry) return null;

  const snapshot = entry.snapshot as ApplicationResponse;

  // Overwrite the applications row with snapshot values
  await db
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

  // Delete all current interview stages for this app
  await db.delete(interviewStages).where(eq(interviewStages.applicationId, applicationId));

  // Re-insert stages from snapshot
  if (snapshot.interviewStages && snapshot.interviewStages.length > 0) {
    await db.insert(interviewStages).values(
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

  // Record history after restore (snapshot captures post-restore state)
  await recordHistory(applicationId, buildDescription('restore_version', String(targetSequence)));

  // Return the restored state
  return captureSnapshot(applicationId);
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

  // Compare interview stages
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
