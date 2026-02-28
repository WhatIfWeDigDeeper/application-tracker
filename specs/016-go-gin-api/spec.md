# 016 - Go Gin API

- **Created**: 2026-02-26
- **Status**: Complete

## Overview

Add a 7th backend implementation to the monorepo: a Go API using Gin + sqlc + pgx. Matches the full API contract of all existing backends. Demonstrates idiomatic Go — type-safe SQL generation via sqlc, connection pooling via pgx, and real-database integration tests via testcontainers-go (no mocking).

## Technology Stack

### Backend (`go-api/` — port 5070)
- Go 1.24+
- Gin (web framework — most widely known to employers; v1.x)
- pgx v5 (PostgreSQL driver with built-in connection pooling)
- sqlc (type-safe SQL → Go code generation; SQL lives in `.sql` files)
- golang-migrate (raw SQL migration runner)
- testify + testcontainers-go (integration tests against real PostgreSQL — no mocks)
- golangci-lint (linting: errcheck, govet, staticcheck, revive)
- DB schema: `go_gin`

## Features (matching all existing implementations)

1. **Application CRUD** — Create, read, update, delete job applications
2. **Interview Stages** — Individual CRUD for interview stages per application
3. **Filtering & Sorting** — Status, company category, job source, skills match, archived
4. **Pagination** — Server-side with configurable page size (default 20, max 100)
5. **Archive/Restore** — Dedicated POST endpoints (not via PATCH)
6. **History Panel** — Snapshot-based history with field diffs and restore-to-version
7. **CSV Import / Export / Template** — Bulk import via multipart upload, full export, downloadable template

## API Contract

15 endpoints under `/applications`, matching `specs/core/api/openapi.yaml` and all existing backends:

- CRUD: `GET /applications`, `GET /applications/:id`, `POST /applications`, `PATCH /applications/:id`, `DELETE /applications/:id`
- Archive: `POST /applications/:id/archive`, `POST /applications/:id/restore`
- History: `GET /applications/:id/history`, `POST /applications/:id/history/:historyId/restore`
- Interview Stages: `POST /applications/:id/interview-stages`, `PATCH /applications/:id/interview-stages/:stageId`, `DELETE /applications/:id/interview-stages/:stageId`
- CSV: `POST /applications/import`, `GET /applications/export`, `GET /applications/sample-csv`

Response format: camelCase JSON matching all existing backends.

## Key Design Decisions

- **sqlc over GORM** — type-safe, idiomatic Go; avoids reflection-heavy ORM magic; SQL lives in `.sql` query files and sqlc generates Go structs + typed query functions
- **pgx v5** — modern PostgreSQL driver with built-in connection pooling; `pgxpool.Pool` passed functionally through handler → service layers
- **Functional service layer** — service functions take `*pgxpool.Pool` as first argument; no struct-based receivers (mirrors fastapi's functional style)
- **camelCase JSON** — Go struct tags `json:"camelCase"` match all existing backend response formats
- **Snapshot-based history** — identical pattern to hono-api, nest-api, fastapi: full application state captured on every mutation; diffs computed on read
- **testcontainers-go — no mocks** — tests spin up a real PostgreSQL container, run migrations, then exercise handler → service → sqlc → pgx → Postgres. Each test file uses its own schema to avoid cross-test pollution. This tests real SQL behavior, real constraint enforcement, real transaction semantics

## Success Criteria

- [ ] All 15 API endpoints return correct responses matching the OpenAPI spec
- [ ] Integration tests pass (`test:go-api`)
- [ ] Go build passes (`build:go-api`)
- [ ] Go linting passes (`lint:go-api`)
- [ ] History snapshots and field diffs work correctly
- [ ] CSV import/export/template work correctly
- [ ] `status=unsubmitted` forces `dateApplied=null` constraint enforced
- [ ] No regressions in existing stacks (`build:all`, `lint:all`, `test:all`)
