/**
 * Core type definitions for the Job Application Tracker
 * Based on data-model.md and contracts/storage-service.ts
 */

// ============================================================================
// Enumerations
// ============================================================================

export type ApplicationStatus =
  | 'applied'
  | 'interviewing'
  | 'offered'
  | 'rejected'
  | 'accepted'
  | 'declined';

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

// ============================================================================
// Core Entities
// ============================================================================

export interface InterviewStage {
  id: string;
  name: string;
  order: number;
  isCompleted: boolean;
  completedDate?: string;
  notes?: string;
  performanceRating?: number;
}

export interface JobApplication {
  id: string;
  companyName: string;
  positionTitle: string;
  dateApplied: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
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
  interviewStages: InterviewStage[];
  offerDueDate?: string;
  isArchived: boolean;
}

// ============================================================================
// Storage Schema
// ============================================================================

export interface StorageSchema {
  version: number;
  applications: JobApplication[];
  lastModified: string;
}

// ============================================================================
// Input Types (for create/update operations)
// ============================================================================

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

export interface InterviewStageInput {
  name: string;
  isCompleted?: boolean;
  completedDate?: string;
  notes?: string;
  performanceRating?: number;
}

// ============================================================================
// Filter & Sort Types
// ============================================================================

export interface ApplicationFilters {
  status?: ApplicationStatus[];
  companyCategory?: CompanyCategory[];
  jobSource?: JobSource[];
  skillsMatchMin?: number;
  includeArchived?: boolean;
}

export type SortField = 'dateApplied' | 'companyName' | 'status' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';

export interface SortOptions {
  field: SortField;
  direction: SortDirection;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
