-- 002_drop_enums: Replace custom PostgreSQL enum types with TEXT + CHECK constraints.
-- This removes the need for pgx v5 AfterConnect type registration.

-- applications.status
-- Must drop the enum-typed default before converting the column, then restore it as text.
ALTER TABLE go_gin.applications ALTER COLUMN status DROP DEFAULT;
ALTER TABLE go_gin.applications
    ALTER COLUMN status TYPE TEXT USING status::TEXT;
ALTER TABLE go_gin.applications ALTER COLUMN status SET DEFAULT 'unsubmitted';
ALTER TABLE go_gin.applications
    ADD CONSTRAINT applications_status_check
    CHECK (status IN ('unsubmitted', 'applied', 'phone_screen', 'interviewing',
                      'offer', 'rejected', 'withdrawn', 'accepted'));

-- applications.company_category
ALTER TABLE go_gin.applications
    ALTER COLUMN company_category TYPE TEXT USING company_category::TEXT;
ALTER TABLE go_gin.applications
    ADD CONSTRAINT applications_company_category_check
    CHECK (company_category IN ('small_startup', 'mid_size_company', 'large_company',
                                'faang', 'government', 'non_profit', 'other'));

-- applications.skills_match
ALTER TABLE go_gin.applications
    ALTER COLUMN skills_match TYPE TEXT USING skills_match::TEXT;
ALTER TABLE go_gin.applications
    ADD CONSTRAINT applications_skills_match_check
    CHECK (skills_match IN ('strong_match', 'good_match', 'partial_match', 'low_match'));

-- applications.job_source
ALTER TABLE go_gin.applications
    ALTER COLUMN job_source TYPE TEXT USING job_source::TEXT;
ALTER TABLE go_gin.applications
    ADD CONSTRAINT applications_job_source_check
    CHECK (job_source IN ('linkedin', 'indeed', 'company_website', 'referral', 'recruiter', 'other'));

-- interview_stages.performance_rating
ALTER TABLE go_gin.interview_stages
    ALTER COLUMN performance_rating TYPE TEXT USING performance_rating::TEXT;
ALTER TABLE go_gin.interview_stages
    ADD CONSTRAINT interview_stages_performance_rating_check
    CHECK (performance_rating IN ('excellent', 'good', 'average', 'poor'));

-- Drop the now-unused enum types
DROP TYPE go_gin.application_status;
DROP TYPE go_gin.company_category;
DROP TYPE go_gin.job_source;
DROP TYPE go_gin.skills_match;
DROP TYPE go_gin.performance_rating;
