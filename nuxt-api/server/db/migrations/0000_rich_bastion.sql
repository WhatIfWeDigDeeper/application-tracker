CREATE SCHEMA "vue_nuxt";
--> statement-breakpoint
CREATE TYPE "vue_nuxt"."application_status" AS ENUM('applied', 'rejected', 'interviewing', 'given offer', 'accepted offer', 'declined offer', 'no offer');--> statement-breakpoint
CREATE TYPE "vue_nuxt"."company_category" AS ENUM('education', 'health', 'climate', 'ai', 'energy', 'finance', 'enterprise-software', 'consumer-tech', 'e-commerce', 'cybersecurity', 'gaming', 'media-entertainment', 'consulting', 'government', 'nonprofit', 'retail', 'restaurant', 'hospitality', 'other');--> statement-breakpoint
CREATE TYPE "vue_nuxt"."job_source" AS ENUM('recruiter', 'linkedin', 'indeed', 'friend', 'colleague', 'company-website', 'other');--> statement-breakpoint
CREATE TABLE "vue_nuxt"."applications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"company_name" varchar(200) NOT NULL,
	"position_title" varchar(200) NOT NULL,
	"date_applied" date NOT NULL,
	"status" "vue_nuxt"."application_status" DEFAULT 'applied' NOT NULL,
	"company_url" text,
	"job_posting_url" text,
	"company_career_url" text,
	"company_category" "vue_nuxt"."company_category",
	"skills_match" integer,
	"job_source" "vue_nuxt"."job_source",
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
CREATE TABLE "vue_nuxt"."interview_stages" (
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
ALTER TABLE "vue_nuxt"."interview_stages" ADD CONSTRAINT "interview_stages_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "vue_nuxt"."applications"("id") ON DELETE cascade ON UPDATE no action;