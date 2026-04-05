# Spec 024: AWS Lambda + DynamoDB + API Gateway Backend

**Status:** Planning
**Stack:** TypeScript + Hono + AWS Lambda + DynamoDB + API Gateway + AWS CDK

---

## Context

Add the first serverless, non-PostgreSQL backend to the monorepo: AWS Lambda handlers backed by DynamoDB, with API Gateway for routing and CDK for infrastructure-as-code. This is the first implementation that departs from the shared PostgreSQL database — DynamoDB requires a fundamentally different data modeling approach (single-table design with GSIs for access patterns).

The key architectural insight is using **Hono as the routing framework inside Lambda** via `@hono/aws-lambda`. This means the same `app.ts` runs locally via `@hono/node-server` (identical dev experience to hono-api) and in production as a Lambda handler — no LocalStack needed, no synthetic API Gateway event construction.

Reference: `specs/core/` for technology-agnostic requirements. Most similar to `specs/011-svelte-hono/` (Hono-based API).

---

## Stack Decisions

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Language | TypeScript | Matches monorepo dominant language; shares Zod schemas with hono-api |
| Routing framework | Hono | `@hono/aws-lambda` adapter — same app runs locally AND in Lambda |
| Database | DynamoDB (single-table design) | First non-PostgreSQL backend; serverless-native storage |
| IaC | AWS CDK (TypeScript) | Same language as handlers; deferred to v2 |
| Local DynamoDB | `amazon/dynamodb-local` Docker container | Free, AWS-maintained, no LocalStack license required |
| Local API server | Hono via `@hono/node-server` on port 5090 | Identical dev experience to hono-api |
| Lambda adapter | `@hono/aws-lambda` | Wraps Hono app for Lambda runtime |
| DynamoDB table | `lambda_api_applications` | Table name serves the schema isolation purpose |
| API port | 5090 | Next available after yoga-api (5080) |
| UI port | TBD | Frontend to be chosen separately |
| Directories | `lambda-api/` | API only for now; UI added in a follow-up spec |

---

## Feature Scope

| Feature | Priority | Status | Notes |
|---------|----------|--------|-------|
| [001 Application Management](../core/features/001-application-management.md) | P1 | ✅ In scope | Edit flow: separate form (follows hono-api pattern) |
| [002 Interview Tracking](../core/features/002-interview-tracking.md) | P1 | ✅ In scope | Default stages on applied → interviewing; reorder supported |
| [003 Offer Management](../core/features/003-offer-management.md) | P2 | ✅ In scope | Overdue indicator via offerDueDate; urgency styling |
| [004 Filtering & Sorting](../core/features/004-filtering-sorting.md) | P1 | ✅ In scope | All filters via DynamoDB FilterExpression; in-memory sort for non-updatedAt |
| [005 Archive & Delete](../core/features/005-archive-delete.md) | P2 | ✅ In scope | Archive flag; delete cascades all items with same PK |
| [006 History](../core/features/006-history.md) | P2 | ✅ In scope | Snapshot per mutation; HIST# items in single table |
| [007 CSV Import/Export](../core/features/007-csv-import-export.md) | P2 | ⬜ Deferred | Add in follow-up after core tests pass |
| [008 Inline Editing](../core/features/008-inline-editing.md) | P3 | ⬜ Deferred | UI not yet chosen |
| [009 Resizable Textareas](../core/features/009-resizable-textareas.md) | P3 | ⬜ Deferred | UI not yet chosen |

### Feature Notes

#### 001 — Application Management
- Edit flow: separate form page (consistent with hono-api)
- Unsaved-changes guard: router block (deferred until UI is chosen)

