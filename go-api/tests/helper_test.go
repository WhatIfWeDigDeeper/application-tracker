package tests

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"

	"github.com/user/application-tracker/go-api/internal/db"
)

// setupTestDB starts a PostgreSQL container, runs migrations, and returns a connection pool.
// It registers a cleanup function to terminate the container after the test.
// The test is skipped if Docker is not available.
func setupTestDB(t *testing.T) *pgxpool.Pool {
	t.Helper()

	ctx := context.Background()

	// Recover from testcontainers panicking when Docker socket is not reachable.
	defer func() {
		if r := recover(); r != nil {
			msg := fmt.Sprintf("%v", r)
			if strings.Contains(msg, "Docker") || strings.Contains(msg, "docker") {
				t.Skip("Docker not available, skipping integration test: " + msg)
			}
			panic(r)
		}
	}()

	req := testcontainers.ContainerRequest{
		Image:        "postgres:18-alpine",
		ExposedPorts: []string{"5432/tcp"},
		Env: map[string]string{
			"POSTGRES_USER":     "postgres",
			"POSTGRES_PASSWORD": "postgres",
			"POSTGRES_DB":       "testdb",
		},
		WaitingFor: wait.ForLog("database system is ready to accept connections").WithOccurrence(2),
	}

	container, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: req,
		Started:          true,
	})
	if err != nil {
		msg := err.Error()
		if strings.Contains(msg, "docker") || strings.Contains(msg, "Docker") || strings.Contains(msg, "daemon") {
			t.Skipf("Docker not available, skipping integration test: %v", err)
		}
		t.Fatalf("failed to start PostgreSQL container: %v", err)
	}

	t.Cleanup(func() {
		if err := container.Terminate(ctx); err != nil {
			t.Logf("failed to terminate container: %v", err)
		}
	})

	host, err := container.Host(ctx)
	if err != nil {
		t.Fatalf("failed to get container host: %v", err)
	}

	port, err := container.MappedPort(ctx, "5432")
	if err != nil {
		t.Fatalf("failed to get container port: %v", err)
	}

	databaseURL := fmt.Sprintf("postgresql://postgres:postgres@%s:%s/testdb?sslmode=disable", host, port.Port())

	pool, err := db.New(databaseURL)
	if err != nil {
		t.Fatalf("failed to create db pool: %v", err)
	}

	if err := pool.Ping(ctx); err != nil {
		t.Fatalf("failed to ping db: %v", err)
	}

	t.Cleanup(func() {
		pool.Close()
	})

	// Run migrations using the established pool (avoids a second connection attempt).
	if err := runMigrations(t, pool); err != nil {
		t.Fatalf("failed to run migrations: %v", err)
	}

	return pool
}

// runMigrations applies SQL migration files from the migrations directory
// using an already-connected pool.
func runMigrations(t *testing.T, pool *pgxpool.Pool) error {
	t.Helper()
	ctx := context.Background()

	// Find migrations directory relative to this test file
	_, filename, _, _ := runtime.Caller(0)
	migrationsDir := filepath.Join(filepath.Dir(filename), "..", "migrations")

	// Read migration files
	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("failed to read migrations dir: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		if filepath.Ext(entry.Name()) != ".sql" {
			continue
		}

		sqlFile := filepath.Join(migrationsDir, entry.Name())
		content, err := os.ReadFile(sqlFile)
		if err != nil {
			return fmt.Errorf("failed to read migration %s: %w", entry.Name(), err)
		}

		if _, err := pool.Exec(ctx, string(content)); err != nil {
			return fmt.Errorf("failed to apply migration %s: %w", entry.Name(), err)
		}
		t.Logf("Applied migration: %s", entry.Name())
	}

	return nil
}
