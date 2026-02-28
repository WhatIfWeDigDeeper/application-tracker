package service

import (
	"context"
	"encoding/json"
	"fmt"
	"reflect"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/user/application-tracker/go-api/internal/db"
)

// SnapshotData is the full application state serialized into snapshots.
type SnapshotData struct {
	Application     ApplicationResponse      `json:"application"`
	InterviewStages []InterviewStageResponse `json:"interviewStages"`
}

// DiffEntry represents a single field change between two snapshots.
type DiffEntry struct {
	Field    string  `json:"field"`
	OldValue *string `json:"oldValue"`
	NewValue *string `json:"newValue"`
}

// HistoryEntry is a single history item returned by GET /history.
type HistoryEntry struct {
	ID             string      `json:"id"`
	SequenceNumber int32       `json:"sequenceNumber"`
	Description    string      `json:"description"`
	CreatedAt      time.Time   `json:"createdAt"`
	Diffs          []DiffEntry `json:"diffs"`
}

// CreateSnapshot serializes the full application state and saves it as a snapshot.
func CreateSnapshot(ctx context.Context, pool *pgxpool.Pool, applicationID pgtype.UUID, description string) error {
	appResp, err := getApplicationWithStages(ctx, pool, applicationID)
	if err != nil {
		return err
	}
	if appResp == nil {
		return fmt.Errorf("application not found")
	}

	data := SnapshotData{
		Application:     *appResp,
		InterviewStages: appResp.InterviewStages,
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal snapshot: %w", err)
	}

	nextSeq, err := db.GetNextSequenceNumber(ctx, pool, applicationID)
	if err != nil {
		return fmt.Errorf("failed to get next sequence number: %w", err)
	}

	_, err = db.CreateSnapshot(ctx, pool, db.CreateSnapshotParams{
		ApplicationID:  applicationID,
		SequenceNumber: nextSeq,
		Description:    description,
		SnapshotData:   jsonData,
	})
	return err
}

// GetHistory returns the history of an application with diffs between consecutive snapshots.
func GetHistory(ctx context.Context, pool *pgxpool.Pool, applicationID string) ([]HistoryEntry, error) {
	uid, err := parseUUID(applicationID)
	if err != nil {
		return nil, fmt.Errorf("invalid UUID: %w", err)
	}

	snapshots, err := db.GetSnapshotsByApplicationID(ctx, pool, uid)
	if err != nil {
		return nil, err
	}

	// Build ID->data map for diff computation
	// snapshots are ordered DESC by sequence_number
	entries := make([]HistoryEntry, 0, len(snapshots))
	for i, snap := range snapshots {
		var current SnapshotData
		if err := json.Unmarshal(snap.SnapshotData, &current); err != nil {
			return nil, fmt.Errorf("failed to unmarshal snapshot %d: %w", snap.SequenceNumber, err)
		}

		var diffs []DiffEntry
		// Compare with previous snapshot (which is at index i+1 in DESC order)
		if i < len(snapshots)-1 {
			var previous SnapshotData
			if err := json.Unmarshal(snapshots[i+1].SnapshotData, &previous); err == nil {
				diffs = computeDiffs(previous.Application, current.Application)
			}
		}
		if diffs == nil {
			diffs = []DiffEntry{}
		}

		entries = append(entries, HistoryEntry{
			ID:             uuidToString(snap.ID),
			SequenceNumber: snap.SequenceNumber,
			Description:    snap.Description,
			CreatedAt:      snap.CreatedAt,
			Diffs:          diffs,
		})
	}

	return entries, nil
}

