CREATE SCHEMA "svelte_hono";
--> statement-breakpoint
CREATE TYPE "svelte_hono"."application_status" AS ENUM('applied', 'rejected', 'interviewing', 'given offer', 'accepted offer', 'declined offer', 'no offer');--> statement-breakpoint
CREATE TYPE "svelte_hono"."company_category" AS ENUM('education', 'health', 'climate', 'ai', 'energy', 'finance', 'enterprise-software', 'consumer-tech', 'e-commerce', 'cybersecurity', 'gaming', 'media-entertainment', 'consulting', 'government', 'nonprofit', 'retail', 'restaurant', 'hospitality', 'other');--> statement-breakpoint
CREATE TYPE "svelte_hono"."job_source" AS ENUM('recruiter', 'linkedin', 'indeed', 'friend', 'colleague', 'company-website', 'other');--> statement-breakpoint
CREATE TABLE "svelte_hono"."application_history" (
	"id" uuid PRIMARY KEY NOT NULL,
	"application_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"description" varchar(500) NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "svelte_hono"."applications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"company_name" varchar(200) NOT NULL,
	"position_title" varchar(200) NOT NULL,
	"date_applied" date NOT NULL,
	"status" "svelte_hono"."application_status" DEFAULT 'applied' NOT NULL,
	"company_url" text,
	"job_posting_url" text,
	"company_career_url" text,
	"company_category" "svelte_hono"."company_category",
	"skills_match" integer,
	"job_source" "svelte_hono"."job_source",
	"cover_letter_required" boolean,
	"special_requirements" text,
	"salary_min" integer,
	"salary_max" integer,
	"notes" text,
	"offer_due_date" date,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "svelte_hono"."interview_stages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"application_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"order" integer NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_date" date,
	"notes" text,
	"performance_rating" integer
);
--> statement-breakpoint
ALTER TABLE "svelte_hono"."application_history" ADD CONSTRAINT "application_history_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "svelte_hono"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "svelte_hono"."interview_stages" ADD CONSTRAINT "interview_stages_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "svelte_hono"."applications"("id") ON DELETE cascade ON UPDATE no action;