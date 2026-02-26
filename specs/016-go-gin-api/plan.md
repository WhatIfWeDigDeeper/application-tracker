# Implementation Plan: Go Gin API

**Branch**: `016-go-gin-api` | **Date**: 2026-02-26 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/016-go-gin-api/spec.md`

## Summary

Add a Go backend (`go-api/`, port 5070) using Gin, sqlc, and pgx. The API matches the full OpenAPI contract at `specs/core/api/openapi.yaml`. A new `go_gin` PostgreSQL schema is created via raw SQL migrations. Business logic is functional (pool passed as argument). Integration tests use testcontainers-go against a real PostgreSQL instance — no mocking.

## Technical Context

**Language/Version**: Go 1.23+
**Primary Dependencies**: `github.com/gin-gonic/gin`, `github.com/jackc/pgx/v5`, `github.com/sqlc-dev/sqlc`, `github.com/golang-migrate/migrate/v4`, `github.com/testcontainers/testcontainers-go`, `github.com/stretchr/testify`
**Build Tool**: `go build` / `go test`
**Database**: PostgreSQL 18, schema `go_gin`
**Port**: 5070

## Architecture

### Package Layout

```
go-api/
├── cmd/
│   ├── server/
│   │   └── main.go           # Gin engine setup, pool init, route registration, listen :5070
│   └── migrate/
│       └── main.go           # Standalone migration runner (also called on server startup)
├── internal/
│   ├── config/
│   │   └── config.go         # Load DATABASE_URL, PORT, CORS_ORIGIN from env
│   ├── db/
│   │   ├── pool.go           # pgxpool.New() with config; exported New() function
│   │   ├── models.go         # sqlc-generated: Application, InterviewStage, ApplicationSnapshot
│   │   └── query.sql.go      # sqlc-generated: typed query functions (ListApplications, etc.)
│   ├── handler/
│   │   ├── router.go         # RegisterRoutes(engine, pool): all /applications/* routes
│   │   ├── applications.go   # CRUD + archive/restore handlers
│   │   ├── stages.go         # Interview stage handlers
│   │   ├── history.go        # History + restore handlers
│   │   └── csv.go            # Import (multipart), export (text/csv), sample-csv handlers
│   └── service/
│       ├── applications.go   # Business logic: CRUD, archive/restore, snapshot on each write
│       ├── stages.go         # Stage CRUD; triggers application snapshot after each mutation
│       ├── history.go        # GetHistory (with diffs), RestoreToVersion
│       └── csv.go            # ImportCSV, ExportCSV, GetTemplate
├── migrations/
│   └── 001_initial.sql       # go_gin schema: applications, interview_stages, application_snapshots
├── sql/
│   └── queries/
│       ├── applications.sql  # sqlc query definitions for applications table
│       ├── stages.sql        # sqlc query definitions for interview_stages
│       └── history.sql       # sqlc query definitions for application_snapshots
├── tests/
│   ├── helper_test.go        # testcontainers-go: start postgres, run migrations, return pool
│   ├── applications_test.go  # CRUD, archive, restore, constraint tests
│   ├── stages_test.go        # Stage add/update/remove tests
│   ├── history_test.go       # Snapshot creation, diff computation, restore tests
│   └── csv_test.go           # Import, export, template, duplicate detection tests
├── go.mod
├── go.sum                    # Generated on first go mod tidy
├── sqlc.yaml                 # sqlc config: engine=postgresql, schema=migrations/, queries=sql/queries/
├── .golangci.yml             # Linter config: errcheck, govet, staticcheck, revive, gofmt
└── .env.example              # DATABASE_URL, PORT, CORS_ORIGIN defaults
```

### Data Flow

```
HTTP Request
  → Gin router (handler/router.go)
  → Handler (bind JSON, validate, call service)
  → Service (business logic, snapshot creation)
  → sqlc query func (internal/db/query.sql.go)
  → pgx pool → PostgreSQL go_gin schema
  ← JSON response (camelCase struct tags)
```

### Snapshot Strategy (History)

Every write operation (CREATE, UPDATE, PATCH, archive, restore, stage add/update/remove) calls `service.CreateSnapshot(pool, applicationID, description)` after the primary mutation succeeds. Snapshot stores full application state including all interview stages as JSONB. Diffs are computed lazily on `GET /history` by comparing consecutive snapshot pairs.

### sqlc Configuration

```yaml
# sqlc.yaml
version: "2"
sql:
  - engine: "postgresql"
    queries: "sql/queries/"
    schema: "migrations/"
    gen:
      go:
        package: "db"
        out: "internal/db"
        emit_json_tags: true
        json_tags_case_style: "camel"
```

## Files to Create

### Go Source (22 files)
| File | Purpose |
|------|---------|
| `cmd/server/main.go` | Entry point: load config, init pool, run migrations, register routes, start server |
| `cmd/migrate/main.go` | Standalone migration runner using golang-migrate |
| `internal/config/config.go` | Env var loading (DATABASE_URL, PORT, CORS_ORIGIN) |
| `internal/db/pool.go` | pgxpool.New() with connection config |
| `internal/db/models.go` | sqlc-generated (do not edit manually) |
| `internal/db/query.sql.go` | sqlc-generated (do not edit manually) |
| `internal/handler/router.go` | Gin engine, CORS middleware, route group registration |
| `internal/handler/applications.go` | CRUD + archive/restore handlers |
| `internal/handler/stages.go` | Interview stage handlers |
| `internal/handler/history.go` | History list + restore handlers |
| `internal/handler/csv.go` | Import, export, sample-csv handlers |
| `internal/service/applications.go` | Application business logic |
| `internal/service/stages.go` | Stage business logic |
| `internal/service/history.go` | History + diff computation |
| `internal/service/csv.go` | CSV import/export/template logic |
| `migrations/001_initial.sql` | go_gin schema DDL |
| `sql/queries/applications.sql` | sqlc query definitions |
| `sql/queries/stages.sql` | sqlc query definitions |
| `sql/queries/history.sql` | sqlc query definitions |
| `tests/helper_test.go` | testcontainers-go setup |
| `tests/applications_test.go` | Application integration tests |
| `tests/stages_test.go` | Stage integration tests |
| `tests/history_test.go` | History integration tests |
| `tests/csv_test.go` | CSV integration tests |

### Config Files (4 files)
| File | Purpose |
|------|---------|
| `go.mod` | Module definition and dependencies |
| `sqlc.yaml` | sqlc code generation config |
| `.golangci.yml` | golangci-lint config |
| `.env.example` | Environment variable template |

## Files to Modify (Project-Level)

| File | Change |
|------|--------|
| Root `package.json` | Add `dev:go-api`, `build:go-api`, `lint:go-api`, `test:go-api`, `audit:ci:go-api`, `install:go-api`, `migrate:go`; add composites `build:go`, `install:go`; append to all `:all` scripts |
| `scripts/stop-all.sh` | Add port 5070 |
| `docker-compose-all.yml` | Add `go-api` service |
| `README.md` | Add Go Gin API to implementations table, running instructions, test commands |
| `CLAUDE.md` | Add go-api section to memory patterns |
| `docs/DATABASE_ARCHITECTURE.md` | Add `go_gin` schema entry |

## Execution Strategy

**Phase 1** (Scaffolding): `go.mod`, config, directory structure, migration SQL, sqlc config
**Phase 2** (DB Layer): Write SQL queries, run `sqlc generate`, create pgx pool setup
**Phase 3** (Core API): Application CRUD handlers + service, Gin router, server entry point — build passes
**Phase 4** (Interview Stages): Stage handlers + service
**Phase 5** (History): Snapshot service, diff computation, restore; history handlers
**Phase 6** (CSV): Import (multipart parse, validation, duplicate detection), export, template
**Phase 7** (Tests): testcontainers-go helper, then test files for each domain area
**Phase 8** (Project Integration): package.json scripts, stop-all.sh, docker-compose-all.yml
**Phase 9** (Validation): `go build ./...`, `golangci-lint run`, `go test ./...`
**Phase 10** (Documentation): README.md, DATABASE_ARCHITECTURE.md, CLAUDE.md

## Verification

1. `cd go-api && go build ./...` — zero compile errors
2. `cd go-api && golangci-lint run` — zero lint warnings
3. `cd go-api && go test ./...` — all testcontainers-go tests pass
4. Start server: `go run ./cmd/server`, verify `GET /applications` returns `{"data":[],"total":0}`
5. `npm run build:all && npm run lint:all && npm run test:all` — no regressions in existing stacks
