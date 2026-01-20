---

description: "Task list for Express API with Prisma (Postgres) and UI reorganization"
---

# Tasks: Express API with Prisma (Postgres) and UI Reorganization

**Input**: Design documents from `/specs/003-express-api-prisma/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests included where requested by the spec and constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize UI/API separation and base configs

- [x] T001 Create `ui/` directory and move Next.js app files from root to ui/
- [x] T002 Move `src/` to `ui/src` and `public/` to `ui/public`
- [x] T003 Move configs to `ui/`: `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, `jest.config.js`, `jest.setup.js`, `playwright.config.ts`
- [x] T004 [P] Add `ui/.env.example` based on existing envs
- [x] T005 [P] Add `ui/Dockerfile` (multi-stage Next.js build)
- [x] T006 Create `api/` directory with base structure: `src/`, `prisma/`, `package.json`, `tsconfig.json`, `.env.example`, `Dockerfile`
- [x] T007 [P] Configure root `.github/dependabot.yml` to track `/ui`, `/api`, and root docker files
- [x] T008 [P] Add root `.env.example` with compose envs (e.g., `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure blocking all user stories

- [x] T009 Setup Prisma in `api`: add `@prisma/client` and `prisma` dependencies in `api/package.json`
- [x] T010 [P] Create `api/prisma/schema.prisma` aligning with `data-model.md`
- [x] T011 [P] Add `api/src/db/client.ts` to instantiate PrismaClient and export singleton
- [x] T012 [P] Add `api/src/middleware/errorHandler.ts` and `api/src/middleware/logger.ts`
- [x] T013 [P] Implement Express bootstrap in `api/src/index.ts` (load env, middleware, health route, router mount)
- [x] T014 Configure `docker-compose.yml` with services: `postgres`, `api`, `ui`, volumes and healthchecks
- [x] T015 [P] Add `api` scripts: `prisma generate`, `prisma migrate dev`, `prisma migrate deploy`, `prisma:seed`
- [x] T016 [P] Add `api/src/db/seed.ts` with sample data for local dev
- [x] T017 [P] Add zod validation schemas in `api/src/types` for request DTOs
- [x] T018 Ensure TypeScript strict mode and ESLint/Prettier config for `api/`
- [x] T050 [P] Implement standardized error responses via global middleware in `api/src/middleware/errorHandler.ts`
- [x] T051 [P] Update routes to use error codes/messages (`validation_error`, `not_found`, `internal_error`)

**Checkpoint**: Foundation ready — user stories can start in parallel

---

## Phase 3: User Story 1 — Applications CRUD (Priority: P1) 🎯 MVP

**Goal**: Manage job applications via REST endpoints

**Independent Test**: Contract and integration tests validate CRUD independently of other stories

### Tests (requested)

- [x] T019 [P] [US1] Contract tests for `/applications` endpoints in `api/tests/contract/applications.contract.test.ts`
- [x] T020 [P] [US1] Integration tests for applications workflow in `api/tests/integration/applications.integration.test.ts`

### Implementation

- [x] T021 [P] [US1] Implement zod DTOs in `api/src/types/applications.dto.ts`
- [x] T022 [P] [US1] Implement `Application` service in `api/src/services/applications.service.ts` using PrismaClient
- [x] T023 [US1] Implement router in `api/src/routes/applications.ts` (list, create, get, patch, delete)
- [x] T024 [US1] Wire routes in `api/src/index.ts` under `/applications`
- [x] T025 [US1] Error handling and validation integration for applications routes
- [x] T026 [US1] Seed sample applications in `api/src/db/seed.ts`
- [x] T052 [US1] Implement filters and pagination in `api/src/services/applications.service.ts` (`status`, `companyCategory`, `jobSource`, `includeArchived`; `page`, `limit` with defaults)
- [x] T053 [P] [US1] Extend contract tests to assert filters/pagination behavior in `api/tests/contract/applications.contract.test.ts`
- [x] T054 [US1] Update OpenAPI to use response envelope `{ items, page, limit, total }` for `GET /applications`

**Checkpoint**: Applications CRUD independently functional; tests passing

---

## Phase 4: User Story 2 — Interview Stages CRUD (Priority: P2)

**Goal**: Manage interview stages linked to applications

**Independent Test**: Contract and integration tests validate stages independently (given an existing application)

### Tests (requested)

- [x] T027 [P] [US2] Contract tests for `/applications/{id}/interview-stages` in `api/tests/contract/stages.contract.test.ts`
- [x] T028 [P] [US2] Integration tests for stage workflow in `api/tests/integration/stages.integration.test.ts`

### Implementation

- [x] T029 [P] [US2] Implement zod DTOs in `api/src/types/stages.dto.ts`
- [x] T030 [P] [US2] Implement `InterviewStage` service in `api/src/services/stages.service.ts`
- [x] T031 [US2] Implement router in `api/src/routes/interview-stages.ts` (create, patch, delete)
- [x] T032 [US2] Wire stage routes nested under application in `api/src/index.ts`
- [x] T033 [US2] Cascade delete stages when application is deleted (service logic)
- [x] T034 [US2] Seed sample stages in `api/src/db/seed.ts`

**Checkpoint**: Interview stages independently functional; tests passing

---

## Phase 5: User Story 3 — Health & Observability (Priority: P3)

**Goal**: Provide health endpoint and basic logging

**Independent Test**: `/health` returns 200; logger outputs request info

### Tests (requested)

- [x] T035 [P] [US3] Contract test for `/health` in `api/tests/contract/health.contract.test.ts`

### Implementation

- [x] T036 [P] [US3] Implement `/health` route in `api/src/index.ts`
- [x] T037 [US3] Ensure logger middleware applied globally

**Checkpoint**: Health and logging work independently

---

## Phase N: Polish & Cross-Cutting Concerns

- [ ] T038 [P] Documentation updates: `specs/003-express-api-prisma/quickstart.md` and README
- [ ] T039 Code cleanup and refactoring (services/middleware)
- [ ] T040 Performance optimizations (indexes, query patterns)
- [ ] T041 [P] Additional unit tests in `api/tests/unit/`
- [ ] T042 Security hardening (rate limiting, input sanitization)
- [ ] T043 Validate quickstart by running end-to-end with Docker Compose
- [x] T044 [P] Add `api/scripts/load-test.k6.js` using k6 with thresholds for p95 read ≤ 200ms and write ≤ 500ms
- [x] T045 [P] Configure k6 thresholds to fail test if performance budgets exceeded
- [x] T046 Integrate `npm run perf:check` in `api/package.json` to run k6 script and validate gates
- [ ] T047 Add CI step to run `npm run perf:check` against compose stack in `.github/workflows/api.yml`
- [ ] T048 Document performance budgets and usage in `specs/003-express-api-prisma/quickstart.md`
- [ ] T049 Note in `specs/003-express-api-prisma/plan.md` Constitution Check: Performance Gate validated via perf:check

---

## Test & Tooling Setup (API)

- [x] T055 [P] Create `api/jest.config.ts` and `api/jest.setup.ts` (ts-jest, test env)
- [x] T056 [P] Scaffold `api/tests/contract/`, `api/tests/integration/`, and `api/tests/utils/server.ts` (Supertest)
- [x] T057 Update `api/package.json` test scripts and devDependencies (jest, ts-jest, supertest, @types/jest)

---

## Serialization Consistency

- [x] T058 [P] Normalize DateTime fields to ISO 8601 strings in API response mappers (createdAt, updatedAt, dateApplied, offerDueDate, completedDate)
- [x] T059 [P] Ensure OpenAPI marks date fields with `format: date-time` and document ISO serialization in spec

---

## Dependencies & Execution Order

### Phase Dependencies
- Setup → Foundational → User Stories → Polish
- Foundational blocks all user stories

### User Story Completion Order
- P1: Applications CRUD (US1)
- P2: Interview Stages CRUD (US2)
- P3: Health & Observability (US3)

### Parallel Opportunities
- [P] tasks within Setup and Foundational can run concurrently
- After Foundational, US1 and US2 can proceed in parallel (different files)
- Tests marked [P] within each story can be authored/run in parallel
- DTOs and services within a story marked [P] can be built concurrently

---

## Implementation Strategy

- MVP: Complete US1 after Setup + Foundational; validate independently
- Incremental: Add US2 next; validate independently; then US3
- Each story remains testable in isolation and deliverable without breaking others
