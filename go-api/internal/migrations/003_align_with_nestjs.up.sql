-- 003_align_with_nestjs: Align Go Gin enum values with NestJS implementation.
-- company_category changes from size-based to sector-based values.
-- skills_match changes from TEXT enum to INTEGER 1-5.

-- Map old company_category values to NestJS equivalents or NULL
UPDATE go_gin.applications
SET company_category = CASE
    WHEN company_category = 'non_profit' THEN 'nonprofit'
    WHEN company_category IN ('government', 'other') THEN company_category
    ELSE NULL
END
WHERE company_category IS NOT NULL;

ALTER TABLE go_gin.applications DROP CONSTRAINT applications_company_category_check;
ALTER TABLE go_gin.applications
    ADD CONSTRAINT applications_company_category_check
    CHECK (company_category IN ('education', 'health', 'climate', 'ai', 'energy', 'finance',
                                'enterprise-software', 'consumer-tech', 'e-commerce', 'cybersecurity',
                                'gaming', 'media-entertainment', 'consulting', 'government',
                                'nonprofit', 'retail', 'restaurant', 'hospitality', 'other'));

-- Convert skills_match text values to integer strings before type change
UPDATE go_gin.applications
SET skills_match = CASE skills_match
    WHEN 'strong_match' THEN '5'
    WHEN 'good_match' THEN '4'
    WHEN 'partial_match' THEN '3'
    WHEN 'low_match' THEN '2'
    ELSE NULL
END;

ALTER TABLE go_gin.applications DROP CONSTRAINT applications_skills_match_check;
ALTER TABLE go_gin.applications
    ALTER COLUMN skills_match TYPE INTEGER USING skills_match::integer;
ALTER TABLE go_gin.applications
    ADD CONSTRAINT applications_skills_match_check CHECK (skills_match BETWEEN 1 AND 5);
