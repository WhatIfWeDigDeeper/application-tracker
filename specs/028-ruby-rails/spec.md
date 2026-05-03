# Spec 028: Ruby on Rails API Implementation

**Status:** Complete
**Stack:** Ruby 3.3+ + Rails API + ActiveRecord + PostgreSQL + RSpec

---

## Context

Add a Ruby on Rails API implementation to the monorepo, backed by the shared PostgreSQL database with its own `ruby_rails` schema. This implementation is API-only in the first pass: it focuses on matching the REST contract and shared API tests before adding a frontend. The closest recent planning model is `specs/024-lambda-dynamodb-api/`, which landed a backend-first implementation with UI and some optional features deferred; `specs/021-graphql-yoga-apollo/` is a lighter paired-stack reference.

Reference: `specs/core/` for technology-agnostic requirements.

---

## Stack Decisions

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Language | Ruby 3.3+ | Modern Rails-compatible Ruby; CI/local toolchain should avoid macOS system Ruby 2.6 |
| Framework | Rails API mode | Provides routing, controllers, middleware, ActiveRecord, migrations, and test conventions without view assets |
| ORM / DB access | ActiveRecord | Rails-native ORM; adds a new backend style to the monorepo |
| Migrations | Rails migrations | Native schema lifecycle for ActiveRecord |
| Build tool | Bundler + Rake | Standard Ruby dependency and task tooling |
| Frontend | Deferred | API-only first pass; UI parity will be planned after shared API tests pass |
| DB schema | `ruby_rails` | Follows monorepo `<language>_<framework>` schema naming convention |
| API port | 5180 | Next available API port after Lambda API on 5090 and FastAPI on 5160 |
| UI port | N/A | No UI process in this implementation |
| Directories | `rails-api/` | API-only process, matching backend-first implementation style |

---

## Feature Scope

Every core feature must be explicitly declared. Refer to `specs/core/features/` for full requirements.

| Feature | Priority | Status | Notes |
|---------|----------|--------|-------|
| [001 Application Management](../core/features/001-application-management.md) | P1 | ✅ In scope | REST create/read/update/delete via Rails controllers; edit flow is API-only |
| [002 Interview Tracking](../core/features/002-interview-tracking.md) | P1 | ✅ In scope | Default stages created on transition to `interviewing`; reorder supported through `order` updates |
| [003 Offer Management](../core/features/003-offer-management.md) | P2 | ✅ In scope | API stores and validates `offerDueDate`; UI urgency indicators deferred with frontend |
| [004 Filtering & Sorting](../core/features/004-filtering-sorting.md) | P1 | ✅ In scope | ActiveRecord scopes for status, category, source, skills minimum, archive flag; page/limit response envelope |
| [005 Archive & Delete](../core/features/005-archive-delete.md) | P2 | ✅ In scope | Archive/restore endpoints update `isArchived`; hard delete cascades stages and snapshots |
| [006 History](../core/features/006-history.md) | P2 | ✅ In scope | Snapshot row on every mutation; JSONB snapshot data; paginated REST history endpoint |
| [007 CSV Import/Export](../core/features/007-csv-import-export.md) | P2 | ⬜ Deferred | Follow-up after core API tests pass, matching backend-first precedent in spec 024 |
| [008 Inline Editing](../core/features/008-inline-editing.md) | P3 | ⬜ Deferred | UI-only enhancement; no frontend in first pass |
| [009 Resizable Textareas](../core/features/009-resizable-textareas.md) | P3 | ⬜ Deferred | UI-only enhancement; no frontend in first pass |

**Status values:** ✅ In scope | ⬜ Deferred | ❌ Out of scope (with reason)

### Feature Notes

#### 001 — Application Management
- Edit flow: API-only JSON PATCH endpoint.
- Unsaved-changes guard: deferred until a frontend is chosen.
- Responses use camelCase JSON keys even though Rails models and database columns use snake_case.

#### 002 — Interview Tracking
- Default stages are created when status transitions to `interviewing` and no stages exist.
- Reorder is supported by updating a stage's `order` value.
- Stage completion dates are stored as `completed_date` and serialized as `completedDate`.

#### 003 — Offer Management
- `offerDueDate` is accepted on create/update and preserved in snapshots.
- UI prompts and urgency styling are deferred until a frontend is added.

