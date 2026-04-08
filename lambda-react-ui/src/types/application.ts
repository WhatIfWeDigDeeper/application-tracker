export type ApplicationStatus =
  | 'unsubmitted'
  | 'applied'
  | 'rejected'
  | 'interviewing'
  | 'given offer'
  | 'accepted offer'
  | 'declined offer'
  | 'no offer';

export type CompanyCategory =
  | 'education'
  | 'health'
  | 'climate'
  | 'ai'
  | 'energy'
  | 'finance'
  | 'enterprise-software'
  | 'consumer-tech'
  | 'e-commerce'
  | 'cybersecurity'
  | 'gaming'
  | 'media-entertainment'
  | 'consulting'
  | 'government'
  | 'nonprofit'
  | 'retail'
  | 'restaurant'
  | 'hospitality'
  | 'other';

export type JobSource =
  | 'recruiter'
  | 'linkedin'
  | 'indeed'
  | 'friend'
  | 'colleague'
  | 'company-website'
  | 'other';

export interface InterviewStage {
  id: string;
  name: string;
  order: number;
  isCompleted: boolean;
  completedDate: string | null;
  notes: string | null;
  performanceRating: number | null;
}

export interface Application {
  id: string;
  companyName: string;
  positionTitle: string;
  dateApplied: string | null;
  status: ApplicationStatus;
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
  interviewStages: InterviewStage[];
}

export interface PaginatedApplicationsResponse {
  items: Application[];
  page: number;
  limit: number;
  total: number;
}

export interface CursorPaginatedApplicationsResponse {
  items: Application[];
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface FieldChange {
  field: string;
  label: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface HistoryEntry {
  id: string;
  sequence: number;
  description: string;
  changes: FieldChange[];
  createdAt: string;
}

export interface PaginatedHistoryResponse {
  entries: HistoryEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface FilterState {
  status: ApplicationStatus[];
  companyCategory: CompanyCategory | undefined;
  jobSource: JobSource | undefined;
  skillsMatchMin: number | undefined;
  includeArchived: boolean;
}

export interface SortState {
  sortBy: 'dateApplied' | 'companyName' | 'updatedAt';
  sortDir: 'asc' | 'desc';
}

export interface ImportResult {
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export interface CreateApplicationInput {
  companyName: string;
  positionTitle: string;
  dateApplied?: string;
  status?: ApplicationStatus;
  companyUrl?: string;
  jobPostingUrl?: string;
  companyCareerUrl?: string;
  companyCategory?: CompanyCategory;
  skillsMatch?: number;
  jobSource?: JobSource;
  coverLetterRequired?: boolean;
  specialRequirements?: string;
  salaryMin?: number;
  salaryMax?: number;
  notes?: string;
  offerDueDate?: string;
}

export type UpdateApplicationInput = Partial<
  Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'interviewStages'>
>;

export interface CreateInterviewStageInput {
  name: string;
  order: number;
  isCompleted?: boolean;
  completedDate?: string;
  notes?: string;
  performanceRating?: number;
}

export interface UpdateInterviewStageInput {
  name?: string;
  order?: number;
  isCompleted?: boolean;
  completedDate?: string | null;
  notes?: string | null;
  performanceRating?: number | null;
}
