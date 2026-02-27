package tests

import (
	"bytes"
	"encoding/csv"
	"io"
	"mime/multipart"
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func uploadCSV(t *testing.T, baseURL, csvContent string) (int, []byte) {
	t.Helper()
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	fw, err := w.CreateFormFile("file", "test.csv")
	require.NoError(t, err)
	_, err = io.WriteString(fw, csvContent)
	require.NoError(t, err)
	w.Close()

	resp, err := http.Post(baseURL+"/applications/import", w.FormDataContentType(), &buf)
	require.NoError(t, err)
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	return resp.StatusCode, body
}

func TestImportCSV_ValidFile(t *testing.T) {
	pool := setupTestDB(t)
	srv := newTestServer(pool)
	defer srv.Close()

	csvContent := `companyName,positionTitle,status,dateApplied,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,salaryMin,salaryMax,coverLetterRequired,offerDueDate,specialRequirements,notes
Corp A,Engineer,applied,2026-01-01,,,,,,,,,false,,,
Corp B,Manager,applied,2026-01-02,,,,,,,,,false,,,
Corp C,Director,applied,2026-01-03,,,,,,,,,false,,,`

	status, body := uploadCSV(t, srv.URL, csvContent)
	assert.Equal(t, http.StatusOK, status)

	bodyStr := string(body)
	assert.Contains(t, bodyStr, `"imported":3`)
	assert.Contains(t, bodyStr, `"skipped":0`)
}

func TestImportCSV_Duplicate(t *testing.T) {
	pool := setupTestDB(t)
	srv := newTestServer(pool)
	defer srv.Close()

	csvContent := `companyName,positionTitle,status,dateApplied,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,salaryMin,salaryMax,coverLetterRequired,offerDueDate,specialRequirements,notes
Dup Corp,Engineer,applied,2026-01-01,,,https://dup.com/job1,,,,,,false,,,`

	// First import
	status1, body1 := uploadCSV(t, srv.URL, csvContent)
	assert.Equal(t, http.StatusOK, status1)
	assert.Contains(t, string(body1), `"imported":1`)

	// Second import with same jobPostingUrl
	status2, body2 := uploadCSV(t, srv.URL, csvContent)
	assert.Equal(t, http.StatusOK, status2)
	assert.Contains(t, string(body2), `"skipped":1`)
}

func TestImportCSV_MissingRequiredColumn(t *testing.T) {
	pool := setupTestDB(t)
	srv := newTestServer(pool)
	defer srv.Close()

	// CSV without companyName column
	csvContent := `positionTitle,status
Engineer,applied`

	status, body := uploadCSV(t, srv.URL, csvContent)
	assert.Equal(t, http.StatusBadRequest, status)
	assert.Contains(t, string(body), "companyName")
}

func TestImportCSV_CrossImplementationValues(t *testing.T) {
	pool := setupTestDB(t)
	srv := newTestServer(pool)
	defer srv.Close()

	// NestJS exports sector-based company_category and numeric skills_match (1-5).
	// Verify these import successfully into Go Gin.
	csvContent := `companyName,positionTitle,status,dateApplied,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,salaryMin,salaryMax,coverLetterRequired,offerDueDate,specialRequirements,notes
Cross Impl Corp,Engineer,applied,2026-01-01,,https://cross.com/job1,,ai,4,linkedin,,,false,,,`

	status, body := uploadCSV(t, srv.URL, csvContent)
	assert.Equal(t, http.StatusOK, status)

	bodyStr := string(body)
	assert.Contains(t, bodyStr, `"imported":1`)
	assert.Contains(t, bodyStr, `"errors":[]`)
}

func TestExportCSV(t *testing.T) {
	pool := setupTestDB(t)
	srv := newTestServer(pool)
	defer srv.Close()

	app1 := createApp(t, srv.URL, map[string]interface{}{
		"companyName":   "Export Corp 1",
		"positionTitle": "Engineer",
		"status":        "applied",
	})
	app2 := createApp(t, srv.URL, map[string]interface{}{
		"companyName":   "Export Corp 2",
		"positionTitle": "Manager",
		"status":        "applied",
	})
	defer deleteApp(t, srv.URL, app1.ID)
	defer deleteApp(t, srv.URL, app2.ID)

	resp, err := http.Get(srv.URL + "/applications/export")
	require.NoError(t, err)
	defer resp.Body.Close()
	require.Equal(t, http.StatusOK, resp.StatusCode)
	assert.Contains(t, resp.Header.Get("Content-Type"), "text/csv")

	body, _ := io.ReadAll(resp.Body)
	r := csv.NewReader(strings.NewReader(string(body)))
	rows, err := r.ReadAll()
	require.NoError(t, err)
	// Header + at least 2 data rows
	assert.GreaterOrEqual(t, len(rows), 3)
	assert.Equal(t, "companyName", rows[0][0])
}

func TestSampleCSV(t *testing.T) {
	pool := setupTestDB(t)
	srv := newTestServer(pool)
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/applications/sample-csv")
	require.NoError(t, err)
	defer resp.Body.Close()
	require.Equal(t, http.StatusOK, resp.StatusCode)
	assert.Contains(t, resp.Header.Get("Content-Type"), "text/csv")
	assert.Contains(t, resp.Header.Get("Content-Disposition"), "applications-template.csv")

	body, _ := io.ReadAll(resp.Body)
	r := csv.NewReader(strings.NewReader(string(body)))
	rows, err := r.ReadAll()
	require.NoError(t, err)
	// Exactly 2 rows: header + 1 example
	assert.Len(t, rows, 2)
	assert.Equal(t, "companyName", rows[0][0])
}
