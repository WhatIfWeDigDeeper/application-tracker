-- 004_align_job_source_with_nestjs: Align Go Gin job_source values with NestJS implementation.
-- NestJS uses 'company-website' (hyphen) and adds 'friend'/'colleague'; removes 'referral'.

-- Rename company_website (underscore) to company-website (hyphen)
UPDATE go_gin.applications
SET job_source = 'company-website'
WHERE job_source = 'company_website';

-- Map referral to NULL (no NestJS equivalent)
UPDATE go_gin.applications
SET job_source = NULL
WHERE job_source = 'referral';

ALTER TABLE go_gin.applications DROP CONSTRAINT applications_job_source_check;
ALTER TABLE go_gin.applications
    ADD CONSTRAINT applications_job_source_check
    CHECK (job_source IN ('recruiter', 'linkedin', 'indeed', 'friend', 'colleague', 'company-website', 'other'));
