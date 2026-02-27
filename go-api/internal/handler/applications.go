package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/user/application-tracker/go-api/internal/service"
)

// listApplications handles GET /applications
func listApplications(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		params := service.ListParams{
			SortBy:  c.DefaultQuery("sortBy", "updatedAt"),
			SortDir: c.DefaultQuery("sortDir", "desc"),
		}

		// Map camelCase query params to snake_case sort columns
		sortByMap := map[string]string{
			"updatedAt":     "updated_at",
			"createdAt":     "created_at",
			"companyName":   "company_name",
			"positionTitle": "position_title",
			"dateApplied":   "date_applied",
			"status":        "status",
		}
		if col, ok := sortByMap[params.SortBy]; ok {
			params.SortBy = col
		} else {
			params.SortBy = "updated_at"
		}

		if s := c.Query("status"); s != "" {
			params.Status = &s
		}

		if arch := c.Query("isArchived"); arch != "" {
			b, err := strconv.ParseBool(arch)
			if err == nil {
				params.IsArchived = &b
			}
		}

		if cc := c.Query("companyCategory"); cc != "" {
			params.CompanyCategory = &cc
		}
		if js := c.Query("jobSource"); js != "" {
			params.JobSource = &js
		}
		if sm := c.Query("skillsMatch"); sm != "" {
			if n, err := strconv.ParseInt(sm, 10, 32); err == nil {
				v := int32(n)
				params.SkillsMatch = &v
			}
		}

		if p := c.Query("page"); p != "" {
			if n, err := strconv.Atoi(p); err == nil {
				params.Page = n
			}
		}
		if l := c.Query("limit"); l != "" {
			if n, err := strconv.Atoi(l); err == nil {
				params.Limit = n
			}
		}

		apps, total, err := service.ListApplications(c.Request.Context(), pool, params)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if apps == nil {
			apps = []service.ApplicationResponse{}
		}
		c.JSON(http.StatusOK, gin.H{"items": apps, "total": total})
	}
}

// getApplication handles GET /applications/:id
func getApplication(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		app, err := service.GetApplication(c.Request.Context(), pool, id)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if app == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Application not found"})
			return
		}
		c.JSON(http.StatusOK, app)
	}
}

// createApplication handles POST /applications
func createApplication(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input service.ApplicationInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		app, err := service.CreateApplication(c.Request.Context(), pool, input)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, app)
	}
}

// updateApplication handles PATCH /applications/:id
func updateApplication(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var input service.ApplicationInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		app, err := service.UpdateApplication(c.Request.Context(), pool, id, input)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if app == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Application not found"})
			return
		}
		c.JSON(http.StatusOK, app)
	}
}

// deleteApplication handles DELETE /applications/:id
func deleteApplication(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if err := service.DeleteApplication(c.Request.Context(), pool, id); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.Status(http.StatusNoContent)
	}
}

// archiveApplication handles POST /applications/:id/archive
func archiveApplication(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		app, err := service.ArchiveApplication(c.Request.Context(), pool, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if app == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Application not found"})
			return
		}
		c.JSON(http.StatusOK, app)
	}
}

// unarchiveApplication handles POST /applications/:id/restore
func unarchiveApplication(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		app, err := service.UnarchiveApplication(c.Request.Context(), pool, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if app == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Application not found"})
			return
		}
		c.JSON(http.StatusOK, app)
	}
}
