---
description: "Task list for Unsubmitted Default Status feature"
---

# Tasks: Unsubmitted Default Status

**Input**: Design documents from `/specs/012-unsubmitted-status/`
**Specification**: [spec.md](./spec.md) (2 user stories, all P1)
**Depends on**: [011-csv-import-export](../011-csv-import-export/) must be completed first
**Scope**: All 5 implementation stacks

**Organization**: Tasks grouped by stack for parallel execution via subagents.

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel with other [P] tasks

## Dependencies & Execution Order

- Phase 1 (DB Migrations) → Phase 2 (Backend) → Phase 3 (Frontend) → Phase 4 (Tests)
- Agents 1-3 work in parallel, each covering different stacks
- Phase 5 (E2E + Validation) runs after all agents complete

---

## Phase 1: Database Migrations

**Purpose**: Add 'unsubmitted' to PostgreSQL ENUMs, change column defaults

- [ ] T001 [P] `react_koa` schema: ALTER TYPE to add 'unsubmitted', ALTER DEFAULT to 'unsubmitted' — `koa-api/src/db/schema.sql`
- [ ] T002 [P] `svelte_hono` schema: Add 'unsubmitted' to Drizzle pgEnum, change `.default('unsubmitted')` — `hono-api/src/db/schema.ts`
- [ ] T003 [P] `vue_nuxt` schema: Add 'unsubmitted' to Drizzle pgEnum, change `.default('unsubmitted')` — `nuxt-api/server/db/schema.ts`
- [ ] T004 [P] `react_nestjs` schema: Add 'unsubmitted' to Drizzle pgEnum, change `.default('unsubmitted')` — `nest-api/src/database/schema.ts`
- [ ] T005 Run SQL migration: `ALTER TYPE application_status ADD VALUE 'unsubmitted'` in react_koa, svelte_hono, vue_nuxt, react_nestjs schemas; update column defaults

**Checkpoint**: All 5 DB schemas include 'unsubmitted' as default

---

## Phase 2: Backend Types, Validation & Services

**Purpose**: Add 'unsubmitted' to Zod schemas, enforce date↔status constraint

- [ ] T006 [P] `koa-api/src/types/index.ts` — Add 'unsubmitted' to ApplicationStatusSchema
- [ ] T007 [P] `hono-api/src/types/api.ts` — Add 'unsubmitted' to ApplicationStatusSchema
- [ ] T008 [P] `nuxt-api/server/utils/validation.ts` — Add 'unsubmitted' to ApplicationStatusSchema
- [ ] T009 [P] `nest-api/src/types/api.ts` — Add 'unsubmitted' to ApplicationStatusSchema
- [ ] T010 `koa-api/src/services/applications.service.ts` — Change hardcoded 'applied' to 'unsubmitted' in INSERT; add date↔status enforcement in create+update
- [ ] T011 `hono-api/src/services/application.service.ts` — Add date↔status enforcement in create+update (default handled by schema)
- [ ] T012 `nuxt-api/server/services/application.service.ts` — Add date↔status enforcement in create+update
- [ ] T013 `nest-api/src/applications/applications.service.ts` — Add date↔status enforcement in create+update
- [ ] T014 `nest-api/src/applications/csv.service.ts` — Change `row.status ?? 'applied'` to `'unsubmitted'`
- [ ] T015 `api/src/services/applications.service.ts` — Add date↔status enforcement (already defaults to 'unsubmitted')

**Checkpoint**: All backends enforce 'unsubmitted' default and date constraint

---

## Phase 3: Frontend Types, Constants & UI

**Purpose**: Add 'unsubmitted' to frontend types, constants, colors; update form behavior

- [ ] T016 [P] `react-ui/src/types/application.ts` — Add 'unsubmitted' to ApplicationStatus union
- [ ] T017 [P] `tanstack-ui/src/types/application.ts` — Add 'unsubmitted' to ApplicationStatus union
- [ ] T018 [P] `svelte-ui/src/lib/types/index.ts` — Add 'unsubmitted' to union, ALL_STATUSES, STATUS_LABELS, STATUS_COLORS (gray)
- [ ] T019 [P] `nuxt-api/shared/types.ts` — Add 'unsubmitted' to union and APPLICATION_STATUSES constant
- [ ] T020 [P] `react-ui/src/lib/constants.ts` — Add status entry (first position) and gray STATUS_COLORS entry
- [ ] T021 [P] `tanstack-ui/src/lib/constants.ts` — Add status entry (first position) and gray STATUS_COLORS entry
- [ ] T022 `ui/tailwind.config.ts` — Add `unsubmitted: '#9CA3AF'` to status colors (bug fix)
- [ ] T023 `vue-ui/src/components/StatusBadge.vue` — Add 'unsubmitted' entry to statusConfig (gray classes)
- [ ] T024 `ui/src/components/applications/ApplicationEdit.tsx` — Change createDefaultFormState() status to 'unsubmitted'; disable dateApplied when unsubmitted; auto-fill date on status change
- [ ] T025 `react-ui` ApplicationEdit/ApplicationForm — Disable dateApplied when unsubmitted; auto-fill date on status change; default to 'unsubmitted'
- [ ] T026 `tanstack-ui` ApplicationEdit/ApplicationForm — Same as T025
- [ ] T027 `svelte-ui` ApplicationEdit.svelte — Change default status; disable dateApplied when unsubmitted; auto-fill date
- [ ] T028 `vue-ui` ApplicationEdit.vue — Change default status; disable dateApplied when unsubmitted; auto-fill date

**Checkpoint**: All 5 UIs show gray badge, disable date for unsubmitted, auto-fill on change

---

## Phase 4: Unit Tests

**Purpose**: Verify date↔status constraint in each backend

- [ ] T029 [P] Add unit test in each backend: creating application defaults to 'unsubmitted' with null dateApplied
- [ ] T030 [P] Add unit test in each backend: updating status to 'unsubmitted' clears dateApplied
- [ ] T031 [P] Add unit test in each backend: setting dateApplied while status is 'unsubmitted' results in null dateApplied

**Checkpoint**: Unit tests pass for all backends

---

## Phase 5: E2E Tests & Validation

**Purpose**: Update shared E2E tests, run full validation chain

- [ ] T032 `tests/e2e/application-crud.spec.ts` — Update "should have empty date applied and Applied status on create" test: expect 'unsubmitted', expect dateApplied input to be disabled
- [ ] T033 `tests/e2e/application-crud.spec.ts` — Add test: changing status from 'unsubmitted' enables date and auto-fills today
- [ ] T034 Run `npm run build` across all packages
- [ ] T035 Run `npm run lint` across all packages
- [ ] T036 Run `npm test` across all packages
- [ ] T037 Run E2E tests for at least one stack

---

## Summary

**Total Tasks**: 37
**Parallel Agent Assignment**:
- Agent 1: T015, T022, T024 (express_prisma: api/ + ui/)
- Agent 2: T001, T002, T006, T007, T010, T011, T016, T018, T020, T25, T27 (react_koa + svelte_hono)
- Agent 3: T003, T004, T008, T009, T012, T013, T014, T017, T019, T021, T23, T26, T28 (vue_nuxt + react_nestjs)
- Sequential: T005 (DB migration SQL), T029-T031 (unit tests), T032-T037 (E2E + validation)
