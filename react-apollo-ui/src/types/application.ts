// GraphQL enum values match Prisma enum names (not DB-mapped values)
// e.g. Prisma `given_offer @map("given offer")` → GraphQL exposes `given_offer`
export type ApplicationStatus =
  | 'unsubmitted'
  | 'applied'
  | 'interviewing'
  | 'given_offer'
  | 'accepted_offer'
  | 'declined_offer'
  | 'rejected'
  | 'no_offer';

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  unsubmitted: 'Unsubmitted',
  applied: 'Applied',
  interviewing: 'Interviewing',
  given_offer: 'Given Offer',
  accepted_offer: 'Accepted Offer',
  declined_offer: 'Declined Offer',
  rejected: 'Not a match',
  no_offer: 'No Offer',
};

export const TERMINAL_STATUSES: ApplicationStatus[] = ['accepted_offer', 'declined_offer'];

export const COMPANY_CATEGORIES = [
  'ai', 'climate', 'consulting', 'consumer_tech', 'cybersecurity',
  'e_commerce', 'education', 'energy', 'enterprise_software', 'finance',
  'gaming', 'government', 'health', 'hospitality', 'media_entertainment',
  'nonprofit', 'restaurant', 'retail', 'other',
] as const;

export type CompanyCategory = typeof COMPANY_CATEGORIES[number];

export const CATEGORY_LABELS: Record<CompanyCategory, string> = {
  ai: 'AI',
  climate: 'Climate',
  consulting: 'Consulting',
  consumer_tech: 'Consumer Tech',
  cybersecurity: 'Cybersecurity',
  e_commerce: 'E-commerce',
  education: 'Education',
  energy: 'Energy',
  enterprise_software: 'Enterprise Software',
  finance: 'Finance',
  gaming: 'Gaming',
  government: 'Government',
  health: 'Health',
  hospitality: 'Hospitality',
  media_entertainment: 'Media/Entertainment',
  nonprofit: 'Nonprofit',
  restaurant: 'Restaurant',
  retail: 'Retail',
  other: 'Other',
};

export const JOB_SOURCES = [
  'recruiter', 'linkedin', 'indeed', 'friend', 'colleague', 'company_website', 'other',
] as const;

export type JobSource = typeof JOB_SOURCES[number];

export const SOURCE_LABELS: Record<JobSource, string> = {
  recruiter: 'Recruiter',
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  friend: 'Friend',
  colleague: 'Colleague',
  company_website: 'Company Website',
  other: 'Other',
};

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
