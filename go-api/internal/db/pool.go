package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

// New creates a new pgxpool.Pool with the given database URL.
func New(databaseURL string) (*pgxpool.Pool, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, err
	}
	config.MaxConns = 10
	return pgxpool.NewWithConfig(context.Background(), config)
}