#### 004 — Filtering & Sorting
- Filters: status, companyCategory, jobSource, skillsMatch minimum, includeArchived.
- Sort fields: `dateApplied`, `companyName`, `status`, `updatedAt`; direction: `asc`/`desc`.
- Default sort: `updatedAt` desc.
- Pagination: page + limit query params; response envelope `{ items, page, limit, total }`.

#### 005 — Archive & Delete
- Archive and restore are explicit REST actions that update `isArchived` and create snapshots.
- Delete removes the application and cascades dependent stages and snapshots.

#### 006 — History
- Snapshot created on every create, update, archive, restore, stage create/update/delete, and history restore.
- Snapshot `data` column type: JSONB.
- History endpoint returns newest-first paginated entries.
- Restore accepts a snapshot sequence number and applies its application/stage state.

#### 007 — CSV Import/Export
- Deferred from the initial Rails API PR to keep the first validation target focused on shared API conformance.
- Follow-up should implement the 17-column format from `specs/core/features/007-csv-import-export.md`.

---

## Architecture

Single backend process:

- **`rails-api/`** — Rails API on port 5180; JSON responses only; PostgreSQL schema `ruby_rails`.

```
localhost:5180 → Rails routes → API controllers → services/models → ActiveRecord → PostgreSQL ruby_rails schema
```

No frontend process is created in this spec. Existing shared API tests will validate the HTTP contract directly.

---

## Backend Folder Structure (`rails-api/`)

```
rails-api/
├── Gemfile
├── Gemfile.lock
├── Rakefile
├── config.ru
├── config/
│   ├── application.rb
│   ├── boot.rb
│   ├── database.yml
│   ├── environment.rb
│   ├── environments/
│   └── routes.rb
├── app/
│   ├── controllers/
│   │   └── api/
│   │       ├── applications_controller.rb
│   │       ├── application_history_controller.rb
│   │       ├── health_controller.rb
│   │       └── interview_stages_controller.rb
│   ├── models/
│   │   ├── application_record.rb
│   │   ├── job_application.rb
│   │   ├── interview_stage.rb
│   │   └── application_snapshot.rb
│   ├── serializers/
│   │   └── application_serializer.rb
│   └── services/
│       ├── application_snapshot_service.rb
│       ├── application_restore_service.rb
│       └── application_status_service.rb
├── db/
│   └── migrate/
│       └── 001_initial_schema.rb
└── spec/
    ├── requests/
    └── rails_helper.rb
```

---

## Required Tests

Unit and integration tests are a required deliverable of this implementation.

### Backend Tests

Use RSpec request specs against a real PostgreSQL test schema. Do not mock ActiveRecord models or service objects for normal success paths; assert behavior through HTTP responses and follow-up API requests.

| Test file | What to cover |
|-----------|---------------|
| `spec/requests/applications_spec.rb` | CRUD endpoints, validation errors, filtering, sorting, pagination, archive/restore, delete |
| `spec/requests/interview_stages_spec.rb` | Stage CRUD, reorder updates, validation errors, default stage side effects |
| `spec/requests/application_history_spec.rb` | Snapshot creation, paginated history, restore by sequence |
| `spec/models/job_application_spec.rb` | Pure validation and status transition rules where easier than request setup |

Shared API tests are also required through `npm run test:api:rails-api`.

---

## Database: Schema `ruby_rails`

Rails migration creates:

- `ruby_rails` schema
- Tables: `applications`, `interview_stages`, `application_snapshots`
- Snapshot `data` column: JSONB full application state including stages
- Indexes for list filtering/sorting and history lookup

Enum-like fields are stored as strings with strict ActiveRecord inclusion validations. This avoids friction with values containing spaces and hyphens (`given offer`, `enterprise-software`, `company-website`) while preserving the core JSON contract exactly.

---

## Backend Dependencies

```ruby
gem "rails", "8.0.4.1"
gem "pg", "1.6.2"
gem "puma", "7.1.0"
gem "rack-cors", "3.0.0"
gem "bootsnap", "1.19.0", require: false

group :development, :test do
  gem "rspec-rails", "8.0.2"
  gem "rubocop", "1.82.0", require: false
  gem "rubocop-rails", "2.34.1", require: false
  gem "bundler-audit", "0.9.2", require: false
end
```

