package service

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/user/application-tracker/go-api/internal/db"
)

// StageInput holds the fields for creating or updating an interview stage.
type StageInput struct {
	StageName         string  `json:"stageName" binding:"required"`
	StageOrder        int32   `json:"stageOrder"`
	IsCompleted       bool    `json:"isCompleted"`
	PerformanceRating *string `json:"performanceRating"`
	Notes             *string `json:"notes"`
}

// AddStage adds an interview stage to an application and returns the full application.
func AddStage(ctx context.Context, pool *pgxpool.Pool, applicationID string, input StageInput) (*ApplicationResponse, error) {
	uid, err := parseUUID(applicationID)
	if err != nil {
		return nil, fmt.Errorf("invalid UUID: %w", err)
	}

	// Verify application exists
	app, err := db.GetApplication(ctx, pool, uid)
	if err != nil {
		return nil, err
	}
	if app == nil {
		return nil, nil
	}

	p := db.CreateStageParams{
		ApplicationID:     uid,
		StageName:         input.StageName,
		StageOrder:        input.StageOrder,
		IsCompleted:       input.IsCompleted,
		PerformanceRating: toNullableText(input.PerformanceRating),
		Notes:             toNullableText(input.Notes),
	}

	_, err = db.CreateStage(ctx, pool, p)
	if err != nil {
		return nil, err
	}

	if err := CreateSnapshot(ctx, pool, uid, "Added interview stage"); err != nil {
		return nil, err
	}

	return getApplicationWithStages(ctx, pool, uid)
}

// UpdateStage updates an interview stage and returns the full application.
func UpdateStage(ctx context.Context, pool *pgxpool.Pool, applicationID, stageID string, input StageInput) (*ApplicationResponse, error) {
	uid, err := parseUUID(applicationID)
	if err != nil {
		return nil, fmt.Errorf("invalid application UUID: %w", err)
	}

	sid, err := parseUUID(stageID)
	if err != nil {
		return nil, fmt.Errorf("invalid stage UUID: %w", err)
	}

	p := db.UpdateStageParams{
		ApplicationID:     uid,
		ID:                sid,
		StageName:         input.StageName,
		StageOrder:        input.StageOrder,
		IsCompleted:       input.IsCompleted,
		PerformanceRating: toNullableText(input.PerformanceRating),
		Notes:             toNullableText(input.Notes),
	}

	stage, err := db.UpdateStage(ctx, pool, p)
	if err != nil {
		return nil, err
	}
	if stage == nil {
		return nil, nil
	}

	if err := CreateSnapshot(ctx, pool, uid, "Updated interview stage"); err != nil {
		return nil, err
	}

	return getApplicationWithStages(ctx, pool, uid)
}

// RemoveStage removes an interview stage and returns the full application.
func RemoveStage(ctx context.Context, pool *pgxpool.Pool, applicationID, stageID string) (*ApplicationResponse, error) {
	uid, err := parseUUID(applicationID)
	if err != nil {
		return nil, fmt.Errorf("invalid application UUID: %w", err)
	}

	sid, err := parseUUID(stageID)
	if err != nil {
		return nil, fmt.Errorf("invalid stage UUID: %w", err)
	}

	tag, err := db.DeleteStage(ctx, pool, uid, sid)
	if err != nil {
		return nil, err
	}
	if tag.RowsAffected() == 0 {
		return nil, fmt.Errorf("stage not found")
	}

	if err := CreateSnapshot(ctx, pool, uid, "Removed interview stage"); err != nil {
		return nil, err
	}

	return getApplicationWithStages(ctx, pool, uid)
}
