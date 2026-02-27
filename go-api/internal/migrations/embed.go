// Package migrations provides embedded SQL migration files.
package migrations

import "embed"

// FS holds the embedded SQL migration files.
//
//go:embed *.sql
var FS embed.FS
