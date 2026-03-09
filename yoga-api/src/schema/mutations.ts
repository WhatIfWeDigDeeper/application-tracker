import { builder } from './builder.js';
import { ApplicationStatusEnum, CompanyCategoryEnum, JobSourceEnum } from './enums.js';
import { ApplicationType, InterviewStageType } from './types.js';
import {
  createApplication, updateApplication, deleteApplication,
  archiveApplication, restoreApplication,
} from '../services/application.service.js';
import { createStage, updateStage, deleteStage } from '../services/stages.service.js';
import { restoreToSnapshot } from '../services/history.service.js';
import type { ApplicationStatus, CompanyCategory, JobSource } from '@prisma/client';

const CreateApplicationInput = builder.inputType('CreateApplicationInput', {
  fields: (t) => ({
    companyName: t.string({ required: true }),
    positionTitle: t.string({ required: true }),
    status: t.field({ type: ApplicationStatusEnum, required: false }),
    dateApplied: t.string({ required: false }),
    jobPostingUrl: t.string({ required: false }),
    companyWebsiteUrl: t.string({ required: false }),
    companyCategory: t.field({ type: CompanyCategoryEnum, required: false }),
    jobSource: t.field({ type: JobSourceEnum, required: false }),
    salaryMin: t.int({ required: false }),
    salaryMax: t.int({ required: false }),
    skillsMatch: t.int({ required: false }),
    notes: t.string({ required: false }),
    contactName: t.string({ required: false }),
    contactEmail: t.string({ required: false }),
    offerDueDate: t.string({ required: false }),
  }),
});

const UpdateApplicationInput = builder.inputType('UpdateApplicationInput', {
  fields: (t) => ({
    companyName: t.string({ required: false }),
    positionTitle: t.string({ required: false }),
    status: t.field({ type: ApplicationStatusEnum, required: false }),
    dateApplied: t.string({ required: false }),
    jobPostingUrl: t.string({ required: false }),
    companyWebsiteUrl: t.string({ required: false }),
    companyCategory: t.field({ type: CompanyCategoryEnum, required: false }),
    jobSource: t.field({ type: JobSourceEnum, required: false }),
    salaryMin: t.int({ required: false }),
    salaryMax: t.int({ required: false }),
    skillsMatch: t.int({ required: false }),
    notes: t.string({ required: false }),
    contactName: t.string({ required: false }),
    contactEmail: t.string({ required: false }),
    offerDueDate: t.string({ required: false }),
  }),
});

const StageInput = builder.inputType('StageInput', {
  fields: (t) => ({
    stageName: t.string({ required: true }),
    stageOrder: t.int({ required: true }),
    scheduledDate: t.string({ required: false }),
    notes: t.string({ required: false }),
  }),
});

builder.mutationFields((t) => ({
  createApplication: t.field({
    type: ApplicationType,
    args: { input: t.arg({ type: CreateApplicationInput, required: true }) },
    resolve: (_root, args) => createApplication({
      companyName: args.input.companyName,
      positionTitle: args.input.positionTitle,
      status: (args.input.status as ApplicationStatus) ?? undefined,
      dateApplied: args.input.dateApplied ?? null,
      jobPostingUrl: args.input.jobPostingUrl ?? null,
      companyWebsiteUrl: args.input.companyWebsiteUrl ?? null,
      companyCategory: (args.input.companyCategory as CompanyCategory) ?? null,
      jobSource: (args.input.jobSource as JobSource) ?? null,
      salaryMin: args.input.salaryMin ?? null,
      salaryMax: args.input.salaryMax ?? null,
      skillsMatch: args.input.skillsMatch ?? null,
      notes: args.input.notes ?? null,
      contactName: args.input.contactName ?? null,
      contactEmail: args.input.contactEmail ?? null,
      offerDueDate: args.input.offerDueDate ?? null,
    }),
  }),
  updateApplication: t.field({
    type: ApplicationType,
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateApplicationInput, required: true }),
    },
    resolve: (_root, args) => updateApplication(args.id, {
      ...(args.input.companyName != null && { companyName: args.input.companyName }),
      ...(args.input.positionTitle != null && { positionTitle: args.input.positionTitle }),
      ...(args.input.status != null && { status: args.input.status as ApplicationStatus }),
      ...(args.input.dateApplied !== undefined && { dateApplied: args.input.dateApplied }),
      ...(args.input.jobPostingUrl !== undefined && { jobPostingUrl: args.input.jobPostingUrl }),
      ...(args.input.companyWebsiteUrl !== undefined && { companyWebsiteUrl: args.input.companyWebsiteUrl }),
      ...(args.input.companyCategory !== undefined && { companyCategory: args.input.companyCategory as CompanyCategory }),
      ...(args.input.jobSource !== undefined && { jobSource: args.input.jobSource as JobSource }),
      ...(args.input.salaryMin !== undefined && { salaryMin: args.input.salaryMin }),
      ...(args.input.salaryMax !== undefined && { salaryMax: args.input.salaryMax }),
      ...(args.input.skillsMatch !== undefined && { skillsMatch: args.input.skillsMatch }),
      ...(args.input.notes !== undefined && { notes: args.input.notes }),
      ...(args.input.contactName !== undefined && { contactName: args.input.contactName }),
      ...(args.input.contactEmail !== undefined && { contactEmail: args.input.contactEmail }),
      ...(args.input.offerDueDate !== undefined && { offerDueDate: args.input.offerDueDate }),
    }),
  }),
  deleteApplication: t.boolean({
    args: { id: t.arg.id({ required: true }) },
    resolve: (_root, args) => deleteApplication(args.id),
  }),
  archiveApplication: t.field({
    type: ApplicationType,
    args: { id: t.arg.id({ required: true }) },
    resolve: (_root, args) => archiveApplication(args.id),
  }),
  restoreApplication: t.field({
    type: ApplicationType,
    args: { id: t.arg.id({ required: true }) },
    resolve: (_root, args) => restoreApplication(args.id),
  }),
  createStage: t.field({
    type: InterviewStageType,
    args: {
      applicationId: t.arg.id({ required: true }),
      input: t.arg({ type: StageInput, required: true }),
    },
    resolve: (_root, args) => createStage(args.applicationId, {
      stageName: args.input.stageName, stageOrder: args.input.stageOrder,
      scheduledDate: args.input.scheduledDate ?? null, notes: args.input.notes ?? null,
    }),
  }),
  updateStage: t.field({
    type: InterviewStageType,
    args: {
      applicationId: t.arg.id({ required: true }),
      stageId: t.arg.id({ required: true }),
      input: t.arg({ type: StageInput, required: true }),
    },
    resolve: (_root, args) => updateStage(args.applicationId, args.stageId, {
      stageName: args.input.stageName, stageOrder: args.input.stageOrder,
      scheduledDate: args.input.scheduledDate ?? null, notes: args.input.notes ?? null,
    }),
  }),
  deleteStage: t.boolean({
    args: { applicationId: t.arg.id({ required: true }), stageId: t.arg.id({ required: true }) },
    resolve: (_root, args) => deleteStage(args.applicationId, args.stageId),
  }),
  restoreHistory: t.field({
    type: ApplicationType,
    args: { applicationId: t.arg.id({ required: true }), sequence: t.arg.int({ required: true }) },
    resolve: (_root, args) => restoreToSnapshot(args.applicationId, args.sequence),
  }),
}));
