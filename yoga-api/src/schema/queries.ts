import { builder } from './builder.js';
import { ApplicationStatusEnum, CompanyCategoryEnum, JobSourceEnum } from './enums.js';
import { ApplicationType, ApplicationListRef, HistoryListRef } from './types.js';
import { listApplications, getApplication } from '../services/application.service.js';
import { listHistory } from '../services/history.service.js';

builder.queryFields((t) => ({
  applications: t.field({
    type: ApplicationListRef,
    args: {
      status: t.arg({ type: ApplicationStatusEnum, required: false }),
      companyCategory: t.arg({ type: CompanyCategoryEnum, required: false }),
      jobSource: t.arg({ type: JobSourceEnum, required: false }),
      skillsMatchMin: t.arg.int({ required: false }),
      includeArchived: t.arg.boolean({ required: false }),
      sortBy: t.arg.string({ required: false }),
      sortDir: t.arg.string({ required: false }),
      page: t.arg.int({ required: false }),
      limit: t.arg.int({ required: false }),
    },
    resolve: (_root, args) => listApplications(
      {
        status: args.status ?? undefined,
        companyCategory: args.companyCategory ?? undefined,
        jobSource: args.jobSource ?? undefined,
        skillsMatchMin: args.skillsMatchMin ?? undefined,
        includeArchived: args.includeArchived ?? false,
        sortBy: args.sortBy ?? undefined,
        sortDir: args.sortDir ?? undefined,
      },
      { page: args.page ?? 1, limit: args.limit ?? 20 }
    ),
  }),
  application: t.field({
    type: ApplicationType, nullable: true,
    args: { id: t.arg.id({ required: true }) },
    resolve: (_root, args) => getApplication(args.id).catch(() => null),
  }),
  applicationHistory: t.field({
    type: HistoryListRef,
    args: {
      applicationId: t.arg.id({ required: true }),
      page: t.arg.int({ required: false }),
      limit: t.arg.int({ required: false }),
    },
    resolve: (_root, args) => listHistory(args.applicationId, args.page ?? 1, args.limit ?? 20),
  }),
}));
