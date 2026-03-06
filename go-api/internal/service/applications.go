// Package service provides business logic for the Go Gin API.
package service

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/user/application-tracker/go-api/internal/db"
)

// ErrValidation is returned when the caller provides invalid input (maps to HTTP 400).
type ErrValidation struct{ Message string }

func (e *ErrValidation) Error() string { return e.Message }

// ApplicationInput holds the fields for creating or updating an application.
type ApplicationInput struct {
	CompanyName         string  `json:"companyName"`
	PositionTitle       string  `json:"positionTitle"`
	Status              string  `json:"status"`
	DateApplied         *string `json:"dateApplied"`
	CompanyURL          *string `json:"companyUrl"`
	JobPostingURL       *string `json:"jobPostingUrl"`
	CompanyCareerURL    *string `json:"companyCareerUrl"`
	CompanyCategory     *string `json:"companyCategory"`
	SkillsMatch         *int32  `json:"skillsMatch"`
	JobSource           *string `json:"jobSource"`
	SalaryMin           *int32  `json:"salaryMin"`
	SalaryMax           *int32  `json:"salaryMax"`
	CoverLetterRequired bool    `json:"coverLetterRequired"`
	OfferDueDate        *string `json:"offerDueDate"`
	SpecialRequirements *string `json:"specialRequirements"`
	Notes               *string `json:"notes"`
}

// ApplicationResponse is the API response shape for an application (camelCase JSON).
type ApplicationResponse struct {
	ID                  string                   `json:"id"`
	CompanyName         string                   `json:"companyName"`
	PositionTitle       string                   `json:"positionTitle"`
	Status              string                   `json:"status"`
	DateApplied         *string                  `json:"dateApplied"`
	CompanyURL          *string                  `json:"companyUrl"`
	JobPostingURL       *string                  `json:"jobPostingUrl"`
	CompanyCareerURL    *string                  `json:"companyCareerUrl"`
	CompanyCategory     *string                  `json:"companyCategory"`
	SkillsMatch         *int32                   `json:"skillsMatch"`
	JobSource           *string                  `json:"jobSource"`
	SalaryMin           *int32                   `json:"salaryMin"`
	SalaryMax           *int32                   `json:"salaryMax"`
	CoverLetterRequired bool                     `json:"coverLetterRequired"`
	OfferDueDate        *string                  `json:"offerDueDate"`
	SpecialRequirements *string                  `json:"specialRequirements"`
	Notes               *string                  `json:"notes"`
	IsArchived          bool                     `json:"isArchived"`
	CreatedAt           time.Time                `json:"createdAt"`
	UpdatedAt           time.Time                `json:"updatedAt"`
	InterviewStages     []InterviewStageResponse `json:"interviewStages"`
}

// InterviewStageResponse is the API response shape for a stage.
type InterviewStageResponse struct {
	ID                string    `json:"id"`
	ApplicationID     string    `json:"applicationId"`
	StageName         string    `json:"stageName"`
	StageOrder        int32     `json:"stageOrder"`
	IsCompleted       bool      `json:"isCompleted"`
	PerformanceRating *string   `json:"performanceRating"`
	Notes             *string   `json:"notes"`
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

// ListParams holds list query parameters.
type ListParams struct {
	Status          *string
	IsArchived      *bool
	CompanyCategory *string
	JobSource       *string
	SkillsMatch     *int32
	SortBy          string
	SortDir         string
	Page            int
	Limit           int
}

// uuidToString converts a pgtype.UUID to a string.
func uuidToString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	return fmt.Sprintf("%x-%x-%x-%x-%x",
		u.Bytes[0:4], u.Bytes[4:6], u.Bytes[6:8], u.Bytes[8:10], u.Bytes[10:16])
}

// dateToString converts a pgtype.Date to *string (nil if not valid).
func dateToString(d pgtype.Date) *string {
	if !d.Valid {
		return nil
	}
	s := d.Time.Format("2006-01-02")
	return &s
}

