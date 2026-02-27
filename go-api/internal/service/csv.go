package service

import (
	"bytes"
	"context"
	"encoding/csv"
	"fmt"
	"io"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/user/application-tracker/go-api/internal/db"
)

// CSVHeaders defines the expected CSV column headers.
var CSVHeaders = []string{
	"companyName", "positionTitle", "status", "dateApplied",
	"companyUrl", "jobPostingUrl", "companyCareerUrl", "companyCategory",
	"skillsMatch", "jobSource", "salaryMin", "salaryMax",
	"coverLetterRequired", "offerDueDate", "specialRequirements", "notes",
}

// ImportResult holds the result of a CSV import operation.
type ImportResult struct {
	Imported int      `json:"imported"`
	Skipped  int      `json:"skipped"`
	Errors   []string `json:"errors"`
}

// ImportCSV parses and imports applications from a CSV reader.
func ImportCSV(ctx context.Context, pool *pgxpool.Pool, reader io.Reader) (ImportResult, error) {
	result := ImportResult{
		Errors: []string{},
	}

	r := csv.NewReader(reader)
	r.TrimLeadingSpace = true

	headers, err := r.Read()
	if err != nil {
		return result, fmt.Errorf("failed to read CSV headers: %w", err)
	}

	// Build header index map
	headerIdx := make(map[string]int)
	for i, h := range headers {
		headerIdx[strings.TrimSpace(h)] = i
	}

	// Validate required columns
	if _, ok := headerIdx["companyName"]; !ok {
		return result, fmt.Errorf("missing required column: companyName")
	}
	if _, ok := headerIdx["positionTitle"]; !ok {
		return result, fmt.Errorf("missing required column: positionTitle")
	}

	// Collect existing records from DB for duplicate detection
	existingURLs := make(map[string]bool)
	existingPairs := make(map[string]bool)
	allApps, err := db.GetAllApplications(ctx, pool)
	if err != nil {
		return result, fmt.Errorf("failed to load existing applications: %w", err)
	}
	for _, app := range allApps {
		if app.JobPostingURL.Valid && app.JobPostingURL.String != "" {
			existingURLs[app.JobPostingURL.String] = true
		} else {
			// Fallback key for apps without a job posting URL
			key := strings.ToLower(app.CompanyName) + "|" + strings.ToLower(app.PositionTitle)
			existingPairs[key] = true
		}
	}

	// Track intra-file duplicates
	seenURLs := make(map[string]bool)
	seenPairs := make(map[string]bool)

	rowNum := 1
	for {
		row, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("row %d: parse error: %v", rowNum, err))
			rowNum++
			continue
		}

		getField := func(name string) string {
			idx, ok := headerIdx[name]
			if !ok || idx >= len(row) {
				return ""
			}
			return strings.TrimSpace(row[idx])
		}

		companyName := getField("companyName")
		if companyName == "" {
			result.Errors = append(result.Errors, fmt.Sprintf("row %d: companyName is required", rowNum))
			rowNum++
			continue
		}

		positionTitle := getField("positionTitle")
		if positionTitle == "" {
			result.Errors = append(result.Errors, fmt.Sprintf("row %d: positionTitle is required", rowNum))
			rowNum++
			continue
		}

		jobPostingURL := getField("jobPostingUrl")

		// Duplicate detection: use jobPostingUrl if present, else fall back to (companyName, positionTitle)
		if jobPostingURL != "" {
			if existingURLs[jobPostingURL] || seenURLs[jobPostingURL] {
				result.Skipped++
				rowNum++
				continue
			}
			seenURLs[jobPostingURL] = true
		} else {
			pairKey := strings.ToLower(companyName) + "|" + strings.ToLower(positionTitle)
			if existingPairs[pairKey] || seenPairs[pairKey] {
				result.Skipped++
				rowNum++
				continue
			}
			seenPairs[pairKey] = true
		}

		status := getField("status")
		if status == "" {
			status = "unsubmitted"
		}

		dateAppliedStr := getField("dateApplied")
		var dateApplied *string
		if dateAppliedStr != "" {
			dateApplied = &dateAppliedStr
		}
		dateApplied = applyStatusDateConstraint(status, dateApplied)

		var jobPostingURLPtr *string
		if jobPostingURL != "" {
			jobPostingURLPtr = &jobPostingURL
		}
		companyURL := getField("companyUrl")
		var companyURLPtr *string
		if companyURL != "" {
			companyURLPtr = &companyURL
		}
		companyCareerURL := getField("companyCareerUrl")
		var companyCareerURLPtr *string
		if companyCareerURL != "" {
			companyCareerURLPtr = &companyCareerURL
		}
		companyCategory := getField("companyCategory")
		var companyCategoryPtr *string
		if companyCategory != "" {
			companyCategoryPtr = &companyCategory
		}
		var skillsMatchPtr *int32
		if s := getField("skillsMatch"); s != "" {
			if n, err := strconv.ParseInt(s, 10, 32); err == nil {
				v := int32(n)
				skillsMatchPtr = &v
			}
		}
		jobSource := getField("jobSource")
		var jobSourcePtr *string
		if jobSource != "" {
			jobSourcePtr = &jobSource
		}

		var salaryMin *int32
		if s := getField("salaryMin"); s != "" {
			if n, err := strconv.ParseInt(s, 10, 32); err == nil {
				v := int32(n)
				salaryMin = &v
			}
		}
		var salaryMax *int32
		if s := getField("salaryMax"); s != "" {
			if n, err := strconv.ParseInt(s, 10, 32); err == nil {
				v := int32(n)
				salaryMax = &v
			}
		}

		coverLetterRequired := false
		if clr := getField("coverLetterRequired"); clr == "true" || clr == "1" {
			coverLetterRequired = true
		}

		offerDueDate := getField("offerDueDate")
		var offerDueDatePtr *string
		if offerDueDate != "" {
			offerDueDatePtr = &offerDueDate
		}
		specialRequirements := getField("specialRequirements")
		var specialRequirementsPtr *string
		if specialRequirements != "" {
			specialRequirementsPtr = &specialRequirements
		}
		notes := getField("notes")
		var notesPtr *string
		if notes != "" {
			notesPtr = &notes
		}

		input := ApplicationInput{
			CompanyName:         companyName,
			PositionTitle:       positionTitle,
			Status:              status,
			DateApplied:         dateApplied,
			CompanyURL:          companyURLPtr,
			JobPostingURL:       jobPostingURLPtr,
			CompanyCareerURL:    companyCareerURLPtr,
			CompanyCategory:     companyCategoryPtr,
			SkillsMatch:         skillsMatchPtr,
			JobSource:           jobSourcePtr,
			SalaryMin:           salaryMin,
			SalaryMax:           salaryMax,
			CoverLetterRequired: coverLetterRequired,
			OfferDueDate:        offerDueDatePtr,
			SpecialRequirements: specialRequirementsPtr,
			Notes:               notesPtr,
		}

		if _, err := CreateApplication(ctx, pool, input); err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("row %d: %v", rowNum, err))
		} else {
			result.Imported++
			if jobPostingURL != "" {
				existingURLs[jobPostingURL] = true
			} else {
				pairKey := strings.ToLower(companyName) + "|" + strings.ToLower(positionTitle)
				existingPairs[pairKey] = true
			}
		}
		rowNum++
	}

	return result, nil
}

