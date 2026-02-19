CREATE SCHEMA IF NOT EXISTS python_fastapi;

CREATE TYPE python_fastapi.application_status AS ENUM (
    'unsubmitted', 'applied', 'rejected', 'interviewing',
    'given offer', 'accepted offer', 'declined offer', 'no offer'
);

CREATE TYPE python_fastapi.company_category AS ENUM (
    'education', 'health', 'climate', 'ai', 'energy', 'finance',
    'enterprise-software', 'consumer-tech', 'e-commerce', 'cybersecurity',
    'gaming', 'media-entertainment', 'consulting', 'government',
    'nonprofit', 'retail', 'restaurant', 'hospitality', 'other'
);

CREATE TYPE python_fastapi.job_source AS ENUM (
    'recruiter', 'linkedin', 'indeed', 'friend', 'colleague',
    'company-website', 'other'
);

CREATE TABLE python_fastapi.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(200) NOT NULL,
    position_title VARCHAR(200) NOT NULL,
    date_applied DATE,
    status python_fastapi.application_status NOT NULL DEFAULT 'unsubmitted',
    company_url TEXT,
    job_posting_url TEXT,
    company_career_url TEXT,
    company_category python_fastapi.company_category,
    skills_match INTEGER,
    job_source python_fastapi.job_source,
    cover_letter_required BOOLEAN,
    special_requirements TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    notes TEXT,
    offer_due_date DATE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE python_fastapi.interview_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES python_fastapi.applications(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    "order" INTEGER NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_date DATE,
    notes TEXT,
    performance_rating INTEGER
);

CREATE TABLE python_fastapi.application_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES python_fastapi.applications(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL,
    description VARCHAR(500) NOT NULL,
    snapshot JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
