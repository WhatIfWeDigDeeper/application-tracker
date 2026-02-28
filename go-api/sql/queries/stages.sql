-- name: GetStagesByApplicationID :many
SELECT * FROM go_gin.interview_stages
WHERE application_id = $1
ORDER BY stage_order ASC, created_at ASC;

-- name: CreateStage :one
INSERT INTO go_gin.interview_stages (
  application_id, stage_name, stage_order, is_completed, performance_rating, notes
) VALUES (
  $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: UpdateStage :one
UPDATE go_gin.interview_stages SET
  stage_name = $3,
  stage_order = $4,
  is_completed = $5,
  performance_rating = $6,
  notes = $7,
  updated_at = NOW()
WHERE id = $2 AND application_id = $1
RETURNING *;

-- name: DeleteStage :exec
DELETE FROM go_gin.interview_stages WHERE id = $2 AND application_id = $1;
