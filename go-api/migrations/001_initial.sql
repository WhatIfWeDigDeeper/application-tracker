CREATE SCHEMA IF NOT EXISTS go_gin;

CREATE TYPE go_gin.application_status AS ENUM (
  'unsubmitted', 'applied', 'phone_screen', 'interviewing',
  'offer', 'rejected', 'withdrawn', 'accepted'
);
CREATE TYPE go_gin.company_category AS ENUM (
  'small_startup', 'mid_size_company', 'large_company', 'faang', 'government', 'non_profit', 'other'
);
CREATE TYPE go_gin.job_source AS ENUM (
  'linkedin', 'indeed', 'company_website', 'referral', 'recruiter', 'other'
);
CREATE TYPE go_gin.skills_match AS ENUM (
  'strong_match', 'good_match', 'partial_match', 'low_match'
);
CREATE TYPE go_gin.performance_rating AS ENUM (
  'excellent', 'good', 'average', 'poor'
);

CREATE TABLE go_gin.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  position_title TEXT NOT NULL,
  status go_gin.application_status NOT NULL DEFAULT 'unsubmitted',
  date_applied DATE,
  company_url TEXT,
  job_posting_url TEXT,
  company_career_url TEXT,
  company_category go_gin.company_category,
  skills_match go_gin.skills_match,
  job_source go_gin.job_source,
  salary_min INTEGER,
  salary_max INTEGER,
  cover_letter_required BOOLEAN NOT NULL DEFAULT false,
  offer_due_date DATE,
  special_requirements TEXT,
  notes TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE go_gin.interview_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES go_gin.applications(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  stage_order INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  performance_rating go_gin.performance_rating,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE go_gin.application_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES go_gin.applications(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
