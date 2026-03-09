-- CreateEnum
CREATE TYPE "application_status" AS ENUM ('wishlist', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn', 'archived');

-- CreateEnum
CREATE TYPE "company_category" AS ENUM ('enterprise-software', 'startup', 'mid-market', 'agency', 'government', 'nonprofit', 'other');

-- CreateEnum
CREATE TYPE "job_source" AS ENUM ('linkedin', 'indeed', 'referral', 'company-website', 'recruiter', 'job-board', 'other');

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "company_name" VARCHAR(200) NOT NULL,
    "position_title" VARCHAR(200) NOT NULL,
    "status" "application_status" NOT NULL DEFAULT 'wishlist',
    "date_applied" DATE,
    "job_posting_url" TEXT,
    "company_website_url" TEXT,
    "company_category" "company_category",
    "job_source" "job_source",
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "skills_match" INTEGER,
    "notes" TEXT,
    "contact_name" VARCHAR(200),
    "contact_email" VARCHAR(200),
    "offer_due_date" DATE,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_stages" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "stage_name" VARCHAR(200) NOT NULL,
    "stage_order" INTEGER NOT NULL,
    "scheduled_date" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_history" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changed_fields" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "application_history_application_id_sequence_key" ON "application_history"("application_id", "sequence");

-- AddForeignKey
ALTER TABLE "interview_stages" ADD CONSTRAINT "interview_stages_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_history" ADD CONSTRAINT "application_history_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
