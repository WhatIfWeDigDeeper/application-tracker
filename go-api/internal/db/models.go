// Code generated manually (sqlc not available). DO NOT EDIT.

package db

import (
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

// NullString represents a nullable string.
type NullString struct {
	String string
	Valid  bool
}

// NullInt4 represents a nullable int32.
type NullInt4 struct {
	Int32 int32
	Valid bool
}

// NullDate represents a nullable date.
type NullDate struct {
	Time  time.Time
	Valid bool
}

// Application represents a row from the go_gin.applications table.
type Application struct {
	ID                  pgtype.UUID        `json:"id"`
	CompanyName         string             `json:"companyName"`
	PositionTitle       string             `json:"positionTitle"`
	Status              string             `json:"status"`
	DateApplied         pgtype.Date        `json:"dateApplied"`
	CompanyURL          pgtype.Text        `json:"companyUrl"`
	JobPostingURL       pgtype.Text        `json:"jobPostingUrl"`
	CompanyCareerURL    pgtype.Text        `json:"companyCareerUrl"`
	CompanyCategory     pgtype.Text        `json:"companyCategory"`
	SkillsMatch         pgtype.Int4        `json:"skillsMatch"`
	JobSource           pgtype.Text        `json:"jobSource"`
	SalaryMin           pgtype.Int4        `json:"salaryMin"`
	SalaryMax           pgtype.Int4        `json:"salaryMax"`
	CoverLetterRequired bool               `json:"coverLetterRequired"`
	OfferDueDate        pgtype.Date        `json:"offerDueDate"`
	SpecialRequirements pgtype.Text        `json:"specialRequirements"`
	Notes               pgtype.Text        `json:"notes"`
	IsArchived          bool               `json:"isArchived"`
	CreatedAt           time.Time          `json:"createdAt"`
	UpdatedAt           time.Time          `json:"updatedAt"`
}

// InterviewStage represents a row from the go_gin.interview_stages table.
type InterviewStage struct {
	ID                pgtype.UUID `json:"id"`
	ApplicationID     pgtype.UUID `json:"applicationId"`
	StageName         string      `json:"stageName"`
	StageOrder        int32       `json:"stageOrder"`
	IsCompleted       bool        `json:"isCompleted"`
	PerformanceRating pgtype.Text `json:"performanceRating"`
	Notes             pgtype.Text `json:"notes"`
	CreatedAt         time.Time   `json:"createdAt"`
	UpdatedAt         time.Time   `json:"updatedAt"`
}

// ApplicationSnapshot represents a row from the go_gin.application_snapshots table.
type ApplicationSnapshot struct {
	ID             pgtype.UUID `json:"id"`
	ApplicationID  pgtype.UUID `json:"applicationId"`
	SequenceNumber int32       `json:"sequenceNumber"`
	Description    string      `json:"description"`
	SnapshotData   []byte      `json:"snapshotData"`
	CreatedAt      time.Time   `json:"createdAt"`
}
