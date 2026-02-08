// Re-export all types from shared types (single source of truth in nuxt-api)
export type {
  ApplicationStatus,
  CompanyCategory,
  JobSource,
  InterviewStage,
  Application,
  CreateApplicationInput,
  UpdateApplicationInput,
  CreateInterviewStageInput,
  UpdateInterviewStageInput,
  PaginatedResponse,
  FilterState,
} from '@shared/types';

export {
  APPLICATION_STATUSES,
  COMPANY_CATEGORIES,
  JOB_SOURCES,
} from '@shared/types';