// textToStringPtr converts a pgtype.Text to *string.
func textToStringPtr(t pgtype.Text) *string {
	if !t.Valid {
		return nil
	}
	return &t.String
}

// int4ToInt32Ptr converts a pgtype.Int4 to *int32.
func int4ToInt32Ptr(i pgtype.Int4) *int32 {
	if !i.Valid {
		return nil
	}
	return &i.Int32
}

// toAppResponse converts a db.Application + stages to ApplicationResponse.
func toAppResponse(app *db.Application, stages []db.InterviewStage) ApplicationResponse {
	stageResps := make([]InterviewStageResponse, 0, len(stages))
	for _, s := range stages {
		stageResps = append(stageResps, toStageResponse(&s))
	}

	return ApplicationResponse{
		ID:                  uuidToString(app.ID),
		CompanyName:         app.CompanyName,
		PositionTitle:       app.PositionTitle,
		Status:              app.Status,
		DateApplied:         dateToString(app.DateApplied),
		CompanyURL:          textToStringPtr(app.CompanyURL),
		JobPostingURL:       textToStringPtr(app.JobPostingURL),
		CompanyCareerURL:    textToStringPtr(app.CompanyCareerURL),
		CompanyCategory:     textToStringPtr(app.CompanyCategory),
		SkillsMatch:         int4ToInt32Ptr(app.SkillsMatch),
		JobSource:           textToStringPtr(app.JobSource),
		SalaryMin:           int4ToInt32Ptr(app.SalaryMin),
		SalaryMax:           int4ToInt32Ptr(app.SalaryMax),
		CoverLetterRequired: app.CoverLetterRequired,
		OfferDueDate:        dateToString(app.OfferDueDate),
		SpecialRequirements: textToStringPtr(app.SpecialRequirements),
		Notes:               textToStringPtr(app.Notes),
		IsArchived:          app.IsArchived,
		CreatedAt:           app.CreatedAt,
		UpdatedAt:           app.UpdatedAt,
		InterviewStages:     stageResps,
	}
}

// toStageResponse converts a db.InterviewStage to InterviewStageResponse.
func toStageResponse(s *db.InterviewStage) InterviewStageResponse {
	return InterviewStageResponse{
		ID:                uuidToString(s.ID),
		ApplicationID:     uuidToString(s.ApplicationID),
		StageName:         s.StageName,
		StageOrder:        s.StageOrder,
		IsCompleted:       s.IsCompleted,
		PerformanceRating: textToStringPtr(s.PerformanceRating),
		Notes:             textToStringPtr(s.Notes),
		CreatedAt:         s.CreatedAt,
		UpdatedAt:         s.UpdatedAt,
	}
}

// parseUUID parses a string UUID into pgtype.UUID.
func parseUUID(s string) (pgtype.UUID, error) {
	var u pgtype.UUID
	err := u.Scan(s)
	return u, err
}

// applyStatusDateConstraint enforces status/dateApplied business rules.
func applyStatusDateConstraint(status string, dateApplied *string) *string {
	if status == "unsubmitted" {
		return nil
	}
	if dateApplied != nil {
		return dateApplied
	}
	// Set today if transitioning away from unsubmitted with no date
	today := time.Now().Format("2006-01-02")
	return &today
}

// toNullableDate parses a *string date to pgtype.Date.
func toNullableDate(s *string) pgtype.Date {
	if s == nil || *s == "" {
		return pgtype.Date{Valid: false}
	}
	t, err := time.Parse("2006-01-02", *s)
	if err != nil {
		return pgtype.Date{Valid: false}
	}
	return pgtype.Date{Time: t, Valid: true, InfinityModifier: pgtype.Finite}
}

// toNullableText converts *string to pgtype.Text.
func toNullableText(s *string) pgtype.Text {
	if s == nil {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: *s, Valid: true}
}

// toNullableInt4 converts *int32 to pgtype.Int4.
func toNullableInt4(i *int32) pgtype.Int4 {
	if i == nil {
		return pgtype.Int4{Valid: false}
	}
	return pgtype.Int4{Int32: *i, Valid: true}
}

