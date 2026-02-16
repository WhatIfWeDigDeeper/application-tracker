import { uuid, varchar, text, integer, boolean, date, timestamp, jsonb, pgSchema } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define the svelte_hono schema
export const svelteHonoSchema = pgSchema('svelte_hono');

// Enums
export const applicationStatusEnum = svelteHonoSchema.enum('application_status', [
  'applied',
  'rejected',
  'interviewing',
  'given offer',
  'accepted offer',
  'declined offer',
  'no offer',
]);

export const companyCategoryEnum = svelteHonoSchema.enum('company_category', [
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

export const jobSourceEnum = svelteHonoSchema.enum('job_source', [
  'recruiter',
  'linkedin',
  'indeed',
  'friend',
  'colleague',
  'company-website',
  'other',
]);

// Tables
export const applications = svelteHonoSchema.table('applications', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyName: varchar('company_name', { length: 200 }).notNull(),
  positionTitle: varchar('position_title', { length: 200 }).notNull(),
  dateApplied: date('date_applied'),
  status: applicationStatusEnum('status').notNull().default('applied'),
  companyUrl: text('company_url'),
  jobPostingUrl: text('job_posting_url'),
  companyCareerUrl: text('company_career_url'),
  companyCategory: companyCategoryEnum('company_category'),
  skillsMatch: integer('skills_match'),
  jobSource: jobSourceEnum('job_source'),
  coverLetterRequired: boolean('cover_letter_required'),
  specialRequirements: text('special_requirements'),
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  notes: text('notes'),
  offerDueDate: date('offer_due_date'),
  isArchived: boolean('is_archived').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const interviewStages = svelteHonoSchema.table('interview_stages', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  applicationId: uuid('application_id')
    .notNull()
    .references(() => applications.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  order: integer('order').notNull(),
  isCompleted: boolean('is_completed').notNull().default(false),
  completedDate: date('completed_date'),
  notes: text('notes'),
  performanceRating: integer('performance_rating'),
});

// Application History (snapshot-based version tracking)
export const applicationHistory = svelteHonoSchema.table('application_history', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  applicationId: uuid('application_id')
    .notNull()
    .references(() => applications.id, { onDelete: 'cascade' }),
  sequence: integer('sequence').notNull(),
  description: varchar('description', { length: 500 }).notNull(),
  snapshot: jsonb('snapshot').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const applicationsRelations = relations(applications, ({ many }) => ({
  interviewStages: many(interviewStages),
  history: many(applicationHistory),
}));

export const interviewStagesRelations = relations(interviewStages, ({ one }) => ({
  application: one(applications, {
    fields: [interviewStages.applicationId],
    references: [applications.id],
  }),
}));

export const applicationHistoryRelations = relations(applicationHistory, ({ one }) => ({
  application: one(applications, {
    fields: [applicationHistory.applicationId],
    references: [applications.id],
  }),
}));

// Types
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type InterviewStage = typeof interviewStages.$inferSelect;
export type NewInterviewStage = typeof interviewStages.$inferInsert;
export type ApplicationHistoryEntry = typeof applicationHistory.$inferSelect;
export type NewApplicationHistoryEntry = typeof applicationHistory.$inferInsert;
export type ApplicationStatus = (typeof applicationStatusEnum.enumValues)[number];
export type CompanyCategory = (typeof companyCategoryEnum.enumValues)[number];
export type JobSource = (typeof jobSourceEnum.enumValues)[number];
