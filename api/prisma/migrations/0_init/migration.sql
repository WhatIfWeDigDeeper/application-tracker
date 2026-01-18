-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "positionTitle" TEXT NOT NULL,
    "dateApplied" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'unsubmitted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyUrl" TEXT,
    "jobPostingUrl" TEXT,
    "companyCareerUrl" TEXT,
    "companyCategory" TEXT,
    "skillsMatch" INTEGER,
    "jobSource" TEXT,
    "coverLetterRequired" BOOLEAN,
    "specialRequirements" TEXT,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "notes" TEXT,
    "offerDueDate" TIMESTAMP(3),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,

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