// RestoreToVersion restores an application to a specific snapshot version.
func RestoreToVersion(ctx context.Context, pool *pgxpool.Pool, applicationID, snapshotID string) (*ApplicationResponse, error) {
	uid, err := parseUUID(applicationID)
	if err != nil {
		return nil, fmt.Errorf("invalid application UUID: %w", err)
	}

	sid, err := parseUUID(snapshotID)
	if err != nil {
		return nil, fmt.Errorf("invalid snapshot UUID: %w", err)
	}

	snap, err := db.GetSnapshot(ctx, pool, sid, uid)
	if err != nil {
		return nil, err
	}
	if snap == nil {
		return nil, fmt.Errorf("snapshot not found")
	}

	var data SnapshotData
	if err := json.Unmarshal(snap.SnapshotData, &data); err != nil {
		return nil, fmt.Errorf("failed to unmarshal snapshot: %w", err)
	}

	app := data.Application

	// Restore application fields
	updateParams := db.UpdateApplicationParams{
		ID:                  uid,
		CompanyName:         app.CompanyName,
		PositionTitle:       app.PositionTitle,
		Status:              app.Status,
		DateApplied:         toNullableDate(app.DateApplied),
		CompanyURL:          toNullableText(app.CompanyURL),
		JobPostingURL:       toNullableText(app.JobPostingURL),
		CompanyCareerURL:    toNullableText(app.CompanyCareerURL),
		CompanyCategory:     toNullableText(app.CompanyCategory),
		SkillsMatch:         toNullableInt4(app.SkillsMatch),
		JobSource:           toNullableText(app.JobSource),
		SalaryMin:           toNullableInt4(app.SalaryMin),
		SalaryMax:           toNullableInt4(app.SalaryMax),
		CoverLetterRequired: app.CoverLetterRequired,
		OfferDueDate:        toNullableDate(app.OfferDueDate),
		SpecialRequirements: toNullableText(app.SpecialRequirements),
		Notes:               toNullableText(app.Notes),
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	_, err = db.UpdateApplication(ctx, tx, updateParams)
	if err != nil {
		return nil, err
	}

	// Replace all interview stages
	existingStages, err := db.GetStagesByApplicationID(ctx, tx, uid)
	if err != nil {
		return nil, err
	}
	for _, s := range existingStages {
		if _, err := db.DeleteStage(ctx, tx, uid, s.ID); err != nil {
			return nil, err
		}
	}
	for _, s := range data.InterviewStages {
		p := db.CreateStageParams{
			ApplicationID:     uid,
			StageName:         s.StageName,
			StageOrder:        s.StageOrder,
			IsCompleted:       s.IsCompleted,
			PerformanceRating: toNullableText(s.PerformanceRating),
			Notes:             toNullableText(s.Notes),
		}
		if _, err := db.CreateStage(ctx, tx, p); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	desc := fmt.Sprintf("Restored to version %d", snap.SequenceNumber)
	if err := CreateSnapshot(ctx, pool, uid, desc); err != nil {
		return nil, err
	}

	return getApplicationWithStages(ctx, pool, uid)
}

// computeDiffs computes field-level diffs between two application snapshots.
func computeDiffs(previous, current ApplicationResponse) []DiffEntry {
	var diffs []DiffEntry

	fields := []struct {
		name string
		old  interface{}
		new  interface{}
	}{
		{"companyName", previous.CompanyName, current.CompanyName},
		{"positionTitle", previous.PositionTitle, current.PositionTitle},
		{"status", previous.Status, current.Status},
		{"dateApplied", previous.DateApplied, current.DateApplied},
		{"companyUrl", previous.CompanyURL, current.CompanyURL},
		{"jobPostingUrl", previous.JobPostingURL, current.JobPostingURL},
		{"companyCareerUrl", previous.CompanyCareerURL, current.CompanyCareerURL},
		{"companyCategory", previous.CompanyCategory, current.CompanyCategory},
		{"skillsMatch", previous.SkillsMatch, current.SkillsMatch},
		{"jobSource", previous.JobSource, current.JobSource},
		{"salaryMin", previous.SalaryMin, current.SalaryMin},
		{"salaryMax", previous.SalaryMax, current.SalaryMax},
		{"coverLetterRequired", previous.CoverLetterRequired, current.CoverLetterRequired},
		{"offerDueDate", previous.OfferDueDate, current.OfferDueDate},
		{"specialRequirements", previous.SpecialRequirements, current.SpecialRequirements},
		{"notes", previous.Notes, current.Notes},
		{"isArchived", previous.IsArchived, current.IsArchived},
	}

	for _, f := range fields {
		if !reflect.DeepEqual(f.old, f.new) {
			oldStr := anyToString(f.old)
			newStr := anyToString(f.new)
			diffs = append(diffs, DiffEntry{
				Field:    f.name,
				OldValue: oldStr,
				NewValue: newStr,
			})
		}
	}

	return diffs
}

// anyToString converts any value to *string for diff display.
func anyToString(v interface{}) *string {
	if v == nil {
		return nil
	}
	rv := reflect.ValueOf(v)
	if rv.Kind() == reflect.Ptr {
		if rv.IsNil() {
			return nil
		}
		s := fmt.Sprintf("%v", rv.Elem().Interface())
		return &s
	}
	s := fmt.Sprintf("%v", v)
	return &s
}
