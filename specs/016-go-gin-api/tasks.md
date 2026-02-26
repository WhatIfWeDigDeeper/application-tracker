---
description: "Task list for Go Gin API"
---

# Tasks: Go Gin API

**Input**: Design documents from `/specs/016-go-gin-api/`
**Specification**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)
**Project**: Go Gin API (backend only)

**Organization**: Tasks grouped by phase. All phases are sequential.

## Dependencies & Execution Order

- Phase 1 (Scaffolding) must complete before Phase 2
- Phase 2 (DB Layer) must complete before Phase 3 (`sqlc generate` produces files needed by handlers)
- Phase 3 (Core API) must complete before Phases 4–6 (router and server must compile first)
- Phases 4, 5, 6 (Stages, History, CSV) are independent of each other — can be done in any order
- Phase 7 (Tests) can begin after the feature being tested is complete
- Phase 8 (Project Integration) requires Phase 9 to pass first
- Phase 10 (Documentation) is the final phase

---

## Phase 1: Scaffolding

**Purpose**: Create project structure, module definition, config, and migration SQL

- [ ] T001 Create `go.mod` with module path `github.com/user/application-tracker/go-api` and dependencies: `github.com/gin-gonic/gin`, `github.com/jackc/pgx/v5`, `github.com/golang-migrate/migrate/v4`, `github.com/joho/godotenv`; run `go mod tidy`
- [ ] T002 Create `sqlc.yaml` with engine `postgresql`, schema pointing to `migrations/`, queries pointing to `sql/queries/`, output to `internal/db/`, `emit_json_tags: true`, `json_tags_case_style: "camel"`
- [ ] T003 Create `.golangci.yml` enabling linters: `errcheck`, `govet`, `staticcheck`, `revive`, `gofmt`, `goimports`
- [ ] T004 Create `.env.example` with `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_tracker?search_path=go_gin`, `PORT=5070`, `CORS_ORIGIN=http://localhost:3060`
- [ ] T005 Create `internal/config/config.go` — load `DATABASE_URL`, `PORT`, `CORS_ORIGIN` from env using `os.Getenv`; return a `Config` struct; fail fast if `DATABASE_URL` is empty
- [ ] T006 Create `migrations/001_initial.sql` — `go_gin` schema DDL: `applications` table (all 20 columns matching existing schemas), `interview_stages` table, `application_snapshots` table; use PostgreSQL enums for status, company_category, job_source, skills_match, performance_rating
- [ ] T007 Create `cmd/migrate/main.go` — golang-migrate runner: load `DATABASE_URL` from env, run `migrate.Up()` from `migrations/` directory embedded via `embed.FS`; print count of applied migrations

**Checkpoint**: Directory structure and migration SQL exist; `go build ./cmd/migrate` compiles

---

## Phase 2: Database Layer (sqlc)

**Purpose**: Write SQL query definitions, generate Go code, set up pgx pool

- [ ] T008 Create `sql/queries/applications.sql` — sqlc query definitions:
  - `ListApplications` (with filter params: status, isArchived, companyCategory, jobSource, skillsMatch, sortBy, sortDir, limit, offset)
  - `GetApplication` (by ID)
  - `CreateApplication` (all insertable columns, return full row)
  - `UpdateApplication` (all updatable columns, return full row)
  - `DeleteApplication` (by ID)
  - `ArchiveApplication` (set is_archived=true, updated_at=now())
  - `UnarchiveApplication` (set is_archived=false, updated_at=now())
  - `CountApplications` (matching same filters as ListApplications, for pagination total)
- [ ] T009 Create `sql/queries/stages.sql` — sqlc query definitions:
  - `GetStagesByApplicationID`
  - `CreateStage`
  - `UpdateStage`
  - `DeleteStage`
- [ ] T010 Create `sql/queries/history.sql` — sqlc query definitions:
  - `CreateSnapshot` (insert into application_snapshots)
  - `GetSnapshotsByApplicationID` (ordered by sequence_number desc)
  - `GetSnapshot` (by ID and application ID)
- [ ] T011 Run `sqlc generate` — produces `internal/db/models.go` and `internal/db/query.sql.go`; fix any sqlc errors in query files
- [ ] T012 Create `internal/db/pool.go` — `func New(databaseURL string) (*pgxpool.Pool, error)` using `pgxpool.ParseConfig` + `pgxpool.NewWithConfig`; configure `MaxConns`, `ssl=false` for local Docker PostgreSQL

