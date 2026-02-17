import { z } from 'zod';

// Application Status enum
export const ApplicationStatusSchema = z.enum([
  'applied',
  'rejected',
  'interviewing',
  'given offer',
  'accepted offer',
  'declined offer',
  'no offer',
]);
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;

// Company Category enum
export const CompanyCategorySchema = z.enum([
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
]);
export type CompanyCategory = z.infer<typeof CompanyCategorySchema>;

// Job Source enum
export const JobSourceSchema = z.enum([
  'recruiter',
  'linkedin',
  'indeed',
  'friend',
  'colleague',
  'company-website',
  'other',
]);
export type JobSource = z.infer<typeof JobSourceSchema>;

// Interview Stage schemas
export const InterviewStageSchema = z.object({
  id: z.string().uuid(),
  name: z.string().max(100),
  order: z.number().int().min(0),
  isCompleted: z.boolean(),
  completedDate: z.string().nullable(),
  notes: z.string().max(2000).nullable(),
  performanceRating: z.number().int().min(1).max(5).nullable(),
});
export type InterviewStageResponse = z.infer<typeof InterviewStageSchema>;

export const CreateInterviewStageSchema = z.object({
  name: z.string().min(1).max(100),
  order: z.number().int().min(0),
  isCompleted: z.boolean().default(false),
  completedDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
  performanceRating: z.number().int().min(1).max(5).optional(),
});
export type CreateInterviewStageInput = z.infer<typeof CreateInterviewStageSchema>;

export const UpdateInterviewStageSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  order: z.number().int().min(0).optional(),
  isCompleted: z.boolean().optional(),
  completedDate: z.string().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  performanceRating: z.number().int().min(1).max(5).nullable().optional(),
});
export type UpdateInterviewStageInput = z.infer<typeof UpdateInterviewStageSchema>;

// Application schemas
export const ApplicationSchema = z.object({
  id: z.string().uuid(),
  companyName: z.string().max(200),
  positionTitle: z.string().max(200),
  dateApplied: z.string().nullable(),
  status: ApplicationStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  companyUrl: z.string().nullable(),
  jobPostingUrl: z.string().nullable(),
  companyCareerUrl: z.string().nullable(),
  companyCategory: CompanyCategorySchema.nullable(),
  skillsMatch: z.number().int().min(1).max(5).nullable(),
  jobSource: JobSourceSchema.nullable(),
  coverLetterRequired: z.boolean().nullable(),
  specialRequirements: z.string().max(5000).nullable(),
  salaryMin: z.number().int().min(0).nullable(),
  salaryMax: z.number().int().min(0).nullable(),
  notes: z.string().max(5000).nullable(),
  offerDueDate: z.string().nullable(),
  isArchived: z.boolean(),
  interviewStages: z.array(InterviewStageSchema),
});
export type ApplicationResponse = z.infer<typeof ApplicationSchema>;

export const CreateApplicationSchema = z.object({
  companyName: z.string().min(1).max(200),
  positionTitle: z.string().min(1).max(200),
  dateApplied: z.string().optional(),
  companyUrl: z.string().url().optional(),
  jobPostingUrl: z.string().url().optional(),
  companyCareerUrl: z.string().url().optional(),
  companyCategory: CompanyCategorySchema.optional(),
  skillsMatch: z.number().int().min(1).max(5).optional(),
  jobSource: JobSourceSchema.optional(),
  coverLetterRequired: z.boolean().optional(),
  specialRequirements: z.string().max(5000).optional(),
  salaryMin: z.number().int().min(0).optional(),
  salaryMax: z.number().int().min(0).optional(),
  notes: z.string().max(5000).optional(),
});
export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;

export const UpdateApplicationSchema = z.object({
  companyName: z.string().min(1).max(200).optional(),
  positionTitle: z.string().min(1).max(200).optional(),
  dateApplied: z.string().nullable().optional(),
  status: ApplicationStatusSchema.optional(),
  companyUrl: z.string().url().nullable().optional(),
  jobPostingUrl: z.string().url().nullable().optional(),
  companyCareerUrl: z.string().url().nullable().optional(),
  companyCategory: CompanyCategorySchema.nullable().optional(),
  skillsMatch: z.number().int().min(1).max(5).nullable().optional(),
  jobSource: JobSourceSchema.nullable().optional(),
  coverLetterRequired: z.boolean().nullable().optional(),
  specialRequirements: z.string().max(5000).nullable().optional(),
  salaryMin: z.number().int().min(0).nullable().optional(),
  salaryMax: z.number().int().min(0).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  offerDueDate: z.string().nullable().optional(),
});
export type UpdateApplicationInput = z.infer<typeof UpdateApplicationSchema>;

// List query params
export const ListApplicationsQuerySchema = z.object({
  status: z.string().optional(),
  companyCategory: CompanyCategorySchema.optional(),
  jobSource: JobSourceSchema.optional(),
  skillsMatchMin: z.coerce.number().int().min(1).max(5).optional(),
  includeArchived: z.coerce.boolean().default(false),
  sortBy: z.enum(['dateApplied', 'companyName', 'updatedAt']).default('dateApplied'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListApplicationsQuery = z.infer<typeof ListApplicationsQuerySchema>;

// Paginated response
export const PaginatedApplicationsSchema = z.object({
  items: z.array(ApplicationSchema),
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
});
export type PaginatedApplicationsResponse = z.infer<typeof PaginatedApplicationsSchema>;

// History types
export const FieldChangeSchema = z.object({
  field: z.string(),
  label: z.string(),
  oldValue: z.unknown(),
  newValue: z.unknown(),
});
export type FieldChange = z.infer<typeof FieldChangeSchema>;

export const HistoryEntrySchema = z.object({
  id: z.string().uuid(),
  sequence: z.number().int(),
  description: z.string(),
  changes: z.array(FieldChangeSchema),
  createdAt: z.string(),
});
export type HistoryEntryResponse = z.infer<typeof HistoryEntrySchema>;

export const PaginatedHistorySchema = z.object({
  entries: z.array(HistoryEntrySchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});
export type PaginatedHistoryResponse = z.infer<typeof PaginatedHistorySchema>;

export const RestoreRequestSchema = z.object({
  sequence: z.number().int().min(1),
});

// CSV Import types
export const CsvRowSchema = z.object({
  companyName: z.string().min(1).max(200),
  positionTitle: z.string().min(1).max(200),
  dateApplied: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format').optional(),
  status: ApplicationStatusSchema.optional(),
  companyUrl: z.string().url().optional(),
  jobPostingUrl: z.string().url().optional(),
  companyCareerUrl: z.string().url().optional(),
  companyCategory: CompanyCategorySchema.optional(),
  skillsMatch: z.coerce.number().int().min(1).max(5).optional(),
  jobSource: JobSourceSchema.optional(),
  coverLetterRequired: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const lower = val.toLowerCase();
        if (lower === 'true') return true;
        if (lower === 'false') return false;
      }
      return val;
    },
    z.boolean().optional(),
  ),
  specialRequirements: z.string().max(5000).optional(),
  salaryMin: z.coerce.number().int().min(0).optional(),
  salaryMax: z.coerce.number().int().min(0).optional(),
  notes: z.string().max(5000).optional(),
  offerDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format').optional(),
});

export type CsvRow = z.infer<typeof CsvRowSchema>;

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
}

// Error response
export const ErrorResponseSchema = z.object({
  code: z.enum(['validation_error', 'not_found', 'internal_error']),
  message: z.string(),
  details: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
      })
    )
    .optional(),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
