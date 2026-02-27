package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/user/application-tracker/go-api/internal/service"
)

// importCSV handles POST /applications/import
func importCSV(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		file, _, err := c.Request.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "file field required in multipart/form-data"})
			return
		}
		defer file.Close() //nolint:errcheck

		result, err := service.ImportCSV(c.Request.Context(), pool, file)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, result)
	}
}

// exportCSV handles GET /applications/export
func exportCSV(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		data, err := service.ExportCSV(c.Request.Context(), pool)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		filename := "applications-" + time.Now().Format("2006-01-02") + ".csv"
		c.Header("Content-Type", "text/csv")
		c.Header("Content-Disposition", `attachment; filename="`+filename+`"`)
		c.Data(http.StatusOK, "text/csv", data)
	}
}

// sampleCSV handles GET /applications/sample-csv
func sampleCSV() gin.HandlerFunc {
	return func(c *gin.Context) {
		data := service.GetTemplate()
		c.Header("Content-Type", "text/csv")
		c.Header("Content-Disposition", `attachment; filename="applications-template.csv"`)
		c.Data(http.StatusOK, "text/csv", data)
	}
}
