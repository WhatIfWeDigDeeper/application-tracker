-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('unsubmitted', 'applied', 'interviewing', 'offered', 'rejected', 'accepted');

-- CreateEnum
CREATE TYPE "CompanyCategory" AS ENUM ('startup', 'scale_up', 'mid_market', 'enterprise', 'other');

-- CreateEnum
CREATE TYPE "JobSource" AS ENUM ('referral', 'job_board', 'company_website', 'recruiter', 'other');

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "positionTitle" TEXT NOT NULL,
    "dateApplied" TIMESTAMP(3) NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'unsubmitted',
    "interviewUrl" TEXT,
    "onsite" BOOLEAN,
    "salary" INTEGER,
    "companyCategory" "CompanyCategory",
    "jobSource" "JobSource",
    "notes" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewStage" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedDate" TIMESTAMP(3),
    "notes" TEXT,
    "performanceRating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewStage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Application_isArchived_idx" ON "Application"("isArchived");

-- CreateIndex
CREATE INDEX "InterviewStage_applicationId_idx" ON "InterviewStage"("applicationId");

-- AddForeignKey
ALTER TABLE "InterviewStage" ADD CONSTRAINT "InterviewStage_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
