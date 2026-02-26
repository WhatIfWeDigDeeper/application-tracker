package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type appResponse struct {
	ID              string      `json:"id"`
	CompanyName     string      `json:"companyName"`
	PositionTitle   string      `json:"positionTitle"`
	Status          string      `json:"status"`
	DateApplied     interface{} `json:"dateApplied"`
	IsArchived      bool        `json:"isArchived"`
	InterviewStages []interface{} `json:"interviewStages"`
}

type listResponse struct {
	Data  []appResponse `json:"data"`
	Total int64         `json:"total"`
}

func createApp(t *testing.T, baseURL string, body map[string]interface{}) appResponse {
	t.Helper()
	data, _ := json.Marshal(body)
	resp, err := http.Post(baseURL+"/applications", "application/json", bytes.NewReader(data))
	require.NoError(t, err)
	defer resp.Body.Close()
	require.Equal(t, http.StatusCreated, resp.StatusCode)
	var app appResponse
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&app))
	return app
}

func deleteApp(t *testing.T, baseURL, id string) {
	t.Helper()
	req, _ := http.NewRequest(http.MethodDelete, fmt.Sprintf("%s/applications/%s", baseURL, id), nil)
	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	resp.Body.Close()
}

func TestCreateApplication(t *testing.T) {
	pool := setupTestDB(t)
	srv := newTestServer(pool)
	defer srv.Close()

	app := createApp(t, srv.URL, map[string]interface{}{
		"companyName":   "Test Corp",
		"positionTitle": "Engineer",
		"status":        "applied",
		"dateApplied":   "2026-01-15",
	})
	defer deleteApp(t, srv.URL, app.ID)

	assert.Equal(t, "Test Corp", app.CompanyName)
	assert.Equal(t, "Engineer", app.PositionTitle)
	assert.Equal(t, "applied", app.Status)
	assert.NotEmpty(t, app.ID)
}

func TestCreateApplication_UnsubmittedForcesNullDate(t *testing.T) {
	pool := setupTestDB(t)
	srv := newTestServer(pool)
	defer srv.Close()

	app := createApp(t, srv.URL, map[string]interface{}{
		"companyName":   "Null Date Corp",
		"positionTitle": "Developer",
		"status":        "unsubmitted",
		"dateApplied":   "2026-01-15",
	})
	defer deleteApp(t, srv.URL, app.ID)

	assert.Equal(t, "unsubmitted", app.Status)
	assert.Nil(t, app.DateApplied, "dateApplied should be null for unsubmitted")
}

func TestListApplications_Pagination(t *testing.T) {
	pool := setupTestDB(t)
	srv := newTestServer(pool)
	defer srv.Close()

	var ids []string
	for i := 0; i < 3; i++ {
		app := createApp(t, srv.URL, map[string]interface{}{
			"companyName":   fmt.Sprintf("Company %d", i),
			"positionTitle": "Engineer",
			"status":        "applied",
		})
		ids = append(ids, app.ID)
	}
	defer func() {
		for _, id := range ids {
			deleteApp(t, srv.URL, id)
		}
	}()

	resp, err := http.Get(srv.URL + "/applications?limit=2&page=1&isArchived=false")
	require.NoError(t, err)
	defer resp.Body.Close()
	require.Equal(t, http.StatusOK, resp.StatusCode)

	var listResp listResponse
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&listResp))
	assert.Equal(t, int64(3), listResp.Total)
	assert.Len(t, listResp.Data, 2)
}

func TestListApplications_FilterByStatus(t *testing.T) {
	pool := setupTestDB(t)
	srv := newTestServer(pool)
	defer srv.Close()

	app1 := createApp(t, srv.URL, map[string]interface{}{
		"companyName":   "Applied Corp",
		"positionTitle": "Engineer",
		"status":        "applied",
	})
	app2 := createApp(t, srv.URL, map[string]interface{}{
		"companyName":   "Interviewing Corp",
		"positionTitle": "Engineer",
		"status":        "interviewing",
	})
	defer deleteApp(t, srv.URL, app1.ID)
	defer deleteApp(t, srv.URL, app2.ID)

	resp, err := http.Get(srv.URL + "/applications?status=applied")
	require.NoError(t, err)
	defer resp.Body.Close()

	var listResp listResponse
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&listResp))
	for _, app := range listResp.Data {
		assert.Equal(t, "applied", app.Status)
	}
}

func TestUpdateApplication(t *testing.T) {
	pool := setupTestDB(t)
	srv := newTestServer(pool)
	defer srv.Close()

	app := createApp(t, srv.URL, map[string]interface{}{
		"companyName":   "Old Corp",
		"positionTitle": "Engineer",
		"status":        "applied",
	})
	defer deleteApp(t, srv.URL, app.ID)

	updateBody, _ := json.Marshal(map[string]interface{}{
		"companyName":   "New Corp",
		"positionTitle": "Engineer",
		"status":        "applied",
	})
	req, _ := http.NewRequest(http.MethodPatch,
		fmt.Sprintf("%s/applications/%s", srv.URL, app.ID),
		bytes.NewReader(updateBody))
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close()
	require.Equal(t, http.StatusOK, resp.StatusCode)

	var updated appResponse
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&updated))
	assert.Equal(t, "New Corp", updated.CompanyName)
}

func TestArchiveApplication(t *testing.T) {
	pool := setupTestDB(t)
	srv := newTestServer(pool)
	defer srv.Close()

	app := createApp(t, srv.URL, map[string]interface{}{
		"companyName":   "Archive Corp",
		"positionTitle": "Engineer",
		"status":        "applied",
	})
	defer deleteApp(t, srv.URL, app.ID)

	// Archive
	archResp, err := http.Post(
		fmt.Sprintf("%s/applications/%s/archive", srv.URL, app.ID),
		"application/json", nil)
	require.NoError(t, err)
	defer archResp.Body.Close()
	require.Equal(t, http.StatusOK, archResp.StatusCode)

	var archived appResponse
	require.NoError(t, json.NewDecoder(archResp.Body).Decode(&archived))
	assert.True(t, archived.IsArchived)

	// List without archived filter should return 0 (isArchived defaults to false filter)
	resp, err := http.Get(srv.URL + "/applications?isArchived=false")
	require.NoError(t, err)
	defer resp.Body.Close()
	var listResp listResponse
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&listResp))
	for _, a := range listResp.Data {
		assert.False(t, a.IsArchived)
	}
}

func TestDeleteApplication(t *testing.T) {
	pool := setupTestDB(t)
	srv := newTestServer(pool)
	defer srv.Close()

	app := createApp(t, srv.URL, map[string]interface{}{
		"companyName":   "Delete Corp",
		"positionTitle": "Engineer",
		"status":        "applied",
	})

	// Delete
	req, _ := http.NewRequest(http.MethodDelete,
		fmt.Sprintf("%s/applications/%s", srv.URL, app.ID), nil)
	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	resp.Body.Close()
	assert.Equal(t, http.StatusNoContent, resp.StatusCode)

	// GET should return 404
	getResp, err := http.Get(fmt.Sprintf("%s/applications/%s", srv.URL, app.ID))
	require.NoError(t, err)
	defer getResp.Body.Close()
	io.Copy(io.Discard, getResp.Body)
	assert.Equal(t, http.StatusNotFound, getResp.StatusCode)
}
