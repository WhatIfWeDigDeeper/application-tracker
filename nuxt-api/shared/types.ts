// Application Status enum
export type ApplicationStatus =
  | 'unsubmitted'
  | 'applied'
  | 'rejected'
  | 'interviewing'
  | 'given offer'
  | 'accepted offer'
  | 'declined offer'
  | 'no offer';

// Company Category enum
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

// Job Source enum
export type JobSource =
  | 'recruiter'
  | 'linkedin'
  | 'indeed'
  | 'friend'
  | 'colleague'
  | 'company-website'
  | 'other';

// Interview Stage interface
export interface InterviewStage {
  id: string;
  name: string;
  order: number;
  isCompleted: boolean;
  completedDate: string | null;
  notes: string | null;
  performanceRating: number | null;
}

// Application interface
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

// Create Application Input
export interface CreateApplicationInput {
  companyName: string;
  positionTitle: string;
  dateApplied?: string | null;
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

// Update Application Input
export interface UpdateApplicationInput {
  companyName?: string;
  positionTitle?: string;
  dateApplied?: string | null;
  status?: ApplicationStatus;
  companyUrl?: string | null;
  jobPostingUrl?: string | null;
  companyCareerUrl?: string | null;
  companyCategory?: CompanyCategory | null;
  skillsMatch?: number | null;
  jobSource?: JobSource | null;
  coverLetterRequired?: boolean | null;
  specialRequirements?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  notes?: string | null;
  offerDueDate?: string | null;
}

// Create Interview Stage Input
export interface CreateInterviewStageInput {
  id?: string;
  name: string;
  order: number;
  isCompleted?: boolean;
  completedDate?: string;
  notes?: string;
  performanceRating?: number;
}

// Update Interview Stage Input
export interface UpdateInterviewStageInput {
  name?: string;
  order?: number;
  isCompleted?: boolean;
  completedDate?: string | null;
  notes?: string | null;
  performanceRating?: number | null;
}

// Paginated Response
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

// Filter State
export interface FilterState {
  status?: string;
  companyCategory?: CompanyCategory;
  jobSource?: JobSource;
  skillsMatchMin?: number;
  includeArchived: boolean;
  sortBy: 'dateApplied' | 'companyName' | 'updatedAt';
  sortDir: 'asc' | 'desc';
  page: number;
  limit: number;
}

// Constants
export const APPLICATION_STATUSES: { value: ApplicationStatus; label: string }[] = [
  { value: 'unsubmitted', label: 'Unsubmitted' },
  { value: 'applied', label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'given offer', label: 'Given Offer' },
  { value: 'accepted offer', label: 'Accepted Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'declined offer', label: 'Declined Offer' },
  { value: 'no offer', label: 'No Offer' },
];

export const COMPANY_CATEGORIES: { value: CompanyCategory; label: string }[] = [
  { value: 'education', label: 'Education' },
  { value: 'health', label: 'Health' },
  { value: 'climate', label: 'Climate' },
  { value: 'ai', label: 'AI' },
  { value: 'energy', label: 'Energy' },
  { value: 'finance', label: 'Finance' },
  { value: 'enterprise-software', label: 'Enterprise Software' },
  { value: 'consumer-tech', label: 'Consumer Tech' },
  { value: 'e-commerce', label: 'E-Commerce' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'media-entertainment', label: 'Media & Entertainment' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'government', label: 'Government' },
  { value: 'nonprofit', label: 'Nonprofit' },
  { value: 'retail', label: 'Retail' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'other', label: 'Other' },
];

export const JOB_SOURCES: { value: JobSource; label: string }[] = [
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'indeed', label: 'Indeed' },
  { value: 'friend', label: 'Friend' },
  { value: 'colleague', label: 'Colleague' },
  { value: 'company-website', label: 'Company Website' },
  { value: 'other', label: 'Other' },
];

// --- Event Sourcing Types ---

// Mirror of Immer's Patch type (shared between frontend and backend)
export interface ImmerPatch {
  op: 'replace' | 'add' | 'remove';
  path: (string | number)[];
  value?: unknown;
}

export interface FieldChange {
  field: string;
  label: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface ApplicationEvent {
  id: string;
  applicationId: string;
  sequence: number;
  description: string;
  changes: FieldChange[];
  patches: ImmerPatch[];
  inversePatches: ImmerPatch[];
  createdAt: string;
}

export interface ApplicationSnapshot {
  id: string;
  applicationId: string;
  atSequence: number;
  state: Application;
  createdAt: string;
}
