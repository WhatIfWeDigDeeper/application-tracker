import { z } from "zod";

// Enums
export const ApplicationStatusSchema = z.enum([
  "unsubmitted",
  "applied",
  "rejected",
  "interviewing",
  "given offer",
  "accepted offer",
  "declined offer",
  "no offer",
]);

export const CompanyCategorySchema = z.enum([
  "education",
  "health",
  "climate",
  "ai",
  "energy",
  "finance",
  "enterprise-software",
  "consumer-tech",
  "e-commerce",
  "cybersecurity",
  "gaming",
  "media-entertainment",
  "consulting",
  "government",
  "nonprofit",
  "retail",
  "restaurant",
  "hospitality",
  "other",
]);

export const JobSourceSchema = z.enum([
  "recruiter",
  "linkedin",
  "indeed",
  "friend",
  "colleague",
  "company-website",
  "other",
]);

// Request DTOs
export const CreateApplicationSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  positionTitle: z.string().min(1, "Position title is required"),
  status: ApplicationStatusSchema.optional(),
  dateApplied: z.string().date().nullable().optional(),
  companyUrl: z.string().url().optional().or(z.literal("")),
  jobPostingUrl: z.string().url().optional().or(z.literal("")),
  companyCareerUrl: z.string().url().optional().or(z.literal("")),
  companyCategory: CompanyCategorySchema.optional(),
  skillsMatch: z.number().int().min(1).max(5).optional(),
  jobSource: JobSourceSchema.optional(),
  coverLetterRequired: z.boolean().optional(),
  specialRequirements: z.string().optional(),
  salaryMin: z.number().int().min(0).optional(),
  salaryMax: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

export const UpdateApplicationSchema = CreateApplicationSchema.partial().extend({
  status: ApplicationStatusSchema.optional(),
  offerDueDate: z.string().date().optional(),
  isArchived: z.boolean().optional(),
});

export const CreateInterviewStageSchema = z.object({
  name: z.string().min(1, "Stage name is required"),
  isCompleted: z.boolean().default(false),
  completedDate: z.string().date().optional(),
  notes: z.string().nullable().optional(),
  performanceRating: z.number().int().min(1).max(5).nullable().optional(),
});

export const UpdateInterviewStageSchema = CreateInterviewStageSchema.partial();

export const ListApplicationsQuerySchema = z.object({
  status: z.string().optional(),
  companyCategory: z.string().optional(),
  jobSource: z.string().optional(),
  includeArchived: z.string().optional().transform((v) => v === "true"),
  page: z.string().optional().transform((v) => parseInt(v || "1")),
  limit: z.string().optional().transform((v) => parseInt(v || "20")),
});

// History types
export const FieldChangeSchema = z.object({
  field: z.string(),
  label: z.string(),
  oldValue: z.unknown(),
  newValue: z.unknown(),
});

export const HistoryEntrySchema = z.object({
  id: z.string().uuid(),
  sequence: z.number().int(),
  description: z.string(),
  changes: z.array(FieldChangeSchema),
  createdAt: z.string(),
});

export const PaginatedHistorySchema = z.object({
  entries: z.array(HistoryEntrySchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export const RestoreRequestSchema = z.object({
  sequence: z.number().int().min(1),
});

// Type exports
export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof UpdateApplicationSchema>;
export type CreateInterviewStageInput = z.infer<typeof CreateInterviewStageSchema>;
export type UpdateInterviewStageInput = z.infer<typeof UpdateInterviewStageSchema>;
export type ListApplicationsQuery = z.infer<typeof ListApplicationsQuerySchema>;
