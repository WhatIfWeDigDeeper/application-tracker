# Spec NNN: [Technology] Implementation

**Status:** Planning | In Progress | Complete
**Stack:** [e.g., Java 21 + Spring Boot 3.x + Angular 21 + Flyway + Gradle]

---

## Context

[One paragraph explaining what this implementation adds to the monorepo, what existing implementation it is most similar to, and any high-level constraints or motivations. Reference the closest prior spec if applicable.]

Reference: `specs/core/` for technology-agnostic requirements.

---

## Stack Decisions

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Language | | |
| Framework | | |
| ORM / DB access | | |
| Migrations | | |
| Build tool | | |
| Frontend | | |
| DB schema | `<language>_<framework>` | Follows monorepo naming convention |
| API port | | Next available in monorepo sequence |
| UI port | | Next available in monorepo sequence |
| Directories | `<api-dir>/` + `<ui-dir>/` | Separate UI+API processes |

---

## Feature Scope

Every core feature must be explicitly declared. Refer to `specs/core/features/` for full requirements.

| Feature | Priority | Status | Notes |
|---------|----------|--------|-------|
| [001 Application Management](features/001-application-management.md) | P1 | ✅ In scope | Declare: edit flow type (separate form / modal / inline) |
| [002 Interview Tracking](features/002-interview-tracking.md) | P1 | ✅ In scope | Declare: default stage creation, reorder support |
| [003 Offer Management](features/003-offer-management.md) | P2 | ✅ In scope | Declare: overdue/urgency indicators, due-date prompt on status change |
| [004 Filtering & Sorting](features/004-filtering-sorting.md) | P1 | ✅ In scope | Declare: supported filters, sort fields, pagination approach |
| [005 Archive & Delete](features/005-archive-delete.md) | P2 | ✅ In scope | Declare: archive/restore UI placement, delete confirmation |
| [006 History](features/006-history.md) | P2 | ✅ In scope | Declare: snapshot strategy (per-mutation), history panel placement |
| [007 CSV Import/Export](features/007-csv-import-export.md) | P2 | ✅ In scope | Declare: 16-column format, duplicate detection |
| [008 Inline Editing](features/008-inline-editing.md) | P3 | ⬜ Deferred | Optional — if included, declare save trigger (blur / explicit button) |
| [009 Resizable Textareas](features/009-resizable-textareas.md) | P3 | ⬜ Deferred | Optional — if included, declare which fields get resize handle |

**Status values:** ✅ In scope | ⬜ Deferred | ❌ Out of scope (with reason)

### Feature Notes

#### 001 — Application Management
- Edit flow: [separate form page / modal dialog / inline editing — pick one]
- Unsaved-changes guard: [router block / beforeunload / none]

#### 002 — Interview Tracking
- Default stages created on `applied → interviewing` transition (if no stages exist). [Confirm or describe variation.]
- Stage reorder: [supported / not supported]

#### 003 — Offer Management
- Overdue indicator: shown in list and detail when `offerDueDate < today` and status is "given offer"
- Urgency styling: [1–3 days = warning, today = urgent — confirm or describe variation]
- Due-date prompt: [shown when status changes to "given offer" / omitted]

#### 004 — Filtering & Sorting
- Filters: status (multi-select), companyCategory (multi-select), jobSource (multi-select), skillsMatch (minimum), includeArchived (boolean)
- Sort fields: dateApplied, companyName, updatedAt; direction: asc/desc
- Default sort: `updatedAt` desc
- Pagination: [page + limit query params; response envelope `{ items, page, limit, total }`]

#### 006 — History
- Snapshot created on every mutation (create, update, archive, restore, stage changes)
- Snapshot `data` column type: [JSONB / TEXT / framework equivalent]
- History panel: [slide-in from right / inline section / other]
- Diffs: computed from adjacent snapshots, newest-first

#### 007 — CSV Import/Export
- 16-column format as specified in core spec (see `specs/core/features/007-csv-import-export.md`)
- Duplicate detection: by `jobPostingUrl` (cross-file and intra-file)

---

## Architecture

Two separate processes:

- **`<api-dir>/`** — [Framework] REST API on port XXXX; JSON responses only
- **`<ui-dir>/`** — [Framework] SPA on port YYYY; proxies `/api` → `http://localhost:XXXX`

CORS: API allows requests from `http://localhost:YYYY`.

---

## Backend Folder Structure (`<api-dir>/`)

