// Package main provides the database migration command.
package main

import (
	"fmt"
	"log"
	"os"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	// Find migrations directory relative to working directory
	migrationsPath := os.Getenv("MIGRATIONS_PATH")
	if migrationsPath == "" {
		migrationsPath = "migrations"
	}

	m, err := migrate.New("file://"+migrationsPath, databaseURL)
	if err != nil {
		log.Fatalf("failed to create migrator: %v", err)
	}
	defer m.Close() //nolint:errcheck

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Fatalf("failed to run migrations: %v", err)
	}

	version, dirty, err := m.Version()
	if err != nil && err != migrate.ErrNilVersion {
		log.Fatalf("failed to get migration version: %v", err)
	}

	fmt.Printf("Migrations applied successfully. Current version: %d, dirty: %v\n", version, dirty)
}
