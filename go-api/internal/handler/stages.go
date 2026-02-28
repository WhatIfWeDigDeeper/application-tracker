package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/user/application-tracker/go-api/internal/service"
)

// addStage handles POST /applications/:id/interview-stages
func addStage(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var input service.StageInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		app, err := service.AddStage(c.Request.Context(), pool, id, input)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if app == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Application not found"})
			return
		}
		c.JSON(http.StatusCreated, app)
	}
}

// updateStage handles PATCH /applications/:id/interview-stages/:stageId
func updateStage(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		stageID := c.Param("stageId")
		var input service.StageInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		app, err := service.UpdateStage(c.Request.Context(), pool, id, stageID, input)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if app == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Application or stage not found"})
			return
		}
		c.JSON(http.StatusOK, app)
	}
}

// removeStage handles DELETE /applications/:id/interview-stages/:stageId
func removeStage(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		stageID := c.Param("stageId")

		app, err := service.RemoveStage(c.Request.Context(), pool, id, stageID)
		if err != nil {
			if errors.Is(err, service.ErrStageNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "Stage not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			}
			return
		}
		if app == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Application not found"})
			return
		}
		c.JSON(http.StatusOK, app)
	}
}