// getApplicationWithStages loads an application and its stages, returning an ApplicationResponse.
func getApplicationWithStages(ctx context.Context, pool *pgxpool.Pool, id pgtype.UUID) (*ApplicationResponse, error) {
	app, err := db.GetApplication(ctx, pool, id)
	if err != nil {
		return nil, err
	}
	if app == nil {
		return nil, nil
	}

	stages, err := db.GetStagesByApplicationID(ctx, pool, id)
	if err != nil {
		return nil, err
	}
	if stages == nil {
		stages = []db.InterviewStage{}
	}

	resp := toAppResponse(app, stages)
	return &resp, nil
}

// ListApplications lists applications with filtering and pagination.
func ListApplications(ctx context.Context, pool *pgxpool.Pool, params ListParams) ([]ApplicationResponse, int64, error) {
	if params.Limit <= 0 {
		params.Limit = 20
	}
	if params.Limit > 100 {
		params.Limit = 100
	}
	if params.Page <= 0 {
		params.Page = 1
	}
	offset := (params.Page - 1) * params.Limit

	dbParams := db.ListApplicationsParams{
		Status:          params.Status,
		IsArchived:      params.IsArchived,
		CompanyCategory: params.CompanyCategory,
		JobSource:       params.JobSource,
		SkillsMatch:     params.SkillsMatch,
		SortBy:          params.SortBy,
		SortDir:         params.SortDir,
		Limit:           int32(params.Limit),
		Offset:          int32(offset),
	}

	apps, err := db.ListApplications(ctx, pool, dbParams)
	if err != nil {
		return nil, 0, err
	}

	total, err := db.CountApplications(ctx, pool, dbParams)
	if err != nil {
		return nil, 0, err
	}

	results := make([]ApplicationResponse, 0, len(apps))
	for _, app := range apps {
		stages, err := db.GetStagesByApplicationID(ctx, pool, app.ID)
		if err != nil {
			return nil, 0, err
		}
		if stages == nil {
			stages = []db.InterviewStage{}
		}
		results = append(results, toAppResponse(&app, stages))
	}

	return results, total, nil
}

// GetApplication retrieves a single application by ID string.
func GetApplication(ctx context.Context, pool *pgxpool.Pool, id string) (*ApplicationResponse, error) {
	uid, err := parseUUID(id)
	if err != nil {
		return nil, fmt.Errorf("invalid UUID: %w", err)
	}
	return getApplicationWithStages(ctx, pool, uid)
}

// CreateApplication creates a new application.
func CreateApplication(ctx context.Context, pool *pgxpool.Pool, input ApplicationInput) (*ApplicationResponse, error) {
	if input.CompanyName == "" || input.PositionTitle == "" {
		return nil, &ErrValidation{Message: "companyName and positionTitle are required"}
	}
	if input.Status == "" {
		input.Status = "unsubmitted"
	}
	input.DateApplied = applyStatusDateConstraint(input.Status, input.DateApplied)

	p := db.CreateApplicationParams{
		CompanyName:         input.CompanyName,
		PositionTitle:       input.PositionTitle,
		Status:              input.Status,
		DateApplied:         toNullableDate(input.DateApplied),
		CompanyURL:          toNullableText(input.CompanyURL),
		JobPostingURL:       toNullableText(input.JobPostingURL),
		CompanyCareerURL:    toNullableText(input.CompanyCareerURL),
		CompanyCategory:     toNullableText(input.CompanyCategory),
		SkillsMatch:         toNullableInt4(input.SkillsMatch),
		JobSource:           toNullableText(input.JobSource),
		SalaryMin:           toNullableInt4(input.SalaryMin),
		SalaryMax:           toNullableInt4(input.SalaryMax),
		CoverLetterRequired: input.CoverLetterRequired,
		OfferDueDate:        toNullableDate(input.OfferDueDate),
		SpecialRequirements: toNullableText(input.SpecialRequirements),
		Notes:               toNullableText(input.Notes),
	}

	app, err := db.CreateApplication(ctx, pool, p)
	if err != nil {
		return nil, err
	}

	// Create initial snapshot
	if err := CreateSnapshot(ctx, pool, app.ID, "Created application"); err != nil {
		return nil, err
	}

	return getApplicationWithStages(ctx, pool, app.ID)
}

