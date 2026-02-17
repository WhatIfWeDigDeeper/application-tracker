import { eq, and, sql, asc, desc, gte, inArray } from 'drizzle-orm';
import { db } from '../db/client';
import { applications, interviewStages, type DbApplication, type DbInterviewStage } from '../db/schema';
import type { Application } from '~~/shared/types';
import type { z } from 'zod';
import type { ListApplicationsQuerySchema, CreateApplicationSchema, UpdateApplicationSchema } from '../utils/validation';

type ListApplicationsQuery = z.infer<typeof ListApplicationsQuerySchema>;
type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;
type UpdateApplicationInput = z.infer<typeof UpdateApplicationSchema>;

// Helper to format date for response
function formatDate(date: string | Date | null): string | null {
  if (!date) return null;
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
}

// Helper to format datetime for response
function formatDateTime(date: Date | null): string {
  if (!date) return new Date().toISOString();
  return date.toISOString();
}

// Transform DB application to API response
function toApplicationResponse(app: DbApplication, stages: DbInterviewStage[]): Application {
  return {
    id: app.id,
    companyName: app.companyName,
    positionTitle: app.positionTitle,
    dateApplied: formatDate(app.dateApplied),
    status: app.status,
    createdAt: formatDateTime(app.createdAt),
    updatedAt: formatDateTime(app.updatedAt),
    companyUrl: app.companyUrl,
    jobPostingUrl: app.jobPostingUrl,
    companyCareerUrl: app.companyCareerUrl,
    companyCategory: app.companyCategory,
    skillsMatch: app.skillsMatch,
    jobSource: app.jobSource,
    coverLetterRequired: app.coverLetterRequired,
    specialRequirements: app.specialRequirements,
    salaryMin: app.salaryMin,
    salaryMax: app.salaryMax,
    notes: app.notes,
    offerDueDate: formatDate(app.offerDueDate),
    isArchived: app.isArchived,
    interviewStages: stages
      .sort((a, b) => a.order - b.order)
      .map((s) => ({
        id: s.id,
        name: s.name,
        order: s.order,
        isCompleted: s.isCompleted,
        completedDate: formatDate(s.completedDate),
        notes: s.notes,
        performanceRating: s.performanceRating,
      })),
  };
}

export async function listApplications(query: ListApplicationsQuery): Promise<{ items: Application[]; page: number; limit: number; total: number }> {
  const { status, companyCategory, jobSource, skillsMatchMin, includeArchived, sortBy, sortDir, page, limit } = query;

  // Build conditions
  const conditions = [];

  if (!includeArchived) {
    conditions.push(eq(applications.isArchived, false));
  }

  if (status) {
    const statuses = status.split(',').map((s) => s.trim()) as DbApplication['status'][];
    conditions.push(inArray(applications.status, statuses));
  }

  if (companyCategory) {
    conditions.push(eq(applications.companyCategory, companyCategory));
  }

  if (jobSource) {
    conditions.push(eq(applications.jobSource, jobSource));
  }

  if (skillsMatchMin) {
    conditions.push(gte(applications.skillsMatch, skillsMatchMin));
  }

  // Build order
  const sortColumn = {
    dateApplied: applications.dateApplied,
    companyName: applications.companyName,
    updatedAt: applications.updatedAt,
  }[sortBy];

  const orderFn = sortDir === 'asc' ? asc : desc;

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(applications)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const total = Number(countResult[0]?.count || 0);

  // Get paginated results
  const offset = (page - 1) * limit;
  const apps = await db.query.applications.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: sortBy === 'dateApplied'
      ? [sql`${sortColumn} ${sql.raw(sortDir === 'asc' ? 'ASC' : 'DESC')} NULLS LAST`]
      : [orderFn(sortColumn)],
    limit,
    offset,
    with: {
      interviewStages: true,
    },
  });

  return {
    items: apps.map((app) => toApplicationResponse(app, app.interviewStages)),
    page,
    limit,
    total,
  };
}

export async function getApplication(id: string): Promise<Application | null> {
  const app = await db.query.applications.findFirst({
    where: eq(applications.id, id),
    with: {
      interviewStages: true,
    },
  });

  if (!app) return null;
  return toApplicationResponse(app, app.interviewStages);
}

