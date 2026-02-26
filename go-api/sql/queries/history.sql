-- name: CreateSnapshot :one
INSERT INTO go_gin.application_snapshots (
  application_id, sequence_number, description, snapshot_data
) VALUES (
  $1, $2, $3, $4
) RETURNING *;

-- name: GetSnapshotsByApplicationID :many
SELECT * FROM go_gin.application_snapshots
WHERE application_id = $1
ORDER BY sequence_number DESC;

-- name: GetSnapshot :one
SELECT * FROM go_gin.application_snapshots
WHERE id = $1 AND application_id = $2;

-- name: GetNextSequenceNumber :one
SELECT COALESCE(MAX(sequence_number), 0) + 1 AS next_seq
FROM go_gin.application_snapshots
WHERE application_id = $1;
