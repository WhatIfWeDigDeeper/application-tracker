import type { ApplicationStatus, CompanyCategory, JobSource } from '@/types/application';

export const STATUS_COLORS: Record<ApplicationStatus, { text: string; background: string }> = {
  unsubmitted: { text: 'var(--status-unsubmitted)', background: 'var(--status-unsubmitted-bg)' },
  applied: { text: 'var(--status-applied)', background: 'var(--status-applied-bg)' },
  interviewing: {
    text: 'var(--status-interviewing)',
    background: 'var(--status-interviewing-bg)',
  },
  'given offer': { text: 'var(--status-given-offer)', background: 'var(--status-given-offer-bg)' },
  'accepted offer': {
    text: 'var(--status-accepted-offer)',
    background: 'var(--status-accepted-offer-bg)',
  },
  rejected: { text: 'var(--status-rejected)', background: 'var(--status-rejected-bg)' },
  'declined offer': {
    text: 'var(--status-declined-offer)',
    background: 'var(--status-declined-offer-bg)',
  },
  'no offer': { text: 'var(--status-no-offer)', background: 'var(--status-no-offer-bg)' },
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  unsubmitted: 'Draft',
  applied: 'Applied',
  interviewing: 'Interviewing',
  'given offer': 'Given Offer',
  'accepted offer': 'Accepted Offer',
  rejected: 'Not a match',
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
  'media-entertainment': 'Media & Entertainment',
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

export const DEFAULT_INTERVIEW_STAGES = [
  'Recruiter Screen',
  'Hiring Manager',
  'Technical Interview',
  'System Design',
  'Team Fit',
  'Final Round',
] as const;

export const TERMINAL_STATUSES: readonly ApplicationStatus[] = ['accepted offer', 'declined offer'];
