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

// Create Application
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
  specialRequirements: z.string().max(1000).optional(),
  salaryMin: z.number().int().min(0).optional(),
  salaryMax: z.number().int().min(0).optional(),
  notes: z.string().max(5000).optional(),
});

// Update Application
export const UpdateApplicationSchema = z.object({
  companyName: z.string().min(1).max(200).optional(),
  positionTitle: z.string().min(1).max(200).optional(),
  dateApplied: z.string().optional(),
  status: ApplicationStatusSchema.optional(),
  companyUrl: z.string().url().nullable().optional(),
  jobPostingUrl: z.string().url().nullable().optional(),
  companyCareerUrl: z.string().url().nullable().optional(),
  companyCategory: CompanyCategorySchema.nullable().optional(),
  skillsMatch: z.number().int().min(1).max(5).nullable().optional(),
  jobSource: JobSourceSchema.nullable().optional(),
  coverLetterRequired: z.boolean().nullable().optional(),
  specialRequirements: z.string().max(1000).nullable().optional(),
  salaryMin: z.number().int().min(0).nullable().optional(),
  salaryMax: z.number().int().min(0).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  offerDueDate: z.string().nullable().optional(),
});

// List Applications Query
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

// Create Interview Stage
export const CreateInterviewStageSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  order: z.number().int().min(0),
  isCompleted: z.boolean().default(false),
  completedDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
  performanceRating: z.number().int().min(1).max(5).optional(),
});

// Update Interview Stage
export const UpdateInterviewStageSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  order: z.number().int().min(0).optional(),
  isCompleted: z.boolean().optional(),
  completedDate: z.string().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  performanceRating: z.number().int().min(1).max(5).nullable().optional(),
});

// --- Event Sourcing Validation Schemas ---

// Append Event
export const AppendEventSchema = z.object({
  description: z.string().min(1).max(500),
  changes: z.array(z.object({
    field: z.string(),
    label: z.string(),
    oldValue: z.unknown(),
    newValue: z.unknown(),
  })),
  patches: z.array(z.object({
    op: z.enum(['replace', 'add', 'remove']),
    path: z.array(z.union([z.string(), z.number()])),
    value: z.unknown().optional(),
  })),
  inversePatches: z.array(z.object({
    op: z.enum(['replace', 'add', 'remove']),
    path: z.array(z.union([z.string(), z.number()])),
    value: z.unknown().optional(),
  })),
});

// List Events Query
export const ListEventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

// Restore to Event
export const RestoreToEventSchema = z.object({
  targetSequence: z.coerce.number().int().min(1),
});
