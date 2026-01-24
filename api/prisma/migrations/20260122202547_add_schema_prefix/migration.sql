-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "express_prisma";

-- Move existing tables to express_prisma schema
ALTER TABLE "Application" SET SCHEMA "express_prisma";
ALTER TABLE "InterviewStage" SET SCHEMA "express_prisma";
