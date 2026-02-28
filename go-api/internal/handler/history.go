package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/user/application-tracker/go-api/internal/service"
)

// listHistory handles GET /applications/:id/history
func listHistory(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		history, err := service.GetHistory(c.Request.Context(), pool, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if history == nil {
			history = []service.HistoryEntry{}
		}
		c.JSON(http.StatusOK, history)
	}
}

// restoreHistory handles POST /applications/:id/history/:historyId/restore
func restoreHistory(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		historyID := c.Param("historyId")

		app, err := service.RestoreToVersion(c.Request.Context(), pool, id, historyID)
		if err != nil {
			if errors.Is(err, service.ErrSnapshotNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "Snapshot not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if app == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Application or snapshot not found"})
			return
		}
		c.JSON(http.StatusOK, app)
	}
}
