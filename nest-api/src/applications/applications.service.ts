import { Injectable, Inject } from '@nestjs/common';
import { eq, and, sql, asc, desc, gte, inArray } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.provider.js';
import { applications, interviewStages, type Application } from '../database/schema.js';
import type {
  CreateApplicationInput,
  UpdateApplicationInput,
  ListApplicationsQuery,
  ApplicationResponse,
  PaginatedApplicationsResponse,
} from '../types/api.js';
import { toApplicationResponse } from './shared.js';
import { HistoryService, buildDescription } from './history.service.js';

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

@Injectable()
export class ApplicationsService {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    @Inject(HistoryService) private historyService: HistoryService,
  ) {}

  async listApplications(query: ListApplicationsQuery): Promise<PaginatedApplicationsResponse> {
    const { status, companyCategory, jobSource, skillsMatchMin, includeArchived, sortBy, sortDir, page, limit } = query;

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

    const sortColumn = {
      dateApplied: applications.dateApplied,
      companyName: applications.companyName,
      updatedAt: applications.updatedAt,
    }[sortBy];

    const orderFn = sortDir === 'asc' ? asc : desc;

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(applications)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count || 0);

    const offset = (page - 1) * limit;
    const orderExpr = sortBy === 'dateApplied'
      ? sql`${sortColumn} ${sql.raw(sortDir === 'asc' ? 'ASC' : 'DESC')} NULLS LAST`
      : orderFn(sortColumn);
    const apps = await this.db.query.applications.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [orderExpr],
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

  async getApplication(id: string): Promise<ApplicationResponse | null> {
    const app = await this.db.query.applications.findFirst({
      where: eq(applications.id, id),
      with: {
        interviewStages: true,
      },
    });

    if (!app) return null;
    return toApplicationResponse(app, app.interviewStages);
  }

  async createApplication(input: CreateApplicationInput): Promise<ApplicationResponse> {
    // Default status is 'unsubmitted' (DB default); force dateApplied to null for unsubmitted
    const dateApplied = null;

    const [app] = await this.db
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

    await this.historyService.recordHistory(app.id, buildDescription('create', `${app.companyName} - ${app.positionTitle}`));

    return toApplicationResponse(app, []);
  }

  async updateApplication(id: string, input: UpdateApplicationInput): Promise<ApplicationResponse | null> {
    const existing = await this.db.query.applications.findFirst({
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

    const [updated] = await this.db.update(applications).set(updateValues).where(eq(applications.id, id)).returning();

    const stages = await this.db.query.interviewStages.findMany({
      where: eq(interviewStages.applicationId, id),
    });

    const changedFields = Object.keys(input)
      .filter((key) => key in FIELD_LABELS_MAP)
      .map((key) => FIELD_LABELS_MAP[key]);
    if (changedFields.length > 0) {
      await this.historyService.recordHistory(id, buildDescription('update', changedFields.join(', ')));
    }

    return toApplicationResponse(updated, stages);
  }

  async deleteApplication(id: string): Promise<boolean> {
    await this.historyService.recordHistory(id, buildDescription('delete'));

    const result = await this.db.delete(applications).where(eq(applications.id, id)).returning({ id: applications.id });
    return result.length > 0;
  }

  async archiveApplication(id: string): Promise<ApplicationResponse | null> {
    const [updated] = await this.db
      .update(applications)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();

    if (!updated) return null;

    const stages = await this.db.query.interviewStages.findMany({
      where: eq(interviewStages.applicationId, id),
    });

    await this.historyService.recordHistory(id, buildDescription('archive'));

    return toApplicationResponse(updated, stages);
  }

  async restoreApplication(id: string): Promise<ApplicationResponse | null> {
    const [updated] = await this.db
      .update(applications)
      .set({ isArchived: false, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();

    if (!updated) return null;

    const stages = await this.db.query.interviewStages.findMany({
      where: eq(interviewStages.applicationId, id),
    });

    await this.historyService.recordHistory(id, buildDescription('restore'));

    return toApplicationResponse(updated, stages);
  }
}
