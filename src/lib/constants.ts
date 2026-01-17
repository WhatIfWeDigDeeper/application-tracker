/**
 * Application constants and default values
 */

import type { InterviewStage, ApplicationStatus, CompanyCategory, JobSource } from '@/types/application';

// ============================================================================
// Storage
// ============================================================================

export const STORAGE_KEY = 'job-tracker-data-v1';
export const STORAGE_VERSION = 1;

// ============================================================================
// Default Interview Stages
// ============================================================================

export const DEFAULT_INTERVIEW_STAGES: Omit<InterviewStage, 'id'>[] = [
  { name: 'Contacted by Recruiter', order: 0, isCompleted: false },
  { name: 'Interview with Recruiter', order: 1, isCompleted: false },
  { name: 'Interview with Hiring Manager', order: 2, isCompleted: false },
  { name: 'Exercise', order: 3, isCompleted: false },
  { name: 'Technical Interview', order: 4, isCompleted: false },
  { name: 'Cross-functional Interviews', order: 5, isCompleted: false },
];

// ============================================================================
// Status Configuration
// ============================================================================

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'unsubmitted',
  'applied',
  'interviewing',
  'offered',
  'rejected',
  'accepted',
  'declined',
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  unsubmitted: 'Unsubmitted',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offered: 'Offered',
  rejected: 'Rejected',
  accepted: 'Accepted',
  declined: 'Declined',
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  unsubmitted: 'bg-status-unsubmitted text-white',
  applied: 'bg-status-applied text-white',
  interviewing: 'bg-status-interviewing text-white',
  offered: 'bg-status-offered text-white',
  rejected: 'bg-status-rejected text-white',
  accepted: 'bg-status-accepted text-white',
  declined: 'bg-status-declined text-white',
};

// ============================================================================
// Company Categories
// ============================================================================

export const COMPANY_CATEGORIES: CompanyCategory[] = [
  'education',
  'health',
  'climate',
  'ai',
  'energy',
  'finance',
  'enterprise-software',
  'consumer-tech',
  'e-commerce',
  'cybersecurity',
  'gaming',
  'media-entertainment',
  'consulting',
  'government',
  'nonprofit',
  'retail',
  'restaurant',
  'hospitality',
  'other',
];

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

// ============================================================================
// Job Sources
// ============================================================================

export const JOB_SOURCES: JobSource[] = [
  'recruiter',
  'linkedin',
  'indeed',
  'friend',
  'colleague',
  'company-website',
  'other',
];

export const SOURCE_LABELS: Record<JobSource, string> = {
  recruiter: 'Recruiter',
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  friend: 'Friend',
  colleague: 'Colleague',
  'company-website': 'Company Website',
  other: 'Other',
};

// ============================================================================
// Validation Limits
// ============================================================================

export const VALIDATION_LIMITS = {
  companyName: { max: 200 },
  positionTitle: { max: 200 },
  stageName: { max: 100 },
  specialRequirements: { max: 1000 },
  notes: { max: 5000 },
  stageNotes: { max: 2000 },
  skillsMatch: { min: 1, max: 5 },
  performanceRating: { min: 1, max: 5 },
} as const;

// ============================================================================
// Skills Match Labels
// ============================================================================

export const SKILLS_MATCH_LABELS: Record<number, string> = {
  1: '1 - Poor Match',
  2: '2 - Below Average',
  3: '3 - Average',
  4: '4 - Good Match',
  5: '5 - Excellent Match',
};
