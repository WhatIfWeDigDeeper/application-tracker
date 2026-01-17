/**
 * Storage Service Contract
 *
 * Defines the interface for localStorage operations in the Job Application Tracker.
 * This is an internal contract (no REST API) since data is stored client-side.
 *
 * @module contracts/storage-service
 */

// ============================================================================
// Core Types (from data-model.md)
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

export interface StorageSchema {
  version: number;
  applications: JobApplication[];
  lastModified: string;
}

// ============================================================================
// Input Types (for create/update operations)
// ============================================================================

/**
 * Input for creating a new job application.
 * Only company name and position title are required.
 */
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

/**
 * Input for updating an existing job application.
 * All fields are optional except id.
 */
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

/**
 * Input for creating/updating an interview stage.
 */
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

// ============================================================================
// Service Interface
// ============================================================================

/**
 * Storage service interface for job application operations.
 * Implementations should handle localStorage persistence.
 */
export interface StorageService {
  // Application CRUD
  getApplications(filters?: ApplicationFilters, sort?: SortOptions): JobApplication[];
  getApplicationById(id: string): JobApplication | null;
  createApplication(input: CreateApplicationInput): JobApplication;
  updateApplication(id: string, input: UpdateApplicationInput): JobApplication;
  deleteApplication(id: string): void;
  archiveApplication(id: string): JobApplication;
  restoreApplication(id: string): JobApplication;

  // Interview Stage Operations
  addInterviewStage(applicationId: string, stage: InterviewStageInput): InterviewStage;
  updateInterviewStage(applicationId: string, stageId: string, input: InterviewStageInput): InterviewStage;
  removeInterviewStage(applicationId: string, stageId: string): void;
  reorderInterviewStages(applicationId: string, stageIds: string[]): InterviewStage[];
  completeInterviewStage(applicationId: string, stageId: string, completedDate: string, notes?: string, rating?: number): InterviewStage;

  // Validation
  validateApplication(input: CreateApplicationInput | UpdateApplicationInput): ValidationResult;
  validateInterviewStage(input: InterviewStageInput): ValidationResult;

  // Storage Management
  exportData(): StorageSchema;
  importData(data: StorageSchema): void;
  clearAllData(): void;
}

// ============================================================================
// Hook Interface (React integration)
// ============================================================================

/**
 * React hook interface for application state management.
 * Combines storage service with React state.
 */
export interface UseApplicationsReturn {
  // State
  applications: JobApplication[];
  isLoading: boolean;
  error: string | null;

  // CRUD Operations
  addApplication: (input: CreateApplicationInput) => JobApplication;
  updateApplication: (id: string, input: UpdateApplicationInput) => JobApplication;
  deleteApplication: (id: string) => void;
  archiveApplication: (id: string) => void;
  restoreApplication: (id: string) => void;

  // Filtering & Sorting
  filters: ApplicationFilters;
  setFilters: (filters: ApplicationFilters) => void;
  sort: SortOptions;
  setSort: (sort: SortOptions) => void;

  // Interview Operations
  addInterviewStage: (applicationId: string, stage: InterviewStageInput) => void;
  updateInterviewStage: (applicationId: string, stageId: string, input: InterviewStageInput) => void;
  removeInterviewStage: (applicationId: string, stageId: string) => void;
  reorderInterviewStages: (applicationId: string, stageIds: string[]) => void;
  completeInterviewStage: (applicationId: string, stageId: string, completedDate: string, notes?: string, rating?: number) => void;
}