**Checkpoint**: `go build ./internal/...` compiles; sqlc-generated files present

---

## Phase 3: Core API — Applications CRUD

**Purpose**: Implement application handlers, service, Gin router, and server entry point

- [ ] T013 Create `internal/service/applications.go` with functions:
  - `ListApplications(ctx, pool, params) ([]Application, int, error)` — query + count
  - `GetApplication(ctx, pool, id) (*Application, error)` — 404 if not found
  - `CreateApplication(ctx, pool, input) (*Application, error)` — insert + create initial snapshot
  - `UpdateApplication(ctx, pool, id, input) (*Application, error)` — update + create snapshot
  - `DeleteApplication(ctx, pool, id) error`
  - `ArchiveApplication(ctx, pool, id) (*Application, error)` — archive + create snapshot
  - `UnarchiveApplication(ctx, pool, id) (*Application, error)` — restore + create snapshot
  - Status/dateApplied constraint: if `status=unsubmitted`, set `dateApplied=null`; if transitioning away from `unsubmitted` and `dateApplied` is null, set `dateApplied=today`
- [ ] T014 Create `internal/handler/applications.go` — Gin handlers:
  - `ListApplications` — parse query params (filters, sort, page, limit), call service, return `{"data":[...],"total":N}`
  - `GetApplication` — parse `:id` UUID, call service, 404 on not found
  - `CreateApplication` — bind JSON body, validate required fields, call service, return 201
  - `UpdateApplication` — parse `:id`, bind JSON, call service, return 200
  - `DeleteApplication` — parse `:id`, call service, return 204
  - `ArchiveApplication` — parse `:id`, call service, return 200
  - `UnarchiveApplication` — parse `:id`, call service, return 200
- [ ] T015 Create `internal/handler/router.go` — `func RegisterRoutes(engine *gin.Engine, pool *pgxpool.Pool)`:
  - CORS middleware allowing configured origin, `Content-Type`, all methods
  - Route group `/applications`
  - Wire all application endpoints
  - Return `gin.Engine` from `gin.New()` (not `gin.Default()` — control logging explicitly)
- [ ] T016 Create `cmd/server/main.go`:
  - Load config via `config.Load()`
  - Init pgx pool via `db.New(cfg.DatabaseURL)`
  - Run migrations on startup
  - Create Gin engine via `handler.RegisterRoutes()`
  - `engine.Run(":" + cfg.Port)`
- [ ] T017 Run `go build ./...` — must compile with zero errors

**Checkpoint**: Server starts, `GET /applications` returns `{"data":[],"total":0}`

---

## Phase 4: Interview Stages

**Purpose**: Add individual stage CRUD endpoints

- [ ] T018 Create `internal/service/stages.go` with functions:
  - `AddStage(ctx, pool, applicationID, input) (*Application, error)` — insert stage, create application snapshot, return full application
  - `UpdateStage(ctx, pool, applicationID, stageID, input) (*Application, error)` — update stage, create snapshot, return full application
  - `RemoveStage(ctx, pool, applicationID, stageID) (*Application, error)` — delete stage, create snapshot, return full application
- [ ] T019 Create `internal/handler/stages.go` — Gin handlers:
  - `POST /applications/:id/interview-stages` → `AddStage` → 201 with full application
  - `PATCH /applications/:id/interview-stages/:stageId` → `UpdateStage` → 200 with full application
  - `DELETE /applications/:id/interview-stages/:stageId` → `RemoveStage` → 200 with full application
- [ ] T020 Register stage routes in `handler/router.go`

**Checkpoint**: Stage add/update/remove work; stage changes appear in GET /applications/:id response

---

## Phase 5: History

**Purpose**: Snapshot-based history with field diffs and restore-to-version

- [ ] T021 Create `internal/service/history.go` with functions:
  - `CreateSnapshot(ctx, pool, applicationID, description string)` — serialize full application + stages to JSONB, insert into application_snapshots; called by all write operations in service/applications.go and service/stages.go
  - `GetHistory(ctx, pool, applicationID) ([]HistoryEntry, error)` — fetch all snapshots ordered by sequence desc; compute field-level diffs by comparing each snapshot to the previous one (all scalar fields + stages array); return HistoryEntry array matching API contract
  - `RestoreToVersion(ctx, pool, applicationID, snapshotID) (*Application, error)` — load snapshot, write fields back to applications table, replace all interview_stages for this application, create new snapshot with description "Restored to version N"
