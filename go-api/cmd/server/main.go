// Package main provides the Go Gin API server entry point.
package main

import (
	"fmt"
	"io/fs"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"

	"github.com/user/application-tracker/go-api/internal/config"
	"github.com/user/application-tracker/go-api/internal/db"
	"github.com/user/application-tracker/go-api/internal/handler"
	embeddedMigrations "github.com/user/application-tracker/go-api/internal/migrations"
)

func runMigrations(databaseURL string) error {
	sub, err := fs.Sub(embeddedMigrations.FS, ".")
	if err != nil {
		return fmt.Errorf("failed to create migration sub filesystem: %w", err)
	}

	sourceDriver, err := iofs.New(sub, ".")
	if err != nil {
		return fmt.Errorf("failed to create migration source: %w", err)
	}

	m, err := migrate.NewWithSourceInstance("iofs", sourceDriver, databaseURL)
	if err != nil {
		return fmt.Errorf("failed to create migrator: %w", err)
	}
	defer m.Close() //nolint:errcheck

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("failed to run migrations: %w", err)
	}
	return nil
}

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	if err := runMigrations(cfg.DatabaseURL); err != nil {
		log.Printf("migration warning: %v", err)
	}

	pool, err := db.New(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()

	engine := gin.New()
	engine.Use(gin.Logger(), gin.Recovery())

	handler.RegisterRoutes(engine, pool, cfg.CORSOrigin)

	log.Printf("Go Gin API listening on :%s", cfg.Port)
	if err := engine.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
