// Display-format status values (used in UI selects and forms)
// GraphQL API uses Prisma enum keys (given_offer, accepted_offer, etc.)
// UI uses display-format values (given offer, accepted offer, etc.) matching E2E test expectations
export type ApplicationStatus =
  | 'unsubmitted'
  | 'applied'
  | 'interviewing'
  | 'given offer'
  | 'accepted offer'
  | 'declined offer'
  | 'rejected'
  | 'no offer';

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  unsubmitted: 'Unsubmitted',
  applied: 'Applied',
  interviewing: 'Interviewing',
  'given offer': 'Given Offer',
  'accepted offer': 'Accepted Offer',
  'declined offer': 'Declined Offer',
  rejected: 'Not a match',
  'no offer': 'No Offer',
};

export const TERMINAL_STATUSES: ApplicationStatus[] = ['accepted offer', 'declined offer'];

export const COMPANY_CATEGORIES = [
  'ai', 'climate', 'consulting', 'consumer-tech', 'cybersecurity',
  'e-commerce', 'education', 'energy', 'enterprise-software', 'finance',
  'gaming', 'government', 'health', 'hospitality', 'media-entertainment',
  'nonprofit', 'restaurant', 'retail', 'other',
] as const;

export type CompanyCategory = typeof COMPANY_CATEGORIES[number];

export const CATEGORY_LABELS: Record<CompanyCategory, string> = {
  ai: 'AI',
  climate: 'Climate',
  consulting: 'Consulting',
  'consumer-tech': 'Consumer Tech',
  cybersecurity: 'Cybersecurity',
  'e-commerce': 'E-commerce',
  education: 'Education',
  energy: 'Energy',
  'enterprise-software': 'Enterprise Software',
  finance: 'Finance',
  gaming: 'Gaming',
  government: 'Government',
  health: 'Health',
  hospitality: 'Hospitality',
  'media-entertainment': 'Media/Entertainment',
  nonprofit: 'Nonprofit',
  restaurant: 'Restaurant',
  retail: 'Retail',
  other: 'Other',
};

export const JOB_SOURCES = [
  'recruiter', 'linkedin', 'indeed', 'friend', 'colleague', 'company-website', 'other',
] as const;

export type JobSource = typeof JOB_SOURCES[number];

export const SOURCE_LABELS: Record<JobSource, string> = {
  recruiter: 'Recruiter',
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  friend: 'Friend',
  colleague: 'Colleague',
  'company-website': 'Company Website',
  other: 'Other',
};

// API <-> Display translations (GraphQL uses Prisma key names with underscores)
const STATUS_TO_API: Record<ApplicationStatus, string> = {
  unsubmitted: 'unsubmitted',
  applied: 'applied',
  interviewing: 'interviewing',
  'given offer': 'given_offer',
  'accepted offer': 'accepted_offer',
  'declined offer': 'declined_offer',
  rejected: 'rejected',
  'no offer': 'no_offer',
};
const STATUS_FROM_API: Record<string, ApplicationStatus> = Object.fromEntries(
  Object.entries(STATUS_TO_API).map(([k, v]) => [v, k as ApplicationStatus])
) as Record<string, ApplicationStatus>;

export function toApiStatus(s: ApplicationStatus): string { return STATUS_TO_API[s] ?? s; }
export function fromApiStatus(s: string): ApplicationStatus { return STATUS_FROM_API[s] ?? (s as ApplicationStatus); }

const CATEGORY_TO_API: Record<CompanyCategory, string> = {
  ai: 'ai',
  climate: 'climate',
  consulting: 'consulting',
  'consumer-tech': 'consumer_tech',
  cybersecurity: 'cybersecurity',
  'e-commerce': 'e_commerce',
  education: 'education',
  energy: 'energy',
  'enterprise-software': 'enterprise_software',
  finance: 'finance',
  gaming: 'gaming',
  government: 'government',
  health: 'health',
  hospitality: 'hospitality',
  'media-entertainment': 'media_entertainment',
  nonprofit: 'nonprofit',
  restaurant: 'restaurant',
  retail: 'retail',
  other: 'other',
};
const CATEGORY_FROM_API: Record<string, CompanyCategory> = Object.fromEntries(
  Object.entries(CATEGORY_TO_API).map(([k, v]) => [v, k as CompanyCategory])
) as Record<string, CompanyCategory>;

export function toApiCategory(c: CompanyCategory | ''): string | null { return c ? (CATEGORY_TO_API[c] ?? c) : null; }
export function fromApiCategory(c: string | null | undefined): CompanyCategory | null {
  return c ? (CATEGORY_FROM_API[c] ?? (c as CompanyCategory)) : null;
}

const SOURCE_TO_API: Record<JobSource, string> = {
  recruiter: 'recruiter',
  linkedin: 'linkedin',
  indeed: 'indeed',
  friend: 'friend',
  colleague: 'colleague',
  'company-website': 'company_website',
  other: 'other',
};
const SOURCE_FROM_API: Record<string, JobSource> = Object.fromEntries(
  Object.entries(SOURCE_TO_API).map(([k, v]) => [v, k as JobSource])
) as Record<string, JobSource>;

export function toApiSource(s: JobSource | ''): string | null { return s ? (SOURCE_TO_API[s] ?? s) : null; }
export function fromApiSource(s: string | null | undefined): JobSource | null {
  return s ? (SOURCE_FROM_API[s] ?? (s as JobSource)) : null;
}

// Translate a raw Application object from GraphQL API to display format
export function fromApiApplication<T extends { status: string; companyCategory?: string | null; jobSource?: string | null }>(
  raw: T
): Omit<T, 'status' | 'companyCategory' | 'jobSource'> & {
  status: ApplicationStatus;
  companyCategory: CompanyCategory | null;
  jobSource: JobSource | null;
} {
  return {
    ...raw,
    status: fromApiStatus(raw.status),
    companyCategory: fromApiCategory(raw.companyCategory),
    jobSource: fromApiSource(raw.jobSource),
  };
}

export interface InterviewStage {
  id: string;
  applicationId: string;
  name: string;
  order: number;
  isCompleted: boolean;
  completedDate?: string | null;
  notes?: string | null;
  performanceRating?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  companyName: string;
  positionTitle: string;
  status: ApplicationStatus;
  dateApplied?: string | null;
  jobPostingUrl?: string | null;
  companyUrl?: string | null;
  companyCareerUrl?: string | null;
  companyCategory?: CompanyCategory | null;
  jobSource?: JobSource | null;
  skillsMatch?: number | null;
  coverLetterRequired: boolean;
  specialRequirements?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  notes?: string | null;
  offerDueDate?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  interviewStages?: InterviewStage[];
}

export interface HistoryEntry {
  id: string;
  applicationId: string;
  sequence: number;
  snapshot: string;
  changedFields: string;
  createdAt: string;
}

export interface ApplicationListResult {
  items: Application[];
  total: number;
  page: number;
  totalPages: number;
}

export interface HistoryListResult {
  items: HistoryEntry[];
  total: number;
  page: number;
  totalPages: number;
}