- [ ] T022 Create `internal/handler/history.go` — Gin handlers:
  - `GET /applications/:id/history` → `GetHistory` → 200 with history array
  - `POST /applications/:id/history/:historyId/restore` → `RestoreToVersion` → 200 with application

**Checkpoint**: History panel data matches application mutations; restore creates a new snapshot

---

## Phase 6: CSV Import / Export / Template

**Purpose**: Bulk import, full export, and downloadable CSV template

- [ ] T023 Create `internal/service/csv.go` with functions:
  - `ImportCSV(ctx, pool, reader io.Reader) (ImportResult, error)` — parse CSV headers (validate required columns), collect existing `jobPostingUrl` values, process each row: validate, check duplicate, insert or skip; return `{imported, skipped, errors}`; intra-file duplicate detection (skip second occurrence of same jobPostingUrl within the upload)
  - `ExportCSV(ctx, pool) ([]byte, error)` — query all applications (active + archived) ordered by date_applied desc; format as 16-column CSV matching spec; return bytes for download
  - `GetTemplate() []byte` — return hardcoded header row + one example row (matching spec's sample values)
- [ ] T024 Create `internal/handler/csv.go` — Gin handlers:
  - `POST /applications/import` — parse `multipart/form-data`, extract file, call service, return ImportResult JSON
  - `GET /applications/export` — call service, set `Content-Type: text/csv`, `Content-Disposition: attachment; filename="applications-YYYY-MM-DD.csv"`, write bytes
  - `GET /applications/sample-csv` — call service, set same headers with filename `applications-template.csv`, write bytes
- [ ] T025 Register CSV routes in `handler/router.go` — note: `/applications/import`, `/export`, `/sample-csv` must be registered BEFORE `/:id` routes to avoid Gin treating "import" as an ID

**Checkpoint**: Import returns counts, export downloads CSV, template has correct headers

---

## Phase 7: Integration Tests

**Purpose**: testcontainers-go test suite covering all domain areas

- [ ] T026 Add testcontainers-go dependency: `go get github.com/testcontainers/testcontainers-go` and `github.com/stretchr/testify`; run `go mod tidy`
- [ ] T027 Create `tests/helper_test.go` — `setupTestDB(t) *pgxpool.Pool`:
  - Start `postgres:18-alpine` container via testcontainers-go
  - Get host/port; build connection string pointing to new container
  - Run migrations against fresh PostgreSQL instance
  - Register `t.Cleanup()` to terminate container after test
  - Each test file that calls `setupTestDB` gets its own isolated PostgreSQL container
- [ ] T028 Create `tests/applications_test.go`:
  - `TestCreateApplication` — POST valid body, verify 201 + fields
  - `TestCreateApplication_UnsubmittedForcesNullDate` — status=unsubmitted + dateApplied provided → dateApplied=null in response
  - `TestListApplications_Pagination` — create 3, list with limit=2, verify total=3, data length=2
  - `TestListApplications_FilterByStatus` — create applied + interviewing, filter by applied, verify count=1
  - `TestUpdateApplication` — update companyName, verify field updated
  - `TestArchiveApplication` — archive, verify isArchived=true; list without archived filter returns 0
  - `TestDeleteApplication` — delete, verify GET returns 404
- [ ] T029 Create `tests/stages_test.go`:
  - `TestAddStage` — add stage to application, verify stage in application response
  - `TestUpdateStage` — update stage name, verify updated
  - `TestRemoveStage` — remove stage, verify absent from application
- [ ] T030 Create `tests/history_test.go`:
  - `TestHistory_SnapshotCreatedOnCreate` — create application, GET /history → length=1
  - `TestHistory_SnapshotCreatedOnUpdate` — update application, GET /history → length=2
  - `TestHistory_DiffsComputed` — update companyName, GET /history, verify diff shows old/new companyName
  - `TestHistory_RestoreToVersion` — create, update, restore to v1; verify application has original values
- [ ] T031 Create `tests/csv_test.go`:
  - `TestImportCSV_ValidFile` — upload valid CSV with 3 rows, verify imported=3
  - `TestImportCSV_Duplicate` — import same jobPostingUrl twice (two calls), verify second call skipped=1
  - `TestImportCSV_MissingRequiredColumn` — upload CSV without companyName, verify error
  - `TestExportCSV` — create 2 applications, export, parse CSV, verify 2 data rows + correct headers
  - `TestSampleCSV` — GET /sample-csv, verify header row + exactly 1 data row

**Checkpoint**: `go test ./tests/... -v` — all tests pass

---

## Phase 8: Project Integration

**Purpose**: Wire go-api into the monorepo scripts and infrastructure

- [ ] T032 Add individual scripts to root `package.json`:
  - `"dev:go-api": "cd go-api && go run ./cmd/server"`
  - `"build:go-api": "cd go-api && go build ./..."`
  - `"lint:go-api": "cd go-api && golangci-lint run"`
  - `"test:go-api": "cd go-api && go test ./..."`
  - `"audit:ci:go-api": "cd go-api && govulncheck ./..."`
  - `"install:go-api": "cd go-api && go mod download"`
  - `"migrate:go": "cd go-api && go run ./cmd/migrate"`
- [ ] T033 Add composite stack scripts:
  - `"build:go": "npm run build:go-api"`
  - `"install:go": "npm run install:go-api"`
- [ ] T034 Append `go-api` to all `:all` composite scripts:
  - `build:all` — append `&& npm run build:go`
  - `lint:all` — append `&& npm run lint:go-api`
  - `test:all` — append `&& npm run test:go-api`
  - `audit:ci:all` — append `&& npm run audit:ci:go-api`
  - `install:all` — append `&& npm run install:go`
- [ ] T035 Add port 5070 with comment to `scripts/stop-all.sh` PORTS array: `5070  # Go API`
- [ ] T036 Add `go-api` service to `docker-compose-all.yml` with `DATABASE_URL` env, depends_on postgres, port 5070:5070

**Checkpoint**: `npm run build:go && npm run lint:go-api && npm run test:go-api` all pass

---

## Phase 9: Validation

**Purpose**: Confirm build, lint, and tests are all green

- [ ] T037 Run `npm run build:go-api` — `go build ./...` exits 0
- [ ] T038 Run `npm run lint:go-api` — golangci-lint exits 0 with no warnings
- [ ] T039 Run `npm run test:go-api` — all testcontainers-go tests pass
- [ ] T040 Run `npm run build:all && npm run lint:all && npm run test:all` — no regressions in existing stacks

**Checkpoint**: All validation gates green

---

## Phase 10: Documentation

**Purpose**: Update all project-level documentation

- [ ] T041 Update `README.md`: add Go Gin API row to implementations table; add `dev:go-api` to running instructions; add `test:go-api` to test commands; note Go 1.23+ prerequisite
- [ ] T042 Update `docs/DATABASE_ARCHITECTURE.md`: add `go_gin` schema entry (directory `go-api/`, migration file, connection string pattern)
- [ ] T043 Update `CLAUDE.md`: add go-api memory patterns (sqlc workflow, testcontainers-go pattern, govulncheck for auditing)

**Checkpoint**: Documentation complete; implementation ready for PR

---

## Summary

**Total Tasks**: 43
**Phases**:
- Phase 1 (Scaffolding): 7 tasks — project structure, migration SQL
- Phase 2 (DB Layer): 5 tasks — sqlc queries, code generation, pgx pool
- Phase 3 (Core API): 5 tasks — applications CRUD, router, server entry
- Phase 4 (Interview Stages): 3 tasks — stage handlers + service
- Phase 5 (History): 2 tasks — snapshots, diffs, restore
- Phase 6 (CSV): 3 tasks — import, export, template
- Phase 7 (Integration Tests): 6 tasks — testcontainers-go, 4 test files
- Phase 8 (Project Integration): 5 tasks — package.json, stop-all.sh, docker-compose
- Phase 9 (Validation): 4 tasks — build/lint/test gates
- Phase 10 (Documentation): 3 tasks — README, DATABASE_ARCHITECTURE, CLAUDE.md

**Parallel opportunities**: Phases 4, 5, 6 (Stages, History, CSV) are independent — an agent team could implement them concurrently after Phase 3 completes.
