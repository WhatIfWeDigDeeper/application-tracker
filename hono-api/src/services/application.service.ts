import { eq, and, sql, asc, desc, gte, inArray } from 'drizzle-orm';
import { db } from '../db/client.js';
import { applications, interviewStages, type Application } from '../db/schema.js';
import type {
  CreateApplicationInput,
  UpdateApplicationInput,
  ListApplicationsQuery,
  ApplicationResponse,
  PaginatedApplicationsResponse,
} from '../types/api.js';
import { toApplicationResponse } from './shared.js';
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

export async function listApplications(query: ListApplicationsQuery): Promise<PaginatedApplicationsResponse> {
  const { status, companyCategory, jobSource, skillsMatchMin, includeArchived, sortBy, sortDir, page, limit } = query;

  // Build conditions
  const conditions = [];

  if (!includeArchived) {
    conditions.push(eq(applications.isArchived, false));
  }

  if (status) {
    const statuses = status.split(',').map((s) => s.trim()) as Application['status'][];
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
    orderBy: [orderFn(sortColumn)],
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

export async function getApplication(id: string): Promise<ApplicationResponse | null> {
  const app = await db.query.applications.findFirst({
    where: eq(applications.id, id),
    with: {
      interviewStages: true,
    },
  });

  if (!app) return null;
  return toApplicationResponse(app, app.interviewStages);
}

export async function createApplication(input: CreateApplicationInput): Promise<ApplicationResponse> {
  const dateApplied = input.dateApplied || new Date().toISOString().split('T')[0];

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

  await recordHistory(app.id, buildDescription('create', `${app.companyName} - ${app.positionTitle}`));

  return toApplicationResponse(app, []);
}

export async function updateApplication(id: string, input: UpdateApplicationInput): Promise<ApplicationResponse | null> {
  // Check if exists
  const existing = await db.query.applications.findFirst({
    where: eq(applications.id, id),
  });

  if (!existing) return null;

  // Build update values
  const updateValues: Partial<typeof applications.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.companyName !== undefined) updateValues.companyName = input.companyName;
  if (input.positionTitle !== undefined) updateValues.positionTitle = input.positionTitle;
  if (input.dateApplied !== undefined) updateValues.dateApplied = input.dateApplied;
  if (input.status !== undefined) updateValues.status = input.status;
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

  // Record history after update (snapshot captures post-mutation state)
  const changedFields = Object.keys(input)
    .filter((key) => key in FIELD_LABELS_MAP)
    .map((key) => FIELD_LABELS_MAP[key]);
  if (changedFields.length > 0) {
    await recordHistory(id, buildDescription('update', changedFields.join(', ')));
  }

  return toApplicationResponse(updated, stages);
}

export async function deleteApplication(id: string): Promise<boolean> {
  await recordHistory(id, buildDescription('delete'));

  const result = await db.delete(applications).where(eq(applications.id, id)).returning({ id: applications.id });
  return result.length > 0;
}

export async function archiveApplication(id: string): Promise<ApplicationResponse | null> {
  const [updated] = await db
    .update(applications)
    .set({ isArchived: true, updatedAt: new Date() })
    .where(eq(applications.id, id))
    .returning();

  if (!updated) return null;

  const stages = await db.query.interviewStages.findMany({
    where: eq(interviewStages.applicationId, id),
  });

  await recordHistory(id, buildDescription('archive'));

  return toApplicationResponse(updated, stages);
}

export async function restoreApplication(id: string): Promise<ApplicationResponse | null> {
  const [updated] = await db
    .update(applications)
    .set({ isArchived: false, updatedAt: new Date() })
    .where(eq(applications.id, id))
    .returning();

  if (!updated) return null;

  const stages = await db.query.interviewStages.findMany({
    where: eq(interviewStages.applicationId, id),
  });

  await recordHistory(id, buildDescription('restore'));

  return toApplicationResponse(updated, stages);
}
