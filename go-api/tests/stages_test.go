package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type stageResponse struct {
	ID          string `json:"id"`
	StageName   string `json:"stageName"`
	StageOrder  int32  `json:"stageOrder"`
	IsCompleted bool   `json:"isCompleted"`
}

type appWithStages struct {
	ID              string          `json:"id"`
	CompanyName     string          `json:"companyName"`
	InterviewStages []stageResponse `json:"interviewStages"`
}

func TestAddStage(t *testing.T) {
	t.Parallel()
	pool := setupTestDB(t)
	srv := newTestServer(pool)
	defer srv.Close()

	app := createApp(t, srv.URL, map[string]interface{}{
		"companyName":   "Stage Corp",
		"positionTitle": "Engineer",
		"status":        "interviewing",
	})
	defer deleteApp(t, srv.URL, app.ID)

	stageBody, _ := json.Marshal(map[string]interface{}{
		"name":  "Phone Screen",
		"order": 1,
	})
	resp, err := http.Post(
		fmt.Sprintf("%s/applications/%s/interview-stages", srv.URL, app.ID),
		"application/json", bytes.NewReader(stageBody))
	require.NoError(t, err)
	defer resp.Body.Close()
	require.Equal(t, http.StatusCreated, resp.StatusCode)

	var updated appWithStages
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&updated))
	require.Len(t, updated.InterviewStages, 1)
	assert.Equal(t, "Phone Screen", updated.InterviewStages[0].StageName)
}

func TestUpdateStage(t *testing.T) {
	t.Parallel()
	pool := setupTestDB(t)
	srv := newTestServer(pool)
	defer srv.Close()

	app := createApp(t, srv.URL, map[string]interface{}{
		"companyName":   "Update Stage Corp",
		"positionTitle": "Engineer",
		"status":        "interviewing",
	})
	defer deleteApp(t, srv.URL, app.ID)

	// Add stage
	stageBody, _ := json.Marshal(map[string]interface{}{
		"name":  "Initial Screen",
		"order": 1,
	})
	addResp, err := http.Post(
		fmt.Sprintf("%s/applications/%s/interview-stages", srv.URL, app.ID),
		"application/json", bytes.NewReader(stageBody))
	require.NoError(t, err)
	defer addResp.Body.Close()

	var appWithStage appWithStages
	require.NoError(t, json.NewDecoder(addResp.Body).Decode(&appWithStage))
	stageID := appWithStage.InterviewStages[0].ID

	// Update stage
	updateBody, _ := json.Marshal(map[string]interface{}{
		"name":  "Technical Interview",
		"order": 1,
	})
	req, _ := http.NewRequest(http.MethodPatch,
		fmt.Sprintf("%s/applications/%s/interview-stages/%s", srv.URL, app.ID, stageID),
		bytes.NewReader(updateBody))
	req.Header.Set("Content-Type", "application/json")
	updateResp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer updateResp.Body.Close()
	require.Equal(t, http.StatusOK, updateResp.StatusCode)

	var updated appWithStages
	require.NoError(t, json.NewDecoder(updateResp.Body).Decode(&updated))
	require.Len(t, updated.InterviewStages, 1)
	assert.Equal(t, "Technical Interview", updated.InterviewStages[0].StageName)
}

func TestRemoveStage(t *testing.T) {
	t.Parallel()
	pool := setupTestDB(t)
	srv := newTestServer(pool)
	defer srv.Close()

	app := createApp(t, srv.URL, map[string]interface{}{
		"companyName":   "Remove Stage Corp",
		"positionTitle": "Engineer",
		"status":        "interviewing",
	})
	defer deleteApp(t, srv.URL, app.ID)

	// Add stage
	stageBody, _ := json.Marshal(map[string]interface{}{
		"name":  "Stage to Remove",
		"order": 1,
	})
	addResp, err := http.Post(
		fmt.Sprintf("%s/applications/%s/interview-stages", srv.URL, app.ID),
		"application/json", bytes.NewReader(stageBody))
	require.NoError(t, err)
	defer addResp.Body.Close()

	var appWithStage appWithStages
	require.NoError(t, json.NewDecoder(addResp.Body).Decode(&appWithStage))
	stageID := appWithStage.InterviewStages[0].ID

	// Remove stage
	req, _ := http.NewRequest(http.MethodDelete,
		fmt.Sprintf("%s/applications/%s/interview-stages/%s", srv.URL, app.ID, stageID),
		nil)
	removeResp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer removeResp.Body.Close()
	require.Equal(t, http.StatusOK, removeResp.StatusCode)

	var updated appWithStages
	require.NoError(t, json.NewDecoder(removeResp.Body).Decode(&updated))
	assert.Len(t, updated.InterviewStages, 0)
}
