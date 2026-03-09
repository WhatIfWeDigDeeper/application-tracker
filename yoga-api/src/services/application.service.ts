import { prisma } from '../db/client.js';
import { Prisma, ApplicationStatus, CompanyCategory, JobSource } from '@prisma/client';
import { recordSnapshot } from './history.service.js';

const TERMINAL_STATUSES: ApplicationStatus[] = ['rejected', 'withdrawn'];
const SUBMITTED_STATUSES: ApplicationStatus[] = ['applied', 'interviewing', 'offer', 'rejected', 'withdrawn', 'archived'];

export interface ListFilters {
  status?: ApplicationStatus;
  companyCategory?: CompanyCategory;
  jobSource?: JobSource;
  skillsMatchMin?: number;
  includeArchived?: boolean;
  sortBy?: string;
  sortDir?: string;
}

export interface Pagination {
  page?: number;
  limit?: number;
}

export async function listApplications(filters: ListFilters = {}, pagination: Pagination = {}) {
  const page = Math.max(1, pagination.page ?? 1);
  const limit = Math.min(100, Math.max(1, pagination.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Prisma.ApplicationWhereInput = {};
  if (filters.status) where.status = filters.status;
  else if (!filters.includeArchived) where.status = { not: 'archived' };
  if (filters.companyCategory) where.companyCategory = filters.companyCategory;
  if (filters.jobSource) where.jobSource = filters.jobSource;
  if (filters.skillsMatchMin != null) where.skillsMatch = { gte: filters.skillsMatchMin };

  const validSortFields: Record<string, string> = {
    updatedAt: 'updatedAt', dateApplied: 'dateApplied',
    companyName: 'companyName', skillsMatch: 'skillsMatch',
  };
  const sortField = validSortFields[filters.sortBy ?? ''] ?? 'updatedAt';
  const sortDir = filters.sortDir === 'asc' ? 'asc' : 'desc';

  const [items, total] = await Promise.all([
    prisma.application.findMany({
      where, skip, take: limit,
      orderBy: { [sortField]: sortDir },
      include: { interviewStages: { orderBy: { stageOrder: 'asc' } } },
    }),
    prisma.application.count({ where }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getApplication(id: string) {
  const app = await prisma.application.findUnique({
    where: { id },
    include: { interviewStages: { orderBy: { stageOrder: 'asc' } } },
  });
  if (!app) throw new Error(`Application ${id} not found`);
  return app;
}

function validateInput(input: Record<string, unknown>) {
  if (input.companyName !== undefined && typeof input.companyName === 'string' && input.companyName.trim().length === 0)
    throw new Error('companyName is required');
  if (input.positionTitle !== undefined && typeof input.positionTitle === 'string' && input.positionTitle.trim().length === 0)
    throw new Error('positionTitle is required');
  if (input.skillsMatch !== undefined && input.skillsMatch !== null) {
    const v = input.skillsMatch as number;
    if (v < 0 || v > 100) throw new Error('skillsMatch must be 0-100');
  }
  if (input.salaryMin !== undefined && input.salaryMin !== null && (input.salaryMin as number) < 0)
    throw new Error('salaryMin must be non-negative');
  if (input.salaryMax !== undefined && input.salaryMax !== null && (input.salaryMax as number) < 0)
    throw new Error('salaryMax must be non-negative');
  if (input.salaryMin != null && input.salaryMax != null && (input.salaryMin as number) > (input.salaryMax as number))
    throw new Error('salaryMin must be <= salaryMax');
}

export async function createApplication(input: {
  companyName: string; positionTitle: string; status?: ApplicationStatus;
  dateApplied?: string | null; jobPostingUrl?: string | null; companyWebsiteUrl?: string | null;
  companyCategory?: CompanyCategory | null; jobSource?: JobSource | null;
  salaryMin?: number | null; salaryMax?: number | null; skillsMatch?: number | null;
  notes?: string | null; contactName?: string | null; contactEmail?: string | null; offerDueDate?: string | null;
}) {
  if (!input.companyName?.trim()) throw new Error('companyName is required');
  if (!input.positionTitle?.trim()) throw new Error('positionTitle is required');
  validateInput(input as Record<string, unknown>);

  const status = input.status ?? 'wishlist';
  let dateApplied = input.dateApplied ? new Date(input.dateApplied) : null;
  if (SUBMITTED_STATUSES.includes(status) && !dateApplied) dateApplied = new Date();
  if (status === 'wishlist') dateApplied = null;

  return prisma.$transaction(async (tx) => {
    const app = await tx.application.create({
      data: {
        companyName: input.companyName, positionTitle: input.positionTitle, status,
        dateApplied, jobPostingUrl: input.jobPostingUrl, companyWebsiteUrl: input.companyWebsiteUrl,
        companyCategory: input.companyCategory, jobSource: input.jobSource,
        salaryMin: input.salaryMin, salaryMax: input.salaryMax, skillsMatch: input.skillsMatch,
        notes: input.notes, contactName: input.contactName, contactEmail: input.contactEmail,
        offerDueDate: input.offerDueDate ? new Date(input.offerDueDate) : null,
      },
      include: { interviewStages: true },
    });
    await recordSnapshot(tx, app, Object.keys(input));
    return app;
  });
}

export async function updateApplication(id: string, input: Partial<{
  companyName: string; positionTitle: string; status: ApplicationStatus;
  dateApplied: string | null; jobPostingUrl: string | null; companyWebsiteUrl: string | null;
  companyCategory: CompanyCategory | null; jobSource: JobSource | null;
  salaryMin: number | null; salaryMax: number | null; skillsMatch: number | null;
  notes: string | null; contactName: string | null; contactEmail: string | null; offerDueDate: string | null;
}>) {
  validateInput(input as Record<string, unknown>);
  const existing = await prisma.application.findUnique({ where: { id } });
  if (!existing) throw new Error(`Application ${id} not found`);

  if (input.status && TERMINAL_STATUSES.includes(existing.status) && input.status !== existing.status)
    throw new Error(`Cannot transition from terminal status ${existing.status}`);

  const data: Prisma.ApplicationUpdateInput = {};
  const changedFields: string[] = [];

  for (const key of Object.keys(input) as Array<keyof typeof input>) {
    if (key === 'dateApplied' || key === 'offerDueDate') continue;
    if (input[key] !== undefined) { (data as Record<string, unknown>)[key] = input[key]; changedFields.push(key); }
  }

  if ('status' in input && input.status !== undefined) {
    const newStatus = input.status;
    if (newStatus === 'wishlist') {
      data.dateApplied = null; if (!changedFields.includes('dateApplied')) changedFields.push('dateApplied');
    } else if (SUBMITTED_STATUSES.includes(newStatus)) {
      if ('dateApplied' in input) {
        data.dateApplied = input.dateApplied ? new Date(input.dateApplied) : existing.dateApplied ?? new Date();
      } else if (!existing.dateApplied) {
        data.dateApplied = new Date(); changedFields.push('dateApplied');
      }
    }
  } else if ('dateApplied' in input) {
    data.dateApplied = input.dateApplied ? new Date(input.dateApplied) : null;
    changedFields.push('dateApplied');
  }

  if ('offerDueDate' in input) {
    data.offerDueDate = input.offerDueDate ? new Date(input.offerDueDate) : null;
    changedFields.push('offerDueDate');
  }

  return prisma.$transaction(async (tx) => {
    const app = await tx.application.update({
      where: { id }, data,
      include: { interviewStages: { orderBy: { stageOrder: 'asc' } } },
    });
    await recordSnapshot(tx, app, changedFields);
    return app;
  });
}

export async function deleteApplication(id: string) {
  await prisma.application.delete({ where: { id } });
  return true;
}

export async function archiveApplication(id: string) {
  return prisma.$transaction(async (tx) => {
    const app = await tx.application.update({
      where: { id }, data: { status: 'archived', isArchived: true },
      include: { interviewStages: { orderBy: { stageOrder: 'asc' } } },
    });
    await recordSnapshot(tx, app, ['status', 'isArchived']);
    return app;
  });
}

export async function restoreApplication(id: string) {
  const history = await prisma.applicationHistory.findMany({
    where: { applicationId: id }, orderBy: { sequence: 'desc' },
  });
  let previousStatus: ApplicationStatus = 'withdrawn';
  for (const h of history) {
    const snap = h.snapshot as Record<string, unknown>;
    const s = snap.status as ApplicationStatus;
    if (s && s !== 'archived') { previousStatus = s; break; }
  }
  return prisma.$transaction(async (tx) => {
    const app = await tx.application.update({
      where: { id }, data: { status: previousStatus, isArchived: false },
      include: { interviewStages: { orderBy: { stageOrder: 'asc' } } },
    });
    await recordSnapshot(tx, app, ['status', 'isArchived']);
    return app;
  });
}
