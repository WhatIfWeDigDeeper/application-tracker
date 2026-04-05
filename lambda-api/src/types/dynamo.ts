import type { ApplicationStatus, CompanyCategory, JobSource, ApplicationResponse } from './api.js';

// DynamoDB item shapes

export interface ApplicationItem {
  PK: string;            // APP#<uuid>
  SK: string;            // APP#<uuid>
  id: string;
  companyName: string;
  positionTitle: string;
  status: ApplicationStatus;
  dateApplied: string | null;
  createdAt: string;
  updatedAt: string;
  companyUrl: string | null;
  jobPostingUrl: string | null;
  companyCareerUrl: string | null;
  companyCategory: CompanyCategory | null;
  skillsMatch: number | null;
  jobSource: JobSource | null;
  coverLetterRequired: boolean | null;
  specialRequirements: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  notes: string | null;
  offerDueDate: string | null;
  isArchived: boolean;
  historySequence: number;
  // GSI keys — written on every put/update
  GSI1PK: string;        // STATUS#<status>#ARCHIVED#<0|1>
  GSI1SK: string;        // UPDATED#<updatedAt>#<id>
  GSI2PK?: string;       // ACTIVE — only present when not archived
  GSI2SK?: string;       // UPDATED#<updatedAt>#<id>
}

export interface StageItem {
  PK: string;            // APP#<uuid>
  SK: string;            // STAGE#<uuid>
  id: string;
  applicationId: string;
  name: string;
  order: number;
  isCompleted: boolean;
  completedDate: string | null;
  notes: string | null;
  performanceRating: number | null;
}

export interface HistoryItem {
  PK: string;            // APP#<uuid>
  SK: string;            // HIST#<zero-padded-seq>
  id: string;
  applicationId: string;
  sequence: number;
  description: string;
  snapshot: ApplicationResponse;
  createdAt: string;
}

export interface CountItem {
  PK: 'META';
  SK: 'COUNT';
  count: number;
}

// Key builders

export function appPK(id: string): string {
  return `APP#${id}`;
}

export function stageSK(stageId: string): string {
  return `STAGE#${stageId}`;
}

export function historySK(sequence: number): string {
  return `HIST#${String(sequence).padStart(8, '0')}`;
}

export function gsi1PK(status: ApplicationStatus, isArchived: boolean): string {
  return `STATUS#${status}#ARCHIVED#${isArchived ? 1 : 0}`;
}

export function gsiSK(updatedAt: string, id: string): string {
  return `UPDATED#${updatedAt}#${id}`;
}

export const GSI2_ACTIVE = 'ACTIVE';

// Item type guards

export function isApplicationItem(item: { SK?: string }): item is ApplicationItem {
  return typeof item.SK === 'string' && item.SK.startsWith('APP#');
}

export function isStageItem(item: { SK?: string }): item is StageItem {
  return typeof item.SK === 'string' && item.SK.startsWith('STAGE#');
}

export function isHistoryItem(item: { SK?: string }): item is HistoryItem {
  return typeof item.SK === 'string' && item.SK.startsWith('HIST#');
}