Exact versions may be adjusted during implementation if Ruby/Rails compatibility requires it, but dependencies must remain pinned.

---

## Backend Configuration

```
PORT=5180
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_tracker
RAILS_ENV=development
```

`config/database.yml` sets `schema_search_path: ruby_rails,public` for development and test.

CORS allows local monorepo frontend origins for future pairing but no UI is required in this spec.

---

## Monorepo Integration

### Root `package.json` Scripts

```json
"dev:rails-api": "cd rails-api && bundle exec rails server -p 5180",
"build:rails-api": "cd rails-api && bundle exec rails zeitwerk:check",
"lint:rails-api": "cd rails-api && bundle exec rubocop",
"test:rails-api": "cd rails-api && bundle exec rspec",
"install:rails-api": "cd rails-api && bundle install",
"ci:rails-api": "cd rails-api && bundle install --jobs 4 --retry 3",
"audit:ci:rails-api": "cd rails-api && bundle exec bundler-audit check --update",
"migrate:rails-api": "cd rails-api && bundle exec rails db:migrate",
"test:api:rails-api": "API_URL=http://localhost:5180 STACK_NAME=rails-api npx jest --config tests/jest.config.js --testPathPatterns=tests/api",
"validate:rails-api": "bash scripts/validate.sh rails-api"
```

Add each script to the relevant `:all` aggregate where the repo already tracks the same verb.

### Shared Scripts

- `scripts/run-api-tests.sh`: add `rails-api` to the stack list, port map, script map, and base URL map.
- `scripts/stop-all.sh`: add port `5180`.
- `tests/api/helpers.ts`: add Rails metadata and include it in history-capable stacks; keep it out of `CSV_STACKS` until feature 007 lands.
- `scripts/generate-schema-docs.sh`: add `ruby_rails:rails-api` and run `npm run docs:schema` after migrations.

### CI (`.github/workflows/verify-pr.yaml`)

Add Ruby setup before aggregate audit/install/lint/build/test commands:

```yaml
- name: Set up Ruby
  if: steps.docs-check.outputs.only_changed == 'false'
  uses: ruby/setup-ruby@v1
  with:
    ruby-version: '3.3'
    bundler-cache: true
    working-directory: rails-api
```

---

## Validation Chain

Before declaring the implementation complete:

1. `npm run install:rails-api`
2. `npm run audit:ci:rails-api`
3. `npm run build:rails-api`
4. `npm run lint:rails-api`
5. `npm run test:rails-api`
6. `npm run migrate:rails-api`
7. `npm run test:api:rails-api`
8. `bash scripts/run-api-tests.sh all`
9. `npm run docs:schema`

No Playwright E2E run is required until a Rails frontend is added.

---

## Documentation

When complete, update:

- `README.md` — implementation table, running instructions, API testing commands, validation command list.
- `docs/DATABASE_ARCHITECTURE.md` — add Rails schema details.
- `scripts/generate-schema-docs.sh` — add Rails schema mapping.
- `rails-api/CLAUDE.md` — Rails-specific commands and gotchas.
- `.github/workflows/verify-pr.yaml` — Ruby/Bundler setup for CI.

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Local macOS system Ruby is too old for modern Rails | Medium | Pin Ruby 3.3+ and configure CI with `ruby/setup-ruby`; document local setup in `rails-api/CLAUDE.md` |
| Rails snake_case vs API camelCase | Medium | Centralize serialization/deserialization helpers and cover with request specs |
| Status enum values contain spaces | Medium | Store strings with inclusion validations instead of PostgreSQL enum columns |
| Snapshot callbacks can double-record | Medium | Route mutations through explicit service methods that create one snapshot per user-visible mutation |
| Shared API PATCH expectations differ by stack | Low | Match the OpenAPI contract and run shared API tests early |
| CSV deferred | Low | Keep Rails out of `CSV_STACKS` until feature 007 lands |

---

## Execution Approach

Single session, sequential. Steps are dependent: spec → Rails skeleton → migrations/models → services/controllers → RSpec → shared API tests → monorepo scripts/docs/CI. Subagents may be used for review or isolated troubleshooting, but no parallel frontend work is part of this implementation.