// ExportCSV exports all applications as a CSV byte slice.
func ExportCSV(ctx context.Context, pool *pgxpool.Pool) ([]byte, error) {
	apps, err := db.GetAllApplications(ctx, pool)
	if err != nil {
		return nil, err
	}

	var buf bytes.Buffer
	w := csv.NewWriter(&buf)

	// Write headers
	if err := w.Write(CSVHeaders); err != nil {
		return nil, err
	}

	for _, app := range apps {
		row := appToCSVRow(app)
		if err := w.Write(row); err != nil {
			return nil, err
		}
	}
	w.Flush()
	if err := w.Error(); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

// GetTemplate returns a CSV template with headers and one example row.
func GetTemplate() []byte {
	var buf bytes.Buffer
	w := csv.NewWriter(&buf)

	_ = w.Write(CSVHeaders)
	_ = w.Write([]string{
		"Acme Corp",
		"Software Engineer",
		"applied",
		time.Now().Format("2006-01-02"),
		"https://acme.com",
		"https://acme.com/jobs/123",
		"https://acme.com/careers",
		"enterprise-software",
		"4",
		"linkedin",
		"100000",
		"150000",
		"false",
		"",
		"",
		"",
	})
	w.Flush()
	return buf.Bytes()
}

// appToCSVRow converts a db.Application to a CSV row.
func appToCSVRow(app db.Application) []string {
	dateApplied := ""
	if app.DateApplied.Valid {
		dateApplied = app.DateApplied.Time.Format("2006-01-02")
	}

	companyURL := ""
	if app.CompanyURL.Valid {
		companyURL = app.CompanyURL.String
	}
	jobPostingURL := ""
	if app.JobPostingURL.Valid {
		jobPostingURL = app.JobPostingURL.String
	}
	companyCareerURL := ""
	if app.CompanyCareerURL.Valid {
		companyCareerURL = app.CompanyCareerURL.String
	}
	companyCategory := ""
	if app.CompanyCategory.Valid {
		companyCategory = app.CompanyCategory.String
	}
	skillsMatch := ""
	if app.SkillsMatch.Valid {
		skillsMatch = strconv.Itoa(int(app.SkillsMatch.Int32))
	}
	jobSource := ""
	if app.JobSource.Valid {
		jobSource = app.JobSource.String
	}
	salaryMin := ""
	if app.SalaryMin.Valid {
		salaryMin = strconv.Itoa(int(app.SalaryMin.Int32))
	}
	salaryMax := ""
	if app.SalaryMax.Valid {
		salaryMax = strconv.Itoa(int(app.SalaryMax.Int32))
	}
	offerDueDate := ""
	if app.OfferDueDate.Valid {
		offerDueDate = app.OfferDueDate.Time.Format("2006-01-02")
	}
	specialRequirements := ""
	if app.SpecialRequirements.Valid {
		specialRequirements = app.SpecialRequirements.String
	}
	notes := ""
	if app.Notes.Valid {
		notes = app.Notes.String
	}

	return []string{
		app.CompanyName,
		app.PositionTitle,
		app.Status,
		dateApplied,
		companyURL,
		jobPostingURL,
		companyCareerURL,
		companyCategory,
		skillsMatch,
		jobSource,
		salaryMin,
		salaryMax,
		strconv.FormatBool(app.CoverLetterRequired),
		offerDueDate,
		specialRequirements,
		notes,
	}
}
