import { z } from "zod";

// Enums matching the OpenAPI spec
export const ApplicationStatusSchema = z.enum([
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

export const SortBySchema = z.enum([
  "dateApplied",
  "companyName",
  "updatedAt",
]);

export const SortDirSchema = z.enum(["asc", "desc"]);

// Request DTOs
export const CreateApplicationSchema = z.object({
  companyName: z
    .string()
    .min(1, "Company name is required")
    .max(200, "Company name must be between 1 and 200 characters"),
  positionTitle: z
    .string()
    .min(1, "Position title is required")
    .max(200, "Position title must be between 1 and 200 characters"),
  dateApplied: z.string().date().optional(),
  companyUrl: z
    .string()
    .url("Invalid company URL format")
    .optional()
    .or(z.literal("")),
  jobPostingUrl: z
    .string()
    .url("Invalid job posting URL format")
    .optional()
    .or(z.literal("")),
  companyCareerUrl: z
    .string()
    .url("Invalid company career page URL format")
    .optional()
    .or(z.literal("")),
  companyCategory: CompanyCategorySchema.optional().nullable(),
  skillsMatch: z
    .number()
    .int()
    .min(1, "Skills match must be between 1 and 5")
    .max(5, "Skills match must be between 1 and 5")
    .optional()
    .nullable(),
  jobSource: JobSourceSchema.optional().nullable(),
  coverLetterRequired: z.boolean().optional().nullable(),
  specialRequirements: z
    .string()
    .max(1000, "Special requirements must not exceed 1000 characters")
    .optional()
    .nullable(),
  salaryMin: z
    .number()
    .int()
    .min(0, "Minimum salary must be a positive number")
    .optional()
    .nullable(),
  salaryMax: z
    .number()
    .int()
    .min(0, "Maximum salary must be a positive number")
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(5000, "Notes must not exceed 5000 characters")
    .optional()
    .nullable(),
});

export const UpdateApplicationSchema = CreateApplicationSchema.partial().extend(
  {
    status: ApplicationStatusSchema.optional(),
    offerDueDate: z.string().date().optional().nullable(),
    isArchived: z.boolean().optional(),
  }
);

export const CreateInterviewStageSchema = z.object({
  name: z
    .string()
    .min(1, "Stage name is required")
    .max(100, "Stage name must be between 1 and 100 characters"),
  order: z.number().int().min(0, "Order must be a non-negative integer"),
  isCompleted: z.boolean().default(false),
  completedDate: z.string().date().optional().nullable(),
  notes: z
    .string()
    .max(2000, "Stage notes must not exceed 2000 characters")
    .nullable()
    .optional(),
  performanceRating: z
    .number()
    .int()
    .min(1, "Performance rating must be between 1 and 5")
    .max(5, "Performance rating must be between 1 and 5")
    .nullable()
    .optional(),
});

export const UpdateInterviewStageSchema = CreateInterviewStageSchema.partial();

export const ListApplicationsQuerySchema = z.object({
  status: z.string().optional(),
  companyCategory: z.string().optional(),
  jobSource: z.string().optional(),
  skillsMatchMin: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v) : undefined)),
  includeArchived: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  sortBy: SortBySchema.optional().default("dateApplied"),
  sortDir: SortDirSchema.optional().default("desc"),
  page: z
    .string()
    .optional()
    .transform((v) => parseInt(v || "1")),
  limit: z
    .string()
    .optional()
    .transform((v) => Math.min(parseInt(v || "20"), 100)),
});

// Type exports
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;
export type CompanyCategory = z.infer<typeof CompanyCategorySchema>;
export type JobSource = z.infer<typeof JobSourceSchema>;
export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof UpdateApplicationSchema>;
export type CreateInterviewStageInput = z.infer<
  typeof CreateInterviewStageSchema
>;
export type UpdateInterviewStageInput = z.infer<
  typeof UpdateInterviewStageSchema
>;
export type ListApplicationsQuery = z.infer<typeof ListApplicationsQuerySchema>;

// Database entity types
export interface InterviewStage {
  id: string;
  applicationId: string;
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
  dateApplied: string | null;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  companyUrl: string | null;
  jobPostingUrl: string | null;
  companyCareerUrl: string | null;
  companyCategory: CompanyCategory | null;
  skillsMatch: number | null;
  jobSource: JobSource | null;
  coverLetterRequired: boolean | null;
  specialRequirements: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  notes: string | null;
  offerDueDate: string | null;
  isArchived: boolean;
  interviewStages: InterviewStage[];
}

export interface PaginatedApplications {
  items: Application[];
  page: number;
  limit: number;
  total: number;
}

export interface ErrorResponse {
  code: "validation_error" | "not_found" | "internal_error";
  message: string;
  details?: Array<{ field: string; message: string }>;
}

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
export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;

export const PaginatedHistorySchema = z.object({
  entries: z.array(HistoryEntrySchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});
export type PaginatedHistory = z.infer<typeof PaginatedHistorySchema>;

export const RestoreRequestSchema = z.object({
  sequence: z.number().int().min(1),
});
