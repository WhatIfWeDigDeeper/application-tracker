package tests

import (
	"net/http/httptest"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/user/application-tracker/go-api/internal/handler"
)

func newTestServer(pool *pgxpool.Pool) *httptest.Server {
	gin.SetMode(gin.TestMode)
	engine := gin.New()
	handler.RegisterRoutes(engine, pool, "*")
	return httptest.NewServer(engine)
}
