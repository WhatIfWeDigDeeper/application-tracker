import { builder } from './builder.js';
import { ApplicationStatusEnum, CompanyCategoryEnum, JobSourceEnum } from './enums.js';
import type { Prisma } from '@prisma/client';

type InterviewStageModel = Prisma.InterviewStageGetPayload<Record<string, never>>;
type HistoryEntryModel = Prisma.ApplicationHistoryGetPayload<Record<string, never>>;
type ApplicationModel = Prisma.ApplicationGetPayload<Record<string, never>>;

export interface ApplicationListResult {
  items: Prisma.ApplicationGetPayload<{ include: { interviewStages: true } }>[];
  total: number;
  page: number;
  totalPages: number;
}

export interface HistoryListResult {
  items: HistoryEntryModel[];
  total: number;
  page: number;
  totalPages: number;
}

export const ApplicationListRef = builder.objectRef<ApplicationListResult>('ApplicationList');
export const HistoryListRef = builder.objectRef<HistoryListResult>('HistoryList');

export const ApplicationType = builder.prismaObject('Application', {
  fields: (t) => ({
    id: t.exposeID('id'),
    companyName: t.exposeString('companyName'),
    positionTitle: t.exposeString('positionTitle'),
    status: t.expose('status', { type: ApplicationStatusEnum }),
    dateApplied: t.field({
      type: 'String',
      nullable: true,
      resolve: (a: ApplicationModel) =>
        a.dateApplied ? a.dateApplied.toISOString().split('T')[0] : null,
    }),
    jobPostingUrl: t.exposeString('jobPostingUrl', { nullable: true }),
    companyUrl: t.exposeString('companyUrl', { nullable: true }),
    companyCareerUrl: t.exposeString('companyCareerUrl', { nullable: true }),
    companyCategory: t.expose('companyCategory', { type: CompanyCategoryEnum, nullable: true }),
    jobSource: t.expose('jobSource', { type: JobSourceEnum, nullable: true }),
    salaryMin: t.exposeInt('salaryMin', { nullable: true }),
    salaryMax: t.exposeInt('salaryMax', { nullable: true }),
    skillsMatch: t.exposeInt('skillsMatch', { nullable: true }),
    coverLetterRequired: t.exposeBoolean('coverLetterRequired'),
    specialRequirements: t.exposeString('specialRequirements', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    offerDueDate: t.field({
      type: 'String',
      nullable: true,
      resolve: (a: ApplicationModel) =>
        a.offerDueDate ? a.offerDueDate.toISOString().split('T')[0] : null,
    }),
    isArchived: t.exposeBoolean('isArchived'),
    createdAt: t.field({ type: 'String', resolve: (a: ApplicationModel) => a.createdAt.toISOString() }),
    updatedAt: t.field({ type: 'String', resolve: (a: ApplicationModel) => a.updatedAt.toISOString() }),
    interviewStages: t.relation('interviewStages', { query: { orderBy: { order: 'asc' } } }),
  }),
});

export const InterviewStageType = builder.prismaObject('InterviewStage', {
  fields: (t) => ({
    id: t.exposeID('id'),
    applicationId: t.exposeString('applicationId'),
    name: t.exposeString('name'),
    order: t.exposeInt('order'),
    isCompleted: t.exposeBoolean('isCompleted'),
    completedDate: t.field({
      type: 'String',
      nullable: true,
      resolve: (s: InterviewStageModel) =>
        s.completedDate ? s.completedDate.toISOString().split('T')[0] : null,
    }),
    notes: t.exposeString('notes', { nullable: true }),
    performanceRating: t.exposeInt('performanceRating', { nullable: true }),
    createdAt: t.field({ type: 'String', resolve: (s: InterviewStageModel) => s.createdAt.toISOString() }),
    updatedAt: t.field({ type: 'String', resolve: (s: InterviewStageModel) => s.updatedAt.toISOString() }),
  }),
});

export const HistoryEntryType = builder.prismaObject('ApplicationHistory', {
  name: 'HistoryEntry',
  fields: (t) => ({
    id: t.exposeID('id'),
    applicationId: t.exposeString('applicationId'),
    sequence: t.exposeInt('sequence'),
    snapshot: t.field({ type: 'String', resolve: (h: HistoryEntryModel) => JSON.stringify(h.snapshot) }),
    changedFields: t.field({ type: 'String', resolve: (h: HistoryEntryModel) => JSON.stringify(h.changedFields) }),
    createdAt: t.field({ type: 'String', resolve: (h: HistoryEntryModel) => h.createdAt.toISOString() }),
  }),
});

ApplicationListRef.implement({
  fields: (t) => ({
    items: t.field({
      type: [ApplicationType],
      resolve: (r: ApplicationListResult) => r.items,
    }),
    total: t.int({ resolve: (r: ApplicationListResult) => r.total }),
    page: t.int({ resolve: (r: ApplicationListResult) => r.page }),
    totalPages: t.int({ resolve: (r: ApplicationListResult) => r.totalPages }),
  }),
});

HistoryListRef.implement({
  fields: (t) => ({
    items: t.field({
      type: [HistoryEntryType],
      resolve: (r: HistoryListResult) => r.items,
    }),
    total: t.int({ resolve: (r: HistoryListResult) => r.total }),
    page: t.int({ resolve: (r: HistoryListResult) => r.page }),
    totalPages: t.int({ resolve: (r: HistoryListResult) => r.totalPages }),
  }),
});
