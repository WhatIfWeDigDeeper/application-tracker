# Feature Spec: Express API with Prisma (Postgres) and UI Reorganization

## Context
- Repository: application-tracker
- Branch: 003-express-api-prisma
- Deployment: Local Docker (api, ui, Postgres)
- ORM/DB: Prisma with Postgres

## Goals
1. Reorganize existing Next.js app under `ui/` without breaking functionality
2. Scaffold `api/` Express server (TypeScript) using Prisma
3. Provide Docker Compose for local development
4. Document contracts and quickstart for contributors

## Functional Requirements
  - List, create, read, update, delete job applications
  - Support optional filters: `status`, `companyCategory`, `jobSource`, `includeArchived` (default false)
  - Pagination: `page` (default 1), `limit` (default 20, max 100); responses return envelope `{ items, page, limit, total }`
  - **PATCH requests must be partial**: clients should send only changed fields; unspecified fields remain unchanged
  - Attach multiple stages to an application
  - Create/update/delete stages; mark completion with date and rating
  - **PATCH requests must be partial**: send only fields to update for a stage
- Health endpoint
  - `/health` returns 200 and status info

## Non-Functional Requirements
- Type-safe API and data models (TypeScript strict)
- Validation using `zod` for request payloads
- Prisma migrations + seed for local dev
- API performance targets: p95 ≤ 200ms read; ≤ 500ms write
- Lint and test gates must pass in CI
 - Standardized error format: `{ code, message, details[]? }` across all endpoints

## Deliverables
- `ui/` reorg: move current app files into `ui/` directory with configs
- `api/`: routes, middleware, services, Prisma schema, Dockerfile, env example
- `docker-compose.yml`: services for db/api/ui with dependencies and healthchecks
- Contracts: OpenAPI describing endpoints and schemas
- `quickstart.md`: setup and run instructions

## Acceptance Criteria
- `docker-compose up` starts postgres, api, ui; API `/health` returns 200
- `prisma migrate deploy` creates tables; seed runs successfully
- UI can read/write applications and interview stages via the API
- Tests pass for API basic CRUD
 - Performance gate validated: `npm run perf:check` passes (p95 read ≤ 200ms, write ≤ 500ms)
 - Error responses follow standardized schema for validation/not-found/internal errors

## Security & Auth
- Local development only: no authentication required
- Future work: add auth if deployment scope expands (out of current MVP)
