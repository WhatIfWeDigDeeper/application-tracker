-- Fix domain model: update enums, add missing fields, update interview_stages schema

-- Step 1: Drop old enum columns (use text temporarily)
ALTER TABLE "applications" ALTER COLUMN "status" TYPE TEXT;
ALTER TABLE "applications" ALTER COLUMN "company_category" TYPE TEXT;
ALTER TABLE "applications" ALTER COLUMN "job_source" TYPE TEXT;

-- Step 2: Drop old enum types
DROP TYPE IF EXISTS "application_status" CASCADE;
DROP TYPE IF EXISTS "company_category" CASCADE;
DROP TYPE IF EXISTS "job_source" CASCADE;

-- Step 3: Create new enum types
CREATE TYPE "application_status" AS ENUM ('unsubmitted', 'applied', 'interviewing', 'given offer', 'accepted offer', 'declined offer', 'rejected', 'no offer');

CREATE TYPE "company_category" AS ENUM (
  'ai', 'climate', 'consulting', 'consumer-tech', 'cybersecurity',
  'e-commerce', 'education', 'energy', 'enterprise-software', 'finance',
  'gaming', 'government', 'health', 'hospitality', 'media-entertainment',
  'nonprofit', 'restaurant', 'retail', 'other'
);

CREATE TYPE "job_source" AS ENUM ('recruiter', 'linkedin', 'indeed', 'friend', 'colleague', 'company-website', 'other');

-- Step 4: Migrate old status values to new values
UPDATE "applications" SET "status" = 'unsubmitted' WHERE "status" = 'wishlist';
UPDATE "applications" SET "status" = 'applied' WHERE "status" = 'applied';
UPDATE "applications" SET "status" = 'interviewing' WHERE "status" = 'interviewing';
UPDATE "applications" SET "status" = 'rejected' WHERE "status" = 'rejected';
UPDATE "applications" SET "status" = 'unsubmitted' WHERE "status" = 'withdrawn';
UPDATE "applications" SET "status" = 'unsubmitted' WHERE "status" = 'archived';
UPDATE "applications" SET "status" = 'given offer' WHERE "status" = 'offer';

-- Step 5: Migrate old company_category values to new values
UPDATE "applications" SET "company_category" = NULL WHERE "company_category" IN ('startup', 'mid-market', 'agency');
UPDATE "applications" SET "company_category" = 'enterprise-software' WHERE "company_category" = 'enterprise-software';
UPDATE "applications" SET "company_category" = 'government' WHERE "company_category" = 'government';
UPDATE "applications" SET "company_category" = 'nonprofit' WHERE "company_category" = 'nonprofit';
UPDATE "applications" SET "company_category" = 'other' WHERE "company_category" = 'other';

-- Step 6: Migrate old job_source values to new values
UPDATE "applications" SET "job_source" = 'recruiter' WHERE "job_source" = 'recruiter';
UPDATE "applications" SET "job_source" = 'linkedin' WHERE "job_source" = 'linkedin';
UPDATE "applications" SET "job_source" = 'indeed' WHERE "job_source" = 'indeed';
UPDATE "applications" SET "job_source" = 'company-website' WHERE "job_source" = 'company-website';
UPDATE "applications" SET "job_source" = 'other' WHERE "job_source" IN ('referral', 'job-board', 'other');

-- Step 7: Restore enum types on columns
ALTER TABLE "applications" ALTER COLUMN "status" TYPE "application_status" USING "status"::"application_status";
ALTER TABLE "applications" ALTER COLUMN "status" SET DEFAULT 'unsubmitted'::"application_status";
ALTER TABLE "applications" ALTER COLUMN "company_category" TYPE "company_category" USING "company_category"::"company_category";
ALTER TABLE "applications" ALTER COLUMN "job_source" TYPE "job_source" USING "job_source"::"job_source";

-- Step 8: Add new application columns
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "company_url" TEXT;
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "company_career_url" TEXT;
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "cover_letter_required" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "special_requirements" TEXT;

-- Step 9: Copy old company_website_url to company_url
UPDATE "applications" SET "company_url" = "company_website_url" WHERE "company_website_url" IS NOT NULL;

-- Step 10: Drop old columns that are replaced
ALTER TABLE "applications" DROP COLUMN IF EXISTS "company_website_url";
ALTER TABLE "applications" DROP COLUMN IF EXISTS "contact_name";
ALTER TABLE "applications" DROP COLUMN IF EXISTS "contact_email";
ALTER TABLE "applications" DROP COLUMN IF EXISTS "is_archived";

-- Step 11: Re-add is_archived (keep it)
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "is_archived" BOOLEAN NOT NULL DEFAULT false;

-- Step 12: Rebuild interview_stages to match new schema
ALTER TABLE "interview_stages" DROP COLUMN IF EXISTS "stage_name";
ALTER TABLE "interview_stages" DROP COLUMN IF EXISTS "stage_order";
ALTER TABLE "interview_stages" DROP COLUMN IF EXISTS "scheduled_date";

ALTER TABLE "interview_stages" ADD COLUMN IF NOT EXISTS "name" VARCHAR(200);
ALTER TABLE "interview_stages" ADD COLUMN IF NOT EXISTS "order" INTEGER;
ALTER TABLE "interview_stages" ADD COLUMN IF NOT EXISTS "is_completed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "interview_stages" ADD COLUMN IF NOT EXISTS "completed_date" DATE;
ALTER TABLE "interview_stages" ADD COLUMN IF NOT EXISTS "performance_rating" INTEGER;

-- Set defaults for NOT NULL columns that were just added
UPDATE "interview_stages" SET "name" = 'Stage' WHERE "name" IS NULL;
UPDATE "interview_stages" SET "order" = 1 WHERE "order" IS NULL;
ALTER TABLE "interview_stages" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "interview_stages" ALTER COLUMN "order" SET NOT NULL;
