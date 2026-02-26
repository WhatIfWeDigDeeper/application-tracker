package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

// Config holds application configuration loaded from environment variables.
type Config struct {
	DatabaseURL string
	Port        string
	CORSOrigin  string
}

// Load reads configuration from environment variables (and optionally a .env file).
// It returns an error if DATABASE_URL is not set.
func Load() (*Config, error) {
	// Load .env if present — try local go-api/.env first, then fall back to
	// the monorepo root ../.env (where DATABASE_URL typically lives).
	if err := godotenv.Load(); err != nil {
		_ = godotenv.Load("../.env")
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL environment variable is required")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "5070"
	}

	corsOrigin := os.Getenv("CORS_ORIGIN")
	if corsOrigin == "" {
		corsOrigin = "http://localhost:3060"
	}

	return &Config{
		DatabaseURL: databaseURL,
		Port:        port,
		CORSOrigin:  corsOrigin,
	}, nil
}