#### 002 — Interview Tracking
- Default stages created on `applied → interviewing` transition (if no stages exist)
- Stage reorder: supported (order attribute on STAGE# items)

#### 004 — Filtering & Sorting
- Filters: status (multi-select), companyCategory, jobSource, skillsMatch (minimum), includeArchived
- Sort fields: updatedAt (via GSI), companyName, dateApplied (in-memory for non-GSI sorts)
- Default sort: `updatedAt` desc
- Pagination: page + limit; response envelope `{ items, page, limit, total }`
- **Trade-off**: DynamoDB uses cursor-based pagination internally; offset-based API contract fulfilled via in-memory pagination (acceptable at job-tracker scale)

#### 006 — History
- Snapshot created on every mutation (create, update, archive, restore, stage changes)
- History items stored as `HIST#<zero-padded-seq>` under the application PK
- Snapshot `data`: JSON-serialized full application state including stages

---

## Architecture

Single process for now (API only, no UI):

- **`lambda-api/`** — Hono app on port 5090 locally; Lambda + API Gateway in production

```
Production:  API Gateway → Lambda → handler.ts → Hono app → DynamoDB
Local dev:   localhost:5090 → server.ts → Hono app → DynamoDB Local (Docker)
```

---

## DynamoDB Single-Table Design

### Table: `lambda_api_applications`

Primary keys: `PK` (String), `SK` (String)

| Item Type | PK | SK | Key Attributes |
|-----------|----|----|----------------|
| Application | `APP#<uuid>` | `APP#<uuid>` | companyName, positionTitle, status, archived, updatedAt, dateApplied, offerDueDate, notes, jobPostingUrl, companyWebsite, companyCategory, jobSource, skillsMatch, salaryQuoted, historySequence, GSI1PK, GSI1SK, GSI2PK, GSI2SK |
| Interview Stage | `APP#<uuid>` | `STAGE#<uuid>` | stageName, stageOrder, scheduledDate, completedDate, notes |
| History Snapshot | `APP#<uuid>` | `HIST#<zero-padded-seq>` e.g. `HIST#00042` | data (JSON), createdAt |
| Count Metadata | `META` | `COUNT` | count (Number) |

### Global Secondary Indexes

**GSI1** — Filtered listing by status + archived:
- `GSI1PK`: `STATUS#<status>#ARCHIVED#<0|1>` (e.g., `STATUS#applied#ARCHIVED#0`)
- `GSI1SK`: `UPDATED#<iso-timestamp>#<uuid>` (sort by updatedAt; uuid suffix ensures uniqueness)

**GSI2** — All non-archived listing:
- `GSI2PK`: `ACTIVE` (constant; only non-archived apps project this key)
- `GSI2SK`: `UPDATED#<iso-timestamp>#<uuid>`

### Access Patterns

| Pattern | Operation |
|---------|-----------|
| Get application by ID | `GetItem(PK=APP#<id>, SK=APP#<id>)` |
| List apps (no filter, updatedAt DESC) | `Query GSI2, ScanIndexForward=false` |
| List apps filtered by status | `Query GSI1(GSI1PK=STATUS#<status>#ARCHIVED#0)` |
| List apps including archived | `Scan` with FilterExpression (small datasets) |
| Get stages for application | `Query(PK=APP#<id>, SK begins_with STAGE#)` |
| Get history for application | `Query(PK=APP#<id>, SK begins_with HIST#), ScanIndexForward=false` |
| Delete application + cascade | `Query(PK=APP#<id>)` → `BatchWriteItem(delete all)` |

---

## Backend Folder Structure (`lambda-api/`)

```
lambda-api/
├── package.json
├── tsconfig.json
├── eslint.config.js
├── .auditconfig.json
├── .env                            # DYNAMODB_ENDPOINT=http://localhost:8000
├── src/
│   ├── app.ts                      # Hono app (routes + middleware)
│   ├── handler.ts                  # Lambda entry: handle(app)
│   ├── server.ts                   # Local dev: serve(app, 5090)
│   ├── routes/
│   │   ├── applications.ts         # All application CRUD routes
│   │   └── health.ts
│   ├── services/
│   │   ├── application.service.ts
│   │   ├── interview-stage.service.ts
│   │   ├── history.service.ts
│   │   └── dynamodb.client.ts      # DynamoDB DocumentClient (endpoint-aware)
│   └── types/
│       ├── api.ts                  # Zod schemas (adapted from hono-api)
│       └── dynamo.ts               # DynamoDB item shapes and marshalling
├── scripts/
│   └── setup-dynamodb.ts           # Create table + GSIs (idempotent)
└── cdk/                            # Future v2: CDK stack
    ├── bin/app.ts
    ├── lib/lambda-api-stack.ts
    └── cdk.json
```

---

## Required Tests

### Backend Tests

Integration tests using `vitest` + `supertest` against real DynamoDB Local. No mocking.

| Test file | What to cover |
|-----------|---------------|
| `src/__tests__/application.test.ts` | CRUD endpoints, 404 handling, validation errors |
| `src/__tests__/status-transitions.test.ts` | All status paths; assert returned status via GET |
| `src/__tests__/interview-stage.test.ts` | Stage CRUD, default stage creation on interviewing transition |
| `src/__tests__/history.test.ts` | Snapshot created on mutations; history items returned correctly |

DynamoDB Local must be running at `DYNAMODB_ENDPOINT` for tests to run.

---

## Backend Dependencies

```json
{
  "dependencies": {
    "hono": "latest-stable",
    "@hono/node-server": "latest-stable",
    "@hono/aws-lambda": "latest-stable",
    "@aws-sdk/client-dynamodb": "latest-stable",
    "@aws-sdk/lib-dynamodb": "latest-stable",
    "zod": "latest-stable",
    "dotenv": "latest-stable"
  },
  "devDependencies": {
    "tsx": "latest-stable",
    "typescript": "5.x",
    "eslint": "latest-stable",
    "typescript-eslint": "latest-stable",
    "@types/node": "latest-stable",
    "vitest": "latest-stable",
    "supertest": "latest-stable",
    "@types/supertest": "latest-stable"
  }
}
```

(Exact pinned versions determined at install time per monorepo dependency management policy.)

---

## Backend Configuration

```
# lambda-api/.env
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_TABLE=lambda_api_applications
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=local       # DynamoDB Local accepts any value
AWS_SECRET_ACCESS_KEY=local   # DynamoDB Local accepts any value
PORT=5090
```

---

## Monorepo Integration

### Docker Compose (`docker-compose.yml`)

```yaml
dynamodb-local:
  image: amazon/dynamodb-local:latest
  container_name: app_tracker_dynamodb
  ports:
    - "8000:8000"
  command: "-jar DynamoDBLocal.jar -sharedDb -dbPath /data"
  volumes:
    - dynamodb_data:/data
```

Add `dynamodb_data` to the `volumes:` section.

### Root `package.json` Scripts

```json
"dev:lambda-api":       "cd lambda-api && npm run dev",
"build:lambda-api":     "cd lambda-api && npm run build",
"lint:lambda-api":      "cd lambda-api && npm run lint",
"test:lambda-api":      "cd lambda-api && npm test",
"install:lambda-api":   "cd lambda-api && npm install",
"ci:lambda-api":        "cd lambda-api && npm ci",
"audit:ci:lambda-api":  "cd lambda-api && npx -y audit-ci --config .auditconfig.json",
"migrate:lambda-api":   "cd lambda-api && npx tsx scripts/setup-dynamodb.ts",
"test:api:lambda-api":  "API_URL=http://localhost:5090 STACK_NAME=lambda-api npx jest --config tests/jest.config.js --testPathPatterns=tests/api"
```

Add each to its `:all` counterpart.

### `tests/api/helpers.ts`

Add to `ALL_STACKS`:
```ts
{ name: 'lambda-api', baseUrl: 'http://localhost:5090', validatesDates: true, hasInterviewStageDates: true }
```

### `scripts/run-api-tests.sh`

Add `lambda-api` to `STACKS` array; add port/script/url mappings:
- Port: `5090`
- Script: `dev:lambda-api`
- URL: `http://localhost:5090`

### `scripts/stop-all.sh`

Add port `5090`.

### CI (`.github/workflows/verify-pr.yaml`)

Add build + lint + test steps for `lambda-api`. No new toolchain setup needed (Node.js already configured).

---

## Validation Chain

1. `npm run build:lambda-api` — TypeScript compiles cleanly
2. `npm run lint:lambda-api` — no ESLint errors
3. `npm run test:lambda-api` — unit/integration tests pass (requires DynamoDB Local running)
4. `npm run test:api:lambda-api` — shared API contract tests pass
5. `bash scripts/run-api-tests.sh all` — no regression on other stacks

**Prerequisite**: `docker compose up -d dynamodb-local` before running any tests.

---

## Documentation

When complete:
- `README.md` — add stack to TOC, implementations list, dev/test commands
- `docs/DATABASE_ARCHITECTURE.md` — note DynamoDB departure; document table name and GSI design
- `CLAUDE.md` — add port mapping (lambda-api: 5090), DynamoDB Local port (8000), and any new patterns
- `docker-compose.yml` — DynamoDB Local service addition documented here

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Offset pagination vs DynamoDB cursor | Medium | In-memory pagination at job-tracker scale |
| Complex filter combos | Low-Medium | FilterExpressions post-read |
| Delete cascade (no FK) | Low | Query PK → BatchWriteItem |
| Port 8000 conflict | Low | `DYNAMODB_PORT` env var |
| No CSV support initially | Low | `CSV_STACKS` filter skips non-CSV stacks in shared tests |
| CDK deferred | None | Local dev doesn't need it |

---

## Execution Approach

Single session, sequential. Steps are highly dependent (types → services → routes → entry points → integration). After core implementation, run shared API tests iteratively.

Future follow-up: CDK stack, frontend pairing, CSV import/export support.
