import { uuid, varchar, text, integer, boolean, date, timestamp, jsonb, pgSchema, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { FieldChange, ImmerPatch, Application } from '~~/shared/types';

// Define the vue_nuxt schema
export const vueNuxtSchema = pgSchema('vue_nuxt');

// Enums
export const applicationStatusEnum = vueNuxtSchema.enum('application_status', [
  'applied',
  'rejected',
  'interviewing',
  'given offer',
  'accepted offer',
  'declined offer',
  'no offer',
]);

export const companyCategoryEnum = vueNuxtSchema.enum('company_category', [
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

export const jobSourceEnum = vueNuxtSchema.enum('job_source', [
  'recruiter',
  'linkedin',
  'indeed',
  'friend',
  'colleague',
  'company-website',
  'other',
]);

// Tables
export const applications = vueNuxtSchema.table('applications', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyName: varchar('company_name', { length: 200 }).notNull(),
  positionTitle: varchar('position_title', { length: 200 }).notNull(),
  dateApplied: date('date_applied').notNull(),
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

export const interviewStages = vueNuxtSchema.table('interview_stages', {
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

// Event Sourcing Tables
export const applicationEvents = vueNuxtSchema.table('application_events', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  applicationId: uuid('application_id')
    .notNull()
    .references(() => applications.id, { onDelete: 'cascade' }),
  sequence: integer('sequence').notNull(),
  description: varchar('description', { length: 500 }).notNull(),
  changes: jsonb('changes').notNull().$type<FieldChange[]>(),
  patches: jsonb('patches').notNull().$type<ImmerPatch[]>(),
  inversePatches: jsonb('inverse_patches').notNull().$type<ImmerPatch[]>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique('application_events_application_id_sequence_unique').on(table.applicationId, table.sequence),
]);

export const applicationSnapshots = vueNuxtSchema.table('application_snapshots', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  applicationId: uuid('application_id')
    .notNull()
    .references(() => applications.id, { onDelete: 'cascade' }),
  atSequence: integer('at_sequence').notNull(),
  state: jsonb('state').notNull().$type<Application>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique('application_snapshots_application_id_at_sequence_unique').on(table.applicationId, table.atSequence),
]);

// Relations
export const applicationsRelations = relations(applications, ({ many }) => ({
  interviewStages: many(interviewStages),
  applicationEvents: many(applicationEvents),
  applicationSnapshots: many(applicationSnapshots),
}));

export const interviewStagesRelations = relations(interviewStages, ({ one }) => ({
  application: one(applications, {
    fields: [interviewStages.applicationId],
    references: [applications.id],
  }),
}));

export const applicationEventsRelations = relations(applicationEvents, ({ one }) => ({
  application: one(applications, {
    fields: [applicationEvents.applicationId],
    references: [applications.id],
  }),
}));

export const applicationSnapshotsRelations = relations(applicationSnapshots, ({ one }) => ({
  application: one(applications, {
    fields: [applicationSnapshots.applicationId],
    references: [applications.id],
  }),
}));

// DB-layer types (inferred from schema)
export type DbApplication = typeof applications.$inferSelect;
export type NewDbApplication = typeof applications.$inferInsert;
export type DbInterviewStage = typeof interviewStages.$inferSelect;
export type NewDbInterviewStage = typeof interviewStages.$inferInsert;
export type DbApplicationEvent = typeof applicationEvents.$inferSelect;
export type NewDbApplicationEvent = typeof applicationEvents.$inferInsert;
export type DbApplicationSnapshot = typeof applicationSnapshots.$inferSelect;
export type NewDbApplicationSnapshot = typeof applicationSnapshots.$inferInsert;