export async function createApplication(input: CreateApplicationInput): Promise<Application> {
  // Default status is 'unsubmitted' (DB default); force dateApplied to null for unsubmitted
  const dateApplied = null;

  const [app] = await db
    .insert(applications)
    .values({
      companyName: input.companyName,
      positionTitle: input.positionTitle,
      dateApplied,
      companyUrl: input.companyUrl || null,
      jobPostingUrl: input.jobPostingUrl || null,
      companyCareerUrl: input.companyCareerUrl || null,
      companyCategory: input.companyCategory || null,
      skillsMatch: input.skillsMatch || null,
      jobSource: input.jobSource || null,
      coverLetterRequired: input.coverLetterRequired ?? null,
      specialRequirements: input.specialRequirements || null,
      salaryMin: input.salaryMin || null,
      salaryMax: input.salaryMax || null,
      notes: input.notes || null,
    })
    .returning();

  return toApplicationResponse(app, []);
}

export async function updateApplication(id: string, input: UpdateApplicationInput): Promise<Application | null> {
  const existing = await db.query.applications.findFirst({
    where: eq(applications.id, id),
  });

  if (!existing) return null;

  const updateValues: Partial<typeof applications.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.companyName !== undefined) updateValues.companyName = input.companyName;
  if (input.positionTitle !== undefined) updateValues.positionTitle = input.positionTitle;
  if (input.dateApplied !== undefined) updateValues.dateApplied = input.dateApplied;
  if (input.status !== undefined) updateValues.status = input.status;

  // If status is being set to 'unsubmitted', force dateApplied to null
  if (input.status === 'unsubmitted') {
    updateValues.dateApplied = null;
  }
  if (input.companyUrl !== undefined) updateValues.companyUrl = input.companyUrl;
  if (input.jobPostingUrl !== undefined) updateValues.jobPostingUrl = input.jobPostingUrl;
  if (input.companyCareerUrl !== undefined) updateValues.companyCareerUrl = input.companyCareerUrl;
  if (input.companyCategory !== undefined) updateValues.companyCategory = input.companyCategory;
  if (input.skillsMatch !== undefined) updateValues.skillsMatch = input.skillsMatch;
  if (input.jobSource !== undefined) updateValues.jobSource = input.jobSource;
  if (input.coverLetterRequired !== undefined) updateValues.coverLetterRequired = input.coverLetterRequired;
  if (input.specialRequirements !== undefined) updateValues.specialRequirements = input.specialRequirements;
  if (input.salaryMin !== undefined) updateValues.salaryMin = input.salaryMin;
  if (input.salaryMax !== undefined) updateValues.salaryMax = input.salaryMax;
  if (input.notes !== undefined) updateValues.notes = input.notes;
  if (input.offerDueDate !== undefined) updateValues.offerDueDate = input.offerDueDate;

  const [updated] = await db.update(applications).set(updateValues).where(eq(applications.id, id)).returning();

  const stages = await db.query.interviewStages.findMany({
    where: eq(interviewStages.applicationId, id),
  });

  return toApplicationResponse(updated, stages);
}

export async function deleteApplication(id: string): Promise<boolean> {
  const result = await db.delete(applications).where(eq(applications.id, id)).returning({ id: applications.id });
  return result.length > 0;
}

export async function archiveApplication(id: string): Promise<Application | null> {
  const [updated] = await db
    .update(applications)
    .set({ isArchived: true, updatedAt: new Date() })
    .where(eq(applications.id, id))
    .returning();

  if (!updated) return null;

  const stages = await db.query.interviewStages.findMany({
    where: eq(interviewStages.applicationId, id),
  });

  return toApplicationResponse(updated, stages);
}

export async function restoreApplication(id: string): Promise<Application | null> {
  const [updated] = await db
    .update(applications)
    .set({ isArchived: false, updatedAt: new Date() })
    .where(eq(applications.id, id))
    .returning();

  if (!updated) return null;

  const stages = await db.query.interviewStages.findMany({
    where: eq(interviewStages.applicationId, id),
  });

  return toApplicationResponse(updated, stages);
}