```
<api-dir>/
├── [build config]
├── [main source tree]
│   ├── [entry point]
│   ├── config/
│   ├── controller/          # REST endpoints
│   ├── dto/                 # Request/response types
│   ├── entity/              # Domain entities
│   ├── repository/          # Data access
│   └── service/             # Business logic
├── [migrations or schema]
│   └── [V1__initial.sql or equivalent]
└── [test source tree]
    ├── [controller tests]
    └── [service tests]
```

---

## Frontend Folder Structure (`<ui-dir>/`)

```
<ui-dir>/
├── [build config]
├── [proxy config]           # /api → http://localhost:XXXX
└── src/
    ├── [models/types]       # Domain types (ApplicationStatus, etc.)
    ├── [services]           # HTTP client wrappers
    ├── [list component]     # Application list with filters/sort
    ├── [form component]     # Create + edit form
    ├── [detail component]   # Detail view with stages, archive, history
    └── [shared components]  # StatusBadge, etc.
```

---

## Database: Schema `<schema_name>`

Migration `V1__initial.sql` (or equivalent) creates:
- `<schema_name>` schema
- Enums: `application_status`, `company_category`, `job_source` (matching other stacks — see `specs/core/domain/enums.md`)
- Tables: `applications`, `interview_stages`, `application_snapshots`
- Snapshot `data` column: [JSONB / TEXT / equivalent] — stores full `JobApplication` state including stages

---

## Backend Dependencies

```
[List key dependencies with pinned versions]
```

---

## Backend Configuration

```
[Key config: port, DB connection string with schema, migration settings]
```

---

## Monorepo Integration

### Root `package.json` Scripts

```json
"dev:<api>":            "cd <api-dir> && [start command]",
"build:<api>":          "cd <api-dir> && [build command]",
"lint:<api>":           "cd <api-dir> && [lint command]",
"test:<api>":           "cd <api-dir> && [test command]",
"install:<api>":        "cd <api-dir> && [install command]",
"dev:<ui>":             "cd <ui-dir> && [start command] --port YYYY",
"build:<ui>":           "cd <ui-dir> && [build command]",
"lint:<ui>":            "cd <ui-dir> && [lint command]",
"test:<ui>":            "cd <ui-dir> && [test command]",
"install:<ui>":         "cd <ui-dir> && [install command]",
"test:e2e:<stack>":     "TEST_UI_PORT=YYYY PLAYWRIGHT_HTML_OPEN=never npx -y playwright test"
```

Add each to its `:all` counterpart. Add ports XXXX and YYYY to `scripts/stop-all.sh`.

### `playwright.config.ts`

```ts
YYYY: 'npm run dev:<ui>',
```

Note: The API backend must be started separately (or via `run-e2e.sh`) before Playwright runs.

### `scripts/run-e2e.sh`

Add `<stack>` to `STACKS`. `api_port=XXXX`, `api_script=dev:<api>`, `ui_port=YYYY`, `ui_script=dev:<ui>`.

### CI (`.github/workflows/verify-pr.yaml`)

```yaml
[Add any language/toolchain setup steps required — e.g., setup-java, setup-python/uv]
[Add build + lint + test steps for both packages]
[Add audit/security-check step if applicable]
```

---

## Validation Chain

Before merging, all of the following must pass:

1. `npm run build:<api>` — backend compiles cleanly
2. `npm run lint:<api>` — no lint errors
3. `npm run test:<api>` — unit/integration tests pass
4. `npm run build:<ui>` — frontend compiles cleanly
5. `npm run lint:<ui>` — no lint errors
6. `npm run test:<ui>` — frontend unit tests pass
7. `npm run test:e2e:<stack>` — shared Playwright E2E tests pass (13 tests)
8. `bash scripts/run-e2e.sh` — all stacks pass with no regression

---

## Documentation

When complete, the following must be updated:

- `README.md` — add stack to TOC, implementations list, dev/test commands
- `docs/DATABASE_ARCHITECTURE.md` — add schema name and config details
- `scripts/generate-schema-docs.sh` — add new schema; run `npm run docs:schema`
- `CLAUDE.md` — add port mappings and any new patterns discovered

---

## E2E Test Compatibility

The Angular/React/Vue/etc. frontend must match the shared Playwright selector contract:
- Button text, input placeholders, element IDs, and labels must match other implementations
- Cleanup in `afterAll` uses `page.request.delete('/api/applications/${id}')` — not UI clicks
- Confirm selector contract against `tests/e2e/` before declaring E2E complete

---

## Execution Approach

[State how implementation will be run: single session sequential / parallel subagents / agent team / isolated worktree. This must be explicit before work begins.]
