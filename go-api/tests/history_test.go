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

type historyEntry struct {
	ID             string      `json:"id"`
	SequenceNumber int32       `json:"sequenceNumber"`
	Description    string      `json:"description"`
	Diffs          []diffEntry `json:"diffs"`
}

type diffEntry struct {
	Field    string  `json:"field"`
	OldValue *string `json:"oldValue"`
	NewValue *string `json:"newValue"`
}

func getHistory(t *testing.T, baseURL, appID string) []historyEntry {
	t.Helper()
	resp, err := http.Get(fmt.Sprintf("%s/applications/%s/history", baseURL, appID))
	require.NoError(t, err)
	defer resp.Body.Close()
	require.Equal(t, http.StatusOK, resp.StatusCode)
	var history []historyEntry
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&history))
	return history
}

func TestHistory_SnapshotCreatedOnCreate(t *testing.T) {
	pool := setupTestDB(t)
	srv := newTestServer(pool)
	defer srv.Close()

	app := createApp(t, srv.URL, map[string]interface{}{
		"companyName":   "History Corp",
		"positionTitle": "Engineer",
		"status":        "applied",
	})
	defer deleteApp(t, srv.URL, app.ID)

	history := getHistory(t, srv.URL, app.ID)
	assert.Len(t, history, 1)
	assert.Equal(t, "Created application", history[0].Description)
}

func TestHistory_SnapshotCreatedOnUpdate(t *testing.T) {
	pool := setupTestDB(t)
	srv := newTestServer(pool)
	defer srv.Close()

	app := createApp(t, srv.URL, map[string]interface{}{
		"companyName":   "Update History Corp",
		"positionTitle": "Engineer",
		"status":        "applied",
	})
	defer deleteApp(t, srv.URL, app.ID)

	// Update
	updateBody, _ := json.Marshal(map[string]interface{}{
		"companyName":   "Updated Corp",
		"positionTitle": "Engineer",
		"status":        "applied",
	})
	req, _ := http.NewRequest(http.MethodPatch,
		fmt.Sprintf("%s/applications/%s", srv.URL, app.ID),
		bytes.NewReader(updateBody))
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	resp.Body.Close()

	history := getHistory(t, srv.URL, app.ID)
	assert.Len(t, history, 2)
}

func TestHistory_DiffsComputed(t *testing.T) {
	pool := setupTestDB(t)
	srv := newTestServer(pool)
	defer srv.Close()

	app := createApp(t, srv.URL, map[string]interface{}{
		"companyName":   "Diff Old Corp",
		"positionTitle": "Engineer",
		"status":        "applied",
	})
	defer deleteApp(t, srv.URL, app.ID)

	// Update company name
	updateBody, _ := json.Marshal(map[string]interface{}{
		"companyName":   "Diff New Corp",
		"positionTitle": "Engineer",
		"status":        "applied",
	})
	req, _ := http.NewRequest(http.MethodPatch,
		fmt.Sprintf("%s/applications/%s", srv.URL, app.ID),
		bytes.NewReader(updateBody))
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	resp.Body.Close()

	history := getHistory(t, srv.URL, app.ID)
	require.Len(t, history, 2)

	// Most recent entry is index 0 (DESC order), it has diffs
	latestEntry := history[0]
	var companyNameDiff *diffEntry
	for _, d := range latestEntry.Diffs {
		if d.Field == "companyName" {
			dc := d
			companyNameDiff = &dc
			break
		}
	}
	require.NotNil(t, companyNameDiff, "should have companyName diff")
	assert.Equal(t, "Diff Old Corp", *companyNameDiff.OldValue)
	assert.Equal(t, "Diff New Corp", *companyNameDiff.NewValue)
}

func TestHistory_RestoreToVersion(t *testing.T) {
	pool := setupTestDB(t)
	srv := newTestServer(pool)
	defer srv.Close()

	app := createApp(t, srv.URL, map[string]interface{}{
		"companyName":   "Original Corp",
		"positionTitle": "Engineer",
		"status":        "applied",
	})
	defer deleteApp(t, srv.URL, app.ID)

	// Update
	updateBody, _ := json.Marshal(map[string]interface{}{
		"companyName":   "Changed Corp",
		"positionTitle": "Engineer",
		"status":        "applied",
	})
	req, _ := http.NewRequest(http.MethodPatch,
		fmt.Sprintf("%s/applications/%s", srv.URL, app.ID),
		bytes.NewReader(updateBody))
	req.Header.Set("Content-Type", "application/json")
	updateResp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	updateResp.Body.Close()

	// Get history - oldest snapshot is at the end (last index in DESC order)
	history := getHistory(t, srv.URL, app.ID)
	require.Len(t, history, 2)
	v1 := history[len(history)-1] // sequence_number=1 is oldest

	// Restore to v1
	restoreResp, err := http.Post(
		fmt.Sprintf("%s/applications/%s/history/%s/restore", srv.URL, app.ID, v1.ID),
		"application/json", nil)
	require.NoError(t, err)
	defer restoreResp.Body.Close()
	require.Equal(t, http.StatusOK, restoreResp.StatusCode)

	var restored appResponse
	require.NoError(t, json.NewDecoder(restoreResp.Body).Decode(&restored))
	assert.Equal(t, "Original Corp", restored.CompanyName)
}
