// Code generated manually (sqlc not available). DO NOT EDIT.

package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ListApplicationsParams holds filter/pagination parameters for listing applications.
type ListApplicationsParams struct {
	Status          *string
	IsArchived      *bool
	CompanyCategory *string
	JobSource       *string
	SkillsMatch     *string
	SortBy          string
	SortDir         string
	Limit           int32
	Offset          int32
}

// ListApplications queries applications with optional filters and pagination.
func ListApplications(ctx context.Context, pool *pgxpool.Pool, params ListApplicationsParams) ([]Application, error) {
	sortBy := "updated_at"
	validSortCols := map[string]bool{
		"updated_at": true, "created_at": true, "company_name": true,
		"position_title": true, "date_applied": true, "status": true,
	}
	if validSortCols[params.SortBy] {
		sortBy = params.SortBy
	}

	sortDir := "DESC"
	if params.SortDir == "asc" || params.SortDir == "ASC" {
		sortDir = "ASC"
	}

	query := fmt.Sprintf(`
		SELECT id, company_name, position_title, status, date_applied,
		       company_url, job_posting_url, company_career_url,
		       company_category, skills_match, job_source,
		       salary_min, salary_max, cover_letter_required,
		       offer_due_date, special_requirements, notes,
		       is_archived, created_at, updated_at
		FROM go_gin.applications
		WHERE
		  ($1::go_gin.application_status IS NULL OR status = $1::go_gin.application_status)
		  AND ($2::boolean IS NULL OR is_archived = $2::boolean)
		  AND ($3::go_gin.company_category IS NULL OR company_category = $3::go_gin.company_category)
		  AND ($4::go_gin.job_source IS NULL OR job_source = $4::go_gin.job_source)
		  AND ($5::go_gin.skills_match IS NULL OR skills_match = $5::go_gin.skills_match)
		ORDER BY %s %s
		LIMIT $6 OFFSET $7`, sortBy, sortDir)

	rows, err := pool.Query(ctx, query,
		params.Status, params.IsArchived, params.CompanyCategory,
		params.JobSource, params.SkillsMatch,
		params.Limit, params.Offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanApplicationRows(rows)
}

// CountApplications counts applications matching the given filters.
func CountApplications(ctx context.Context, pool *pgxpool.Pool, params ListApplicationsParams) (int64, error) {
	query := `
		SELECT COUNT(*) FROM go_gin.applications
		WHERE
		  ($1::go_gin.application_status IS NULL OR status = $1::go_gin.application_status)
		  AND ($2::boolean IS NULL OR is_archived = $2::boolean)
		  AND ($3::go_gin.company_category IS NULL OR company_category = $3::go_gin.company_category)
		  AND ($4::go_gin.job_source IS NULL OR job_source = $4::go_gin.job_source)
		  AND ($5::go_gin.skills_match IS NULL OR skills_match = $5::go_gin.skills_match)`

	var count int64
	err := pool.QueryRow(ctx, query,
		params.Status, params.IsArchived, params.CompanyCategory,
		params.JobSource, params.SkillsMatch,
	).Scan(&count)
	return count, err
}

// GetApplication fetches a single application by ID.
func GetApplication(ctx context.Context, pool *pgxpool.Pool, id pgtype.UUID) (*Application, error) {
	query := `
		SELECT id, company_name, position_title, status, date_applied,
		       company_url, job_posting_url, company_career_url,
		       company_category, skills_match, job_source,
		       salary_min, salary_max, cover_letter_required,
		       offer_due_date, special_requirements, notes,
		       is_archived, created_at, updated_at
		FROM go_gin.applications WHERE id = $1`

	row := pool.QueryRow(ctx, query, id)
	app, err := scanApplicationRow(row)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return app, err
}

// CreateApplicationParams holds input for creating an application.
type CreateApplicationParams struct {
	CompanyName         string
	PositionTitle       string
	Status              string
	DateApplied         pgtype.Date
	CompanyURL          pgtype.Text
	JobPostingURL       pgtype.Text
	CompanyCareerURL    pgtype.Text
	CompanyCategory     pgtype.Text
	SkillsMatch         pgtype.Text
	JobSource           pgtype.Text
	SalaryMin           pgtype.Int4
	SalaryMax           pgtype.Int4
	CoverLetterRequired bool
	OfferDueDate        pgtype.Date
	SpecialRequirements pgtype.Text
	Notes               pgtype.Text
}

// CreateApplication inserts a new application and returns it.
func CreateApplication(ctx context.Context, pool *pgxpool.Pool, p CreateApplicationParams) (*Application, error) {
	query := `
		INSERT INTO go_gin.applications (
		  company_name, position_title, status, date_applied,
		  company_url, job_posting_url, company_career_url,
		  company_category, skills_match, job_source,
		  salary_min, salary_max, cover_letter_required,
		  offer_due_date, special_requirements, notes
		) VALUES (
		  $1, $2, $3::go_gin.application_status, $4,
		  $5, $6, $7,
		  $8::go_gin.company_category, $9::go_gin.skills_match, $10::go_gin.job_source,
		  $11, $12, $13,
		  $14, $15, $16
		)
		RETURNING id, company_name, position_title, status, date_applied,
		          company_url, job_posting_url, company_career_url,
		          company_category, skills_match, job_source,
		          salary_min, salary_max, cover_letter_required,
		          offer_due_date, special_requirements, notes,
		          is_archived, created_at, updated_at`

	row := pool.QueryRow(ctx, query,
		p.CompanyName, p.PositionTitle, p.Status, p.DateApplied,
		p.CompanyURL, p.JobPostingURL, p.CompanyCareerURL,
		p.CompanyCategory, p.SkillsMatch, p.JobSource,
		p.SalaryMin, p.SalaryMax, p.CoverLetterRequired,
		p.OfferDueDate, p.SpecialRequirements, p.Notes,
	)
	return scanApplicationRow(row)
}

// UpdateApplicationParams holds input for updating an application.
type UpdateApplicationParams struct {
	ID                  pgtype.UUID
	CompanyName         string
	PositionTitle       string
	Status              string
	DateApplied         pgtype.Date
	CompanyURL          pgtype.Text
	JobPostingURL       pgtype.Text
	CompanyCareerURL    pgtype.Text
	CompanyCategory     pgtype.Text
	SkillsMatch         pgtype.Text
	JobSource           pgtype.Text
	SalaryMin           pgtype.Int4
	SalaryMax           pgtype.Int4
	CoverLetterRequired bool
	OfferDueDate        pgtype.Date
	SpecialRequirements pgtype.Text
	Notes               pgtype.Text
}

// UpdateApplication updates an application and returns it.
func UpdateApplication(ctx context.Context, pool *pgxpool.Pool, p UpdateApplicationParams) (*Application, error) {
	query := `
		UPDATE go_gin.applications SET
		  company_name = $2, position_title = $3,
		  status = $4::go_gin.application_status, date_applied = $5,
		  company_url = $6, job_posting_url = $7, company_career_url = $8,
		  company_category = $9::go_gin.company_category,
		  skills_match = $10::go_gin.skills_match,
		  job_source = $11::go_gin.job_source,
		  salary_min = $12, salary_max = $13,
		  cover_letter_required = $14,
		  offer_due_date = $15, special_requirements = $16, notes = $17,
		  updated_at = NOW()
		WHERE id = $1
		RETURNING id, company_name, position_title, status, date_applied,
		          company_url, job_posting_url, company_career_url,
		          company_category, skills_match, job_source,
		          salary_min, salary_max, cover_letter_required,
		          offer_due_date, special_requirements, notes,
		          is_archived, created_at, updated_at`

	row := pool.QueryRow(ctx, query,
		p.ID, p.CompanyName, p.PositionTitle,
		p.Status, p.DateApplied,
		p.CompanyURL, p.JobPostingURL, p.CompanyCareerURL,
		p.CompanyCategory, p.SkillsMatch, p.JobSource,
		p.SalaryMin, p.SalaryMax, p.CoverLetterRequired,
		p.OfferDueDate, p.SpecialRequirements, p.Notes,
	)
	return scanApplicationRow(row)
}

// DeleteApplication removes an application by ID.
func DeleteApplication(ctx context.Context, pool *pgxpool.Pool, id pgtype.UUID) error {
	_, err := pool.Exec(ctx, `DELETE FROM go_gin.applications WHERE id = $1`, id)
	return err
}

// ArchiveApplication sets is_archived=true on an application.
func ArchiveApplication(ctx context.Context, pool *pgxpool.Pool, id pgtype.UUID) (*Application, error) {
	query := `
		UPDATE go_gin.applications SET is_archived = true, updated_at = NOW()
		WHERE id = $1
		RETURNING id, company_name, position_title, status, date_applied,
		          company_url, job_posting_url, company_career_url,
		          company_category, skills_match, job_source,
		          salary_min, salary_max, cover_letter_required,
		          offer_due_date, special_requirements, notes,
		          is_archived, created_at, updated_at`
	row := pool.QueryRow(ctx, query, id)
	return scanApplicationRow(row)
}

// UnarchiveApplication sets is_archived=false on an application.
func UnarchiveApplication(ctx context.Context, pool *pgxpool.Pool, id pgtype.UUID) (*Application, error) {
	query := `
		UPDATE go_gin.applications SET is_archived = false, updated_at = NOW()
		WHERE id = $1
		RETURNING id, company_name, position_title, status, date_applied,
		          company_url, job_posting_url, company_career_url,
		          company_category, skills_match, job_source,
		          salary_min, salary_max, cover_letter_required,
		          offer_due_date, special_requirements, notes,
		          is_archived, created_at, updated_at`
	row := pool.QueryRow(ctx, query, id)
	return scanApplicationRow(row)
}

// GetStagesByApplicationID returns all interview stages for an application.
func GetStagesByApplicationID(ctx context.Context, pool *pgxpool.Pool, applicationID pgtype.UUID) ([]InterviewStage, error) {
	query := `
		SELECT id, application_id, stage_name, stage_order, is_completed,
		       performance_rating, notes, created_at, updated_at
		FROM go_gin.interview_stages
		WHERE application_id = $1
		ORDER BY stage_order ASC, created_at ASC`

	rows, err := pool.Query(ctx, query, applicationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanStageRows(rows)
}

// CreateStageParams holds input for creating a stage.
type CreateStageParams struct {
	ApplicationID     pgtype.UUID
	StageName         string
	StageOrder        int32
	IsCompleted       bool
	PerformanceRating pgtype.Text
	Notes             pgtype.Text
}

// CreateStage inserts a new interview stage.
func CreateStage(ctx context.Context, pool *pgxpool.Pool, p CreateStageParams) (*InterviewStage, error) {
	query := `
		INSERT INTO go_gin.interview_stages (
		  application_id, stage_name, stage_order, is_completed, performance_rating, notes
		) VALUES ($1, $2, $3, $4, $5::go_gin.performance_rating, $6)
		RETURNING id, application_id, stage_name, stage_order, is_completed,
		          performance_rating, notes, created_at, updated_at`

	row := pool.QueryRow(ctx, query,
		p.ApplicationID, p.StageName, p.StageOrder, p.IsCompleted,
		p.PerformanceRating, p.Notes,
	)
	return scanStageRow(row)
}

// UpdateStageParams holds input for updating a stage.
type UpdateStageParams struct {
	ApplicationID     pgtype.UUID
	ID                pgtype.UUID
	StageName         string
	StageOrder        int32
	IsCompleted       bool
	PerformanceRating pgtype.Text
	Notes             pgtype.Text
}

// UpdateStage updates an interview stage.
func UpdateStage(ctx context.Context, pool *pgxpool.Pool, p UpdateStageParams) (*InterviewStage, error) {
	query := `
		UPDATE go_gin.interview_stages SET
		  stage_name = $3, stage_order = $4, is_completed = $5,
		  performance_rating = $6::go_gin.performance_rating, notes = $7,
		  updated_at = NOW()
		WHERE id = $2 AND application_id = $1
		RETURNING id, application_id, stage_name, stage_order, is_completed,
		          performance_rating, notes, created_at, updated_at`

	row := pool.QueryRow(ctx, query,
		p.ApplicationID, p.ID, p.StageName, p.StageOrder,
		p.IsCompleted, p.PerformanceRating, p.Notes,
	)
	return scanStageRow(row)
}

// DeleteStage removes an interview stage.
func DeleteStage(ctx context.Context, pool *pgxpool.Pool, applicationID, id pgtype.UUID) error {
	_, err := pool.Exec(ctx,
		`DELETE FROM go_gin.interview_stages WHERE id = $2 AND application_id = $1`,
		applicationID, id,
	)
	return err
}

// CreateSnapshotParams holds input for creating a snapshot.
type CreateSnapshotParams struct {
	ApplicationID  pgtype.UUID
	SequenceNumber int32
	Description    string
	SnapshotData   []byte
}

// CreateSnapshot inserts an application snapshot.
func CreateSnapshot(ctx context.Context, pool *pgxpool.Pool, p CreateSnapshotParams) (*ApplicationSnapshot, error) {
	query := `
		INSERT INTO go_gin.application_snapshots (application_id, sequence_number, description, snapshot_data)
		VALUES ($1, $2, $3, $4)
		RETURNING id, application_id, sequence_number, description, snapshot_data, created_at`

	row := pool.QueryRow(ctx, query, p.ApplicationID, p.SequenceNumber, p.Description, p.SnapshotData)
	return scanSnapshotRow(row)
}

// GetSnapshotsByApplicationID returns all snapshots for an application, newest first.
func GetSnapshotsByApplicationID(ctx context.Context, pool *pgxpool.Pool, applicationID pgtype.UUID) ([]ApplicationSnapshot, error) {
	query := `
		SELECT id, application_id, sequence_number, description, snapshot_data, created_at
		FROM go_gin.application_snapshots
		WHERE application_id = $1
		ORDER BY sequence_number DESC`

	rows, err := pool.Query(ctx, query, applicationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanSnapshotRows(rows)
}

// GetSnapshot fetches a single snapshot by ID and applicationID.
func GetSnapshot(ctx context.Context, pool *pgxpool.Pool, id, applicationID pgtype.UUID) (*ApplicationSnapshot, error) {
	query := `
		SELECT id, application_id, sequence_number, description, snapshot_data, created_at
		FROM go_gin.application_snapshots
		WHERE id = $1 AND application_id = $2`

	row := pool.QueryRow(ctx, query, id, applicationID)
	snap, err := scanSnapshotRow(row)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return snap, err
}

// GetNextSequenceNumber returns the next sequence number for snapshots of an application.
func GetNextSequenceNumber(ctx context.Context, pool *pgxpool.Pool, applicationID pgtype.UUID) (int32, error) {
	var next int32
	err := pool.QueryRow(ctx, `
		SELECT COALESCE(MAX(sequence_number), 0) + 1
		FROM go_gin.application_snapshots
		WHERE application_id = $1`, applicationID).Scan(&next)
	return next, err
}

// GetAllApplications returns all applications ordered by date_applied desc (for CSV export).
func GetAllApplications(ctx context.Context, pool *pgxpool.Pool) ([]Application, error) {
	query := `
		SELECT id, company_name, position_title, status, date_applied,
		       company_url, job_posting_url, company_career_url,
		       company_category, skills_match, job_source,
		       salary_min, salary_max, cover_letter_required,
		       offer_due_date, special_requirements, notes,
		       is_archived, created_at, updated_at
		FROM go_gin.applications
		ORDER BY date_applied DESC NULLS LAST, updated_at DESC`

	rows, err := pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanApplicationRows(rows)
}

// GetApplicationByJobPostingURL returns an application matching a job_posting_url (for duplicate detection).
func GetApplicationByJobPostingURL(ctx context.Context, pool *pgxpool.Pool, url string) (*Application, error) {
	query := `
		SELECT id, company_name, position_title, status, date_applied,
		       company_url, job_posting_url, company_career_url,
		       company_category, skills_match, job_source,
		       salary_min, salary_max, cover_letter_required,
		       offer_due_date, special_requirements, notes,
		       is_archived, created_at, updated_at
		FROM go_gin.applications WHERE job_posting_url = $1 LIMIT 1`

	row := pool.QueryRow(ctx, query, url)
	app, err := scanApplicationRow(row)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return app, err
}

// --- scan helpers ---

func scanApplicationRow(row pgx.Row) (*Application, error) {
	app := &Application{}
	err := row.Scan(
		&app.ID, &app.CompanyName, &app.PositionTitle, &app.Status, &app.DateApplied,
		&app.CompanyURL, &app.JobPostingURL, &app.CompanyCareerURL,
		&app.CompanyCategory, &app.SkillsMatch, &app.JobSource,
		&app.SalaryMin, &app.SalaryMax, &app.CoverLetterRequired,
		&app.OfferDueDate, &app.SpecialRequirements, &app.Notes,
		&app.IsArchived, &app.CreatedAt, &app.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return app, nil
}

func scanApplicationRows(rows pgx.Rows) ([]Application, error) {
	var apps []Application
	for rows.Next() {
		app := Application{}
		err := rows.Scan(
			&app.ID, &app.CompanyName, &app.PositionTitle, &app.Status, &app.DateApplied,
			&app.CompanyURL, &app.JobPostingURL, &app.CompanyCareerURL,
			&app.CompanyCategory, &app.SkillsMatch, &app.JobSource,
			&app.SalaryMin, &app.SalaryMax, &app.CoverLetterRequired,
			&app.OfferDueDate, &app.SpecialRequirements, &app.Notes,
			&app.IsArchived, &app.CreatedAt, &app.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		apps = append(apps, app)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return apps, nil
}

func scanStageRow(row pgx.Row) (*InterviewStage, error) {
	s := &InterviewStage{}
	err := row.Scan(
		&s.ID, &s.ApplicationID, &s.StageName, &s.StageOrder, &s.IsCompleted,
		&s.PerformanceRating, &s.Notes, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return s, nil
}

func scanStageRows(rows pgx.Rows) ([]InterviewStage, error) {
	var stages []InterviewStage
	for rows.Next() {
		s := InterviewStage{}
		err := rows.Scan(
			&s.ID, &s.ApplicationID, &s.StageName, &s.StageOrder, &s.IsCompleted,
			&s.PerformanceRating, &s.Notes, &s.CreatedAt, &s.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		stages = append(stages, s)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return stages, nil
}

func scanSnapshotRow(row pgx.Row) (*ApplicationSnapshot, error) {
	s := &ApplicationSnapshot{}
	err := row.Scan(&s.ID, &s.ApplicationID, &s.SequenceNumber, &s.Description, &s.SnapshotData, &s.CreatedAt)
	if err != nil {
		return nil, err
	}
	return s, nil
}

func scanSnapshotRows(rows pgx.Rows) ([]ApplicationSnapshot, error) {
	var snaps []ApplicationSnapshot
	for rows.Next() {
		s := ApplicationSnapshot{}
		err := rows.Scan(&s.ID, &s.ApplicationID, &s.SequenceNumber, &s.Description, &s.SnapshotData, &s.CreatedAt)
		if err != nil {
			return nil, err
		}
		snaps = append(snaps, s)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return snaps, nil
}
