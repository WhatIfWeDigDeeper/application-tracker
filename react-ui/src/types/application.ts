export type ApplicationStatus =
  | "unsubmitted"
  | "applied"
  | "rejected"
  | "interviewing"
  | "given offer"
  | "accepted offer"
  | "declined offer"
  | "no offer";

export type CompanyCategory =
  | "education"
  | "health"
  | "climate"
  | "ai"
  | "energy"
  | "finance"
  | "enterprise-software"
  | "consumer-tech"
  | "e-commerce"
  | "cybersecurity"
  | "gaming"
  | "media-entertainment"
  | "consulting"
  | "government"
  | "nonprofit"
  | "retail"
  | "restaurant"
  | "hospitality"
  | "other";

export type JobSource =
  | "recruiter"
  | "linkedin"
  | "indeed"
  | "friend"
  | "colleague"
  | "company-website"
  | "other";

export interface InterviewStage {
  id: string;
  applicationId?: string;
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

export interface CreateApplicationInput {
  companyName: string;
  positionTitle: string;
  dateApplied?: string;
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
}

export interface UpdateApplicationInput extends Partial<CreateApplicationInput> {
  status?: ApplicationStatus;
  offerDueDate?: string | null;
  isArchived?: boolean;
}

export interface CreateInterviewStageInput {
  name: string;
  order: number;
  isCompleted?: boolean;
  completedDate?: string | null;
  notes?: string;
  performanceRating?: number;
}

export interface UpdateInterviewStageInput
  extends Partial<CreateInterviewStageInput> {}

export interface PaginatedApplications {
  items: Application[];
  page: number;
  limit: number;
  total: number;
}

export interface ListApplicationsParams {
  status?: string;
  companyCategory?: string;
  jobSource?: string;
  skillsMatchMin?: number;
  includeArchived?: boolean;
  sortBy?: "dateApplied" | "companyName" | "updatedAt";
  sortDir?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface FilterState {
  status: ApplicationStatus[];
  companyCategory: CompanyCategory | null;
  jobSource: JobSource | null;
  skillsMatchMin: number | null;
  includeArchived: boolean;
}

export interface SortState {
  sortBy: "dateApplied" | "companyName" | "updatedAt";
  sortDir: "asc" | "desc";
}

export interface ErrorResponse {
  code: "validation_error" | "not_found" | "internal_error";
  message: string;
  details?: Array<{ field: string; message: string }>;
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
