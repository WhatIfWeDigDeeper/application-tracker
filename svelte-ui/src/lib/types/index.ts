// Application Status
export type ApplicationStatus =
  | 'unsubmitted'
  | 'applied'
  | 'rejected'
  | 'interviewing'
  | 'given offer'
  | 'accepted offer'
  | 'declined offer'
  | 'no offer';

// Company Category
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

// Job Source
export type JobSource = 'recruiter' | 'linkedin' | 'indeed' | 'friend' | 'colleague' | 'company-website' | 'other';

// Interview Stage
export interface InterviewStage {
  id: string;
  name: string;
  order: number;
  isCompleted: boolean;
  completedDate: string | null;
  notes: string | null;
  performanceRating: number | null;
}

// Application
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

// Create/Update Input Types
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

// Error Response
export interface ErrorResponse {
  code: 'validation_error' | 'not_found' | 'internal_error';
  message: string;
  details?: Array<{ field: string; message: string }>;
}

// History types
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

// Display helpers
export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  unsubmitted: 'Unsubmitted',
  applied: 'Applied',
  rejected: 'Not a match',
  interviewing: 'Interviewing',
  'given offer': 'Given Offer',
  'accepted offer': 'Accepted Offer',
  'declined offer': 'Declined Offer',
  'no offer': 'No Offer',
};

export const CATEGORY_LABELS: Record<CompanyCategory, string> = {
  education: 'Education',
  health: 'Health',
  climate: 'Climate',
  ai: 'AI',
  energy: 'Energy',
  finance: 'Finance',
  'enterprise-software': 'Enterprise Software',
  'consumer-tech': 'Consumer Tech',
  'e-commerce': 'E-commerce',
  cybersecurity: 'Cybersecurity',
  gaming: 'Gaming',
  'media-entertainment': 'Media/Entertainment',
  consulting: 'Consulting',
  government: 'Government',
  nonprofit: 'Nonprofit',
  retail: 'Retail',
  restaurant: 'Restaurant',
  hospitality: 'Hospitality',
  other: 'Other',
};

export const SOURCE_LABELS: Record<JobSource, string> = {
  recruiter: 'Recruiter',
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  friend: 'Friend',
  colleague: 'Colleague',
  'company-website': 'Company Website',
  other: 'Other',
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  unsubmitted: 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200',
  applied: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  interviewing: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'given offer': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'accepted offer': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'declined offer': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  'no offer': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

export const ALL_STATUSES: ApplicationStatus[] = [
  'unsubmitted',
  'applied',
  'interviewing',
  'given offer',
  'accepted offer',
  'rejected',
  'declined offer',
  'no offer',
];

export const ALL_CATEGORIES: CompanyCategory[] = [
  'ai',
  'climate',
  'consulting',
  'consumer-tech',
  'cybersecurity',
  'e-commerce',
  'education',
  'energy',
  'enterprise-software',
  'finance',
  'gaming',
  'government',
  'health',
  'hospitality',
  'media-entertainment',
  'nonprofit',
  'restaurant',
  'retail',
  'other',
];

export const ALL_SOURCES: JobSource[] = ['recruiter', 'linkedin', 'indeed', 'friend', 'colleague', 'company-website', 'other'];
