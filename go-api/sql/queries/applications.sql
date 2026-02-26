-- name: ListApplications :many
SELECT * FROM go_gin.applications
WHERE
  (sqlc.narg('status')::go_gin.application_status IS NULL OR status = sqlc.narg('status')::go_gin.application_status)
  AND (sqlc.narg('is_archived')::boolean IS NULL OR is_archived = sqlc.narg('is_archived')::boolean)
  AND (sqlc.narg('company_category')::go_gin.company_category IS NULL OR company_category = sqlc.narg('company_category')::go_gin.company_category)
  AND (sqlc.narg('job_source')::go_gin.job_source IS NULL OR job_source = sqlc.narg('job_source')::go_gin.job_source)
  AND (sqlc.narg('skills_match')::go_gin.skills_match IS NULL OR skills_match = sqlc.narg('skills_match')::go_gin.skills_match)
ORDER BY updated_at DESC
LIMIT sqlc.arg('limit')::integer
OFFSET sqlc.arg('offset')::integer;

-- name: CountApplications :one
SELECT COUNT(*) FROM go_gin.applications
WHERE
  (sqlc.narg('status')::go_gin.application_status IS NULL OR status = sqlc.narg('status')::go_gin.application_status)
  AND (sqlc.narg('is_archived')::boolean IS NULL OR is_archived = sqlc.narg('is_archived')::boolean)
  AND (sqlc.narg('company_category')::go_gin.company_category IS NULL OR company_category = sqlc.narg('company_category')::go_gin.company_category)
  AND (sqlc.narg('job_source')::go_gin.job_source IS NULL OR job_source = sqlc.narg('job_source')::go_gin.job_source)
  AND (sqlc.narg('skills_match')::go_gin.skills_match IS NULL OR skills_match = sqlc.narg('skills_match')::go_gin.skills_match);

-- name: GetApplication :one
SELECT * FROM go_gin.applications WHERE id = $1;

-- name: CreateApplication :one
INSERT INTO go_gin.applications (
  company_name, position_title, status, date_applied,
  company_url, job_posting_url, company_career_url,
  company_category, skills_match, job_source,
  salary_min, salary_max, cover_letter_required,
  offer_due_date, special_requirements, notes
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
) RETURNING *;

-- name: UpdateApplication :one
UPDATE go_gin.applications SET
  company_name = $2,
  position_title = $3,
  status = $4,
  date_applied = $5,
  company_url = $6,
  job_posting_url = $7,
  company_career_url = $8,
  company_category = $9,
  skills_match = $10,
  job_source = $11,
  salary_min = $12,
  salary_max = $13,
  cover_letter_required = $14,
  offer_due_date = $15,
  special_requirements = $16,
  notes = $17,
  updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteApplication :exec
DELETE FROM go_gin.applications WHERE id = $1;

-- name: ArchiveApplication :one
UPDATE go_gin.applications SET is_archived = true, updated_at = NOW()
WHERE id = $1 RETURNING *;

-- name: UnarchiveApplication :one
UPDATE go_gin.applications SET is_archived = false, updated_at = NOW()
WHERE id = $1 RETURNING *;