// UpdateApplication updates an existing application.
func UpdateApplication(ctx context.Context, pool *pgxpool.Pool, id string, input ApplicationInput) (*ApplicationResponse, error) {
	uid, err := parseUUID(id)
	if err != nil {
		return nil, fmt.Errorf("invalid UUID: %w", err)
	}

	// Check exists
	existing, err := db.GetApplication(ctx, pool, uid)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, nil
	}

	if input.CompanyName == "" {
		input.CompanyName = existing.CompanyName
	}
	if input.PositionTitle == "" {
		input.PositionTitle = existing.PositionTitle
	}
	if input.Status == "" {
		input.Status = existing.Status
	}
	input.DateApplied = applyStatusDateConstraint(input.Status, input.DateApplied)

	p := db.UpdateApplicationParams{
		ID:                  uid,
		CompanyName:         input.CompanyName,
		PositionTitle:       input.PositionTitle,
		Status:              input.Status,
		DateApplied:         toNullableDate(input.DateApplied),
		CompanyURL:          toNullableText(input.CompanyURL),
		JobPostingURL:       toNullableText(input.JobPostingURL),
		CompanyCareerURL:    toNullableText(input.CompanyCareerURL),
		CompanyCategory:     toNullableText(input.CompanyCategory),
		SkillsMatch:         toNullableInt4(input.SkillsMatch),
		JobSource:           toNullableText(input.JobSource),
		SalaryMin:           toNullableInt4(input.SalaryMin),
		SalaryMax:           toNullableInt4(input.SalaryMax),
		CoverLetterRequired: input.CoverLetterRequired,
		OfferDueDate:        toNullableDate(input.OfferDueDate),
		SpecialRequirements: toNullableText(input.SpecialRequirements),
		Notes:               toNullableText(input.Notes),
	}

	_, err = db.UpdateApplication(ctx, pool, p)
	if err != nil {
		return nil, err
	}

	if err := CreateSnapshot(ctx, pool, uid, "Updated application"); err != nil {
		return nil, err
	}

	return getApplicationWithStages(ctx, pool, uid)
}

// DeleteApplication deletes an application by ID.
func DeleteApplication(ctx context.Context, pool *pgxpool.Pool, id string) error {
	uid, err := parseUUID(id)
	if err != nil {
		return fmt.Errorf("invalid UUID: %w", err)
	}
	return db.DeleteApplication(ctx, pool, uid)
}

// ArchiveApplication archives an application.
func ArchiveApplication(ctx context.Context, pool *pgxpool.Pool, id string) (*ApplicationResponse, error) {
	uid, err := parseUUID(id)
	if err != nil {
		return nil, fmt.Errorf("invalid UUID: %w", err)
	}

	app, err := db.ArchiveApplication(ctx, pool, uid)
	if err != nil {
		return nil, err
	}
	if app == nil {
		return nil, nil
	}

	if err := CreateSnapshot(ctx, pool, uid, "Archived application"); err != nil {
		return nil, err
	}

	return getApplicationWithStages(ctx, pool, uid)
}

// UnarchiveApplication restores an archived application.
func UnarchiveApplication(ctx context.Context, pool *pgxpool.Pool, id string) (*ApplicationResponse, error) {
	uid, err := parseUUID(id)
	if err != nil {
		return nil, fmt.Errorf("invalid UUID: %w", err)
	}

	app, err := db.UnarchiveApplication(ctx, pool, uid)
	if err != nil {
		return nil, err
	}
	if app == nil {
		return nil, nil
	}

	if err := CreateSnapshot(ctx, pool, uid, "Restored application"); err != nil {
		return nil, err
	}

	return getApplicationWithStages(ctx, pool, uid)
}
