package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// RegisterRoutes sets up the Gin engine with all application routes.
func RegisterRoutes(engine *gin.Engine, pool *pgxpool.Pool, corsOrigin string) {
	// CORS middleware
	engine.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", corsOrigin)
		c.Header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type,Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	apps := engine.Group("/applications")
	{
		// CSV routes MUST come before /:id to avoid Gin treating "import" etc. as an ID
		apps.POST("/import", importCSV(pool))
		apps.GET("/export", exportCSV(pool))
		apps.GET("/sample-csv", sampleCSV())

		// Application CRUD
		apps.GET("", listApplications(pool))
		apps.POST("", createApplication(pool))
		apps.GET("/:id", getApplication(pool))
		apps.PATCH("/:id", updateApplication(pool))
		apps.DELETE("/:id", deleteApplication(pool))

		// Archive/Restore
		apps.POST("/:id/archive", archiveApplication(pool))
		apps.POST("/:id/restore", unarchiveApplication(pool))

		// History
		apps.GET("/:id/history", listHistory(pool))
		apps.POST("/:id/history/:historyId/restore", restoreHistory(pool))

		// Interview Stages
		apps.POST("/:id/interview-stages", addStage(pool))
		apps.PATCH("/:id/interview-stages/:stageId", updateStage(pool))
		apps.DELETE("/:id/interview-stages/:stageId", removeStage(pool))
	}
}
