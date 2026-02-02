-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "express_prisma";

-- Move existing tables to express_prisma schema
ALTER TABLE "Application" SET SCHEMA "express_prisma";
ALTER TABLE "InterviewStage" SET SCHEMA "express_prisma";

-- CreateEnum
CREATE TYPE "express_prisma"."ApplicationStatus" AS ENUM ('unsubmitted', 'applied', 'interviewing', 'offered', 'rejected', 'accepted');

-- CreateEnum
CREATE TYPE "express_prisma"."CompanyCategory" AS ENUM ('startup', 'scale_up', 'mid_market', 'enterprise', 'other');

-- CreateEnum
CREATE TYPE "express_prisma"."JobSource" AS ENUM ('referral', 'job_board', 'company_website', 'recruiter', 'other');
