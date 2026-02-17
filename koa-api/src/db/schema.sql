-- Database schema for Job Application Tracker
-- PostgreSQL

-- Create schema for react-koa-pg implementation
CREATE SCHEMA IF NOT EXISTS react_koa;

-- Set search path to use the react_koa schema
SET search_path TO react_koa;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA react_koa;

-- Application Status enum type
CREATE TYPE application_status AS ENUM (
  'applied',
  'rejected',
  'interviewing',
  'given offer',
  'accepted offer',
  'declined offer',
  'no offer'
);

-- Company Category enum type
CREATE TYPE company_category AS ENUM (
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
  'other'
);

-- Job Source enum type
CREATE TYPE job_source AS ENUM (
  'recruiter',
  'linkedin',
  'indeed',
  'friend',
  'colleague',
  'company-website',
  'other'
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name VARCHAR(200) NOT NULL,
  position_title VARCHAR(200) NOT NULL,
  date_applied DATE DEFAULT NULL,
  status application_status NOT NULL DEFAULT 'applied',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  company_url TEXT,
  job_posting_url TEXT,
  company_career_url TEXT,
  company_category company_category,
  skills_match INTEGER CHECK (skills_match IS NULL OR (skills_match >= 1 AND skills_match <= 5)),
  job_source job_source,
  cover_letter_required BOOLEAN,
  special_requirements VARCHAR(5000),
  salary_min INTEGER CHECK (salary_min IS NULL OR salary_min >= 0),
  salary_max INTEGER CHECK (salary_max IS NULL OR salary_max >= 0),
  notes TEXT CHECK (notes IS NULL OR LENGTH(notes) <= 5000),
  offer_due_date DATE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE
);

-- Interview Stages table
CREATE TABLE IF NOT EXISTS interview_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_date DATE,
  notes TEXT CHECK (notes IS NULL OR LENGTH(notes) <= 2000),
  performance_rating INTEGER CHECK (performance_rating IS NULL OR (performance_rating >= 1 AND performance_rating <= 5))
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_is_archived ON applications(is_archived);
CREATE INDEX IF NOT EXISTS idx_applications_date_applied ON applications(date_applied);
CREATE INDEX IF NOT EXISTS idx_applications_company_category ON applications(company_category);
CREATE INDEX IF NOT EXISTS idx_applications_job_source ON applications(job_source);
CREATE INDEX IF NOT EXISTS idx_applications_updated_at ON applications(updated_at);
CREATE INDEX IF NOT EXISTS idx_interview_stages_application_id ON interview_stages(application_id);
CREATE INDEX IF NOT EXISTS idx_interview_stages_order ON interview_stages(application_id, "order");

-- Application History table (snapshot-based)
CREATE TABLE IF NOT EXISTS application_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  description VARCHAR(500) NOT NULL,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_application_history_app_seq
  ON application_history(application_id, sequence);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
