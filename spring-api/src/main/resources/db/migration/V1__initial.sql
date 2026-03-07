CREATE SCHEMA IF NOT EXISTS java_spring;

SET search_path TO java_spring;

CREATE TYPE application_status AS ENUM (
    'unsubmitted',
    'applied',
    'interviewing',
    'given offer',
    'accepted offer',
    'declined offer',
    'rejected',
    'no offer'
);

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

CREATE TYPE job_source AS ENUM (
    'recruiter',
    'linkedin',
    'indeed',
    'friend',
    'colleague',
    'company-website',
    'other'
);

CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(200) NOT NULL,
    position_title VARCHAR(200) NOT NULL,
    status application_status NOT NULL DEFAULT 'unsubmitted',
    date_applied DATE,
    company_url VARCHAR(500),
    job_posting_url VARCHAR(500),
    company_career_url VARCHAR(500),
    company_category company_category,
    skills_match INTEGER CHECK (skills_match >= 1 AND skills_match <= 10),
    job_source job_source,
    salary_min INTEGER,
    salary_max INTEGER,
    cover_letter_required BOOLEAN DEFAULT FALSE,
    offer_due_date DATE,
    special_requirements TEXT,
    notes TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE interview_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    stage_name VARCHAR(200) NOT NULL,
    stage_order INTEGER NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_date DATE,
    notes TEXT,
    performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE application_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL,
    description VARCHAR(500) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_updated_at ON applications(updated_at DESC);
CREATE INDEX idx_applications_is_archived ON applications(is_archived);
CREATE INDEX idx_interview_stages_application_id ON interview_stages(application_id);
CREATE INDEX idx_application_snapshots_application_id ON application_snapshots(application_id, sequence_number DESC);
