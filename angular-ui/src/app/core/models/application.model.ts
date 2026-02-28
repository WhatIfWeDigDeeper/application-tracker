export type ApplicationStatus =
  | 'unsubmitted'
  | 'applied'
  | 'interviewing'
  | 'given offer'
  | 'accepted offer'
  | 'declined offer'
  | 'rejected'
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
  status: ApplicationStatus;
  dateApplied: string | null;
  companyUrl: string | null;
  jobPostingUrl: string | null;
  companyCareerUrl: string | null;
  companyCategory: CompanyCategory | null;
  skillsMatch: number | null;
  jobSource: JobSource | null;
  salaryMin: number | null;
  salaryMax: number | null;
  coverLetterRequired: boolean | null;
  offerDueDate: string | null;
  specialRequirements: string | null;
  notes: string | null;
  isArchived: boolean;
  interviewStages: InterviewStage[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
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

export interface ImportError {
  row: number;
  message: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: ImportError[];
}

export interface FilterParams {
  status?: string;
  companyCategory?: string;
  jobSource?: string;
  skillsMatchMin?: number;
  includeArchived?: boolean;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const APPLICATION_STATUSES: { value: ApplicationStatus; label: string }[] = [
  { value: 'unsubmitted', label: 'Unsubmitted' },
  { value: 'applied', label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'given offer', label: 'Given Offer' },
  { value: 'accepted offer', label: 'Accepted Offer' },
  { value: 'declined offer', label: 'Declined Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'no offer', label: 'No Offer' },
];

export const COMPANY_CATEGORIES: { value: CompanyCategory; label: string }[] = [
  { value: 'ai', label: 'AI' },
  { value: 'climate', label: 'Climate' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'consumer-tech', label: 'Consumer Tech' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'e-commerce', label: 'E-commerce' },
  { value: 'education', label: 'Education' },
  { value: 'energy', label: 'Energy' },
  { value: 'enterprise-software', label: 'Enterprise Software' },
  { value: 'finance', label: 'Finance' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'government', label: 'Government' },
  { value: 'health', label: 'Health' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'media-entertainment', label: 'Media/Entertainment' },
  { value: 'nonprofit', label: 'Nonprofit' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'retail', label: 'Retail' },
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

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  unsubmitted: 'bg-gray-200 text-gray-700',
  applied: 'bg-blue-100 text-blue-800',
  interviewing: 'bg-purple-100 text-purple-800',
  'given offer': 'bg-yellow-100 text-yellow-800',
  'accepted offer': 'bg-green-100 text-green-800',
  'declined offer': 'bg-gray-100 text-gray-800',
  rejected: 'bg-red-100 text-red-800',
  'no offer': 'bg-gray-100 text-gray-800',
};
