---
description: "Task list for Nullable dateApplied feature"
---

# Tasks: Nullable dateApplied

**Input**: Design documents from `/specs/010-nullable-date-applied/`
**Specification**: [spec.md](./spec.md) (4 user stories, P1-P2 priorities)
**Project**: All 5 implementation stacks (nest+tanstack, express+next, koa+react, hono+svelte, nuxt+vue)

**Organization**: Tasks grouped by phase. Each stack's changes are independent and parallelizable within a phase.

## Format: `[ID] [P?] [Stack] Description`

- **[P]**: Can run in parallel with other [P] tasks in the same phase
- **[Stack]**: Which implementation stack (nest, express, koa, hono, nuxt, all)

## Dependencies & Execution Order

- Phase 1 (DB) must complete before Phase 2 (Backend)
- Phase 2 (Backend) must complete before Phase 3 (Frontend)
- Within each phase, all 5 stacks can run in parallel
- Phase 4 (Validation) runs per-stack after that stack's Phase 3 is done

**Note**: The express+next stack already has `dateApplied` as nullable (`DateTime?` in Prisma). Its Phase 1 task is a no-op, and Phase 2 only needs to verify no default is applied.

---

## Phase 1: Database Schema Changes

**Purpose**: Make `date_applied` column nullable in all 5 schemas

- [ ] T001 [P] [nest] Remove `.notNull()` from `dateApplied` in `nest-api/src/database/schema.ts` (line 55), run `drizzle-kit push` to `react_nestjs` schema
- [ ] T002 [P] [express] No schema change needed — `api/prisma/schema.prisma` already has `dateApplied DateTime?` (line 14). Verify no migration required.
- [ ] T003 [P] [koa] In `koa-api/src/db/schema.sql` (line 63), change `date_applied DATE NOT NULL DEFAULT CURRENT_DATE` to `date_applied DATE DEFAULT NULL`. Run migration against `react_koa` schema.
- [ ] T004 [P] [hono] Remove `.notNull()` from `dateApplied` in `hono-api/src/db/schema.ts` (line 55), run `drizzle-kit push` to `svelte_hono` schema
- [ ] T005 [P] [nuxt] Remove `.notNull()` from `dateApplied` in `nuxt-api/server/db/schema.ts` (line 56), run `drizzle-kit push` to `vue_nuxt` schema

**Checkpoint**: All 5 DB schemas accept null `date_applied`

---

## Phase 2: Backend Service Changes

**Purpose**: Remove auto-defaulting of dateApplied to today in create handlers

- [ ] T006 [P] [nest] In `nest-api/src/applications/applications.service.ts` (line 114), remove `const dateApplied = input.dateApplied || new Date().toISOString().split('T')[0]` — pass `input.dateApplied` directly (null/undefined when omitted). Update the insert to use `input.dateApplied || null`.
- [ ] T007 [P] [express] In `api/src/services/applications.service.ts`, verify `createApplication` does NOT default dateApplied. Already correct — passes through `prepareDateFields(input)` which only converts if present. No change needed.
- [ ] T008 [P] [koa] In `koa-api/src/services/applications.service.ts` (line 237), remove `const dateApplied = input.dateApplied || now.toISOString().split("T")[0]` — pass `input.dateApplied || null` directly.
- [ ] T009 [P] [hono] In `hono-api/src/services/application.service.ts` (line 110), remove `const dateApplied = input.dateApplied || new Date().toISOString().split('T')[0]` — pass `input.dateApplied || null` directly.
- [ ] T010 [P] [nuxt] In `nuxt-api/server/services/application.service.ts` (line 139), remove `const dateApplied = input.dateApplied || new Date().toISOString().split('T')[0]` — pass `input.dateApplied || null` directly.

**Checkpoint**: All 5 APIs create applications with null dateApplied when omitted

---

## Phase 3: Frontend Changes

**Purpose**: Stop pre-filling dateApplied and handle null display

### 3a: Form Components (stop pre-filling)

- [ ] T011 [P] [tanstack] In `tanstack-ui/src/components/applications/ApplicationEdit.tsx` (line 59), change `dateApplied: getTodayDate()` to `dateApplied: ''` for new application initial state
- [ ] T012 [P] [next] In `ui/src/components/applications/ApplicationEdit.tsx` (line 70), change `dateApplied: getCurrentDateISO()` to `dateApplied: ''`. In `ui/src/components/applications/ApplicationForm.tsx` (lines 107-108), remove auto-fill of dateApplied when status changes to `applied`
- [ ] T013 [P] [react] In `react-ui/src/components/applications/ApplicationEdit.tsx` (line 56), change `dateApplied: getTodayDate()` to `dateApplied: ''`. Also in `react-ui/src/components/applications/ApplicationForm.tsx` (line 59), change `dateApplied: getTodayDate()` to `dateApplied: ''`
- [ ] T014 [P] [svelte] In `svelte-ui/src/lib/components/ApplicationForm.svelte` (line 17), change default from `new Date().toISOString().split('T')[0]` to `''`. In `svelte-ui/src/lib/components/ApplicationEdit.svelte` (line 479), remove the line that sets `dateApplied = new Date().toISOString().split('T')[0]` in create mode
- [ ] T015 [P] [vue] In `vue-ui/src/views/ApplicationEdit.vue` (line 505), remove the line that sets `dateApplied.value = new Date().toISOString().split('T')[0]` in create mode

### 3b: Display Components (handle null dateApplied)

- [ ] T016 [P] [tanstack] In `tanstack-ui/src/components/applications/ApplicationCard.tsx` (line 61), wrap the "Applied:" display to show "—" when `dateApplied` is null. The `formatDate` helper in `tanstack-ui/src/lib/utils.ts` already returns `""` for falsy — update to return `"—"` instead.
- [ ] T017 [P] [next] In `ui/src/components/applications/ApplicationCard.tsx` (line 71), handle null dateApplied. The `formatDate` in `ui/src/lib/utils.ts` (line 17) already returns `''` for falsy — update to return `"—"`. Also update `ui/src/components/applications/ApplicationDetail.tsx` (line 149).
- [ ] T018 [P] [react] In `react-ui/src/components/applications/ApplicationCard.tsx` (line 61), handle null dateApplied. Update `formatDate` in `react-ui/src/lib/utils.ts` to return `"—"` for falsy. Also update `react-ui/src/components/applications/ApplicationDetail.tsx` (line 194).
- [ ] T019 [P] [svelte] In `svelte-ui/src/lib/components/ApplicationCard.svelte` (line 30), update `formatDate` to accept `string | null` and return `"—"` for null. Usage at line 115. Also update `svelte-ui/src/lib/components/ApplicationDetail.svelte` (line 24) similarly.
- [ ] T020 [P] [vue] In `vue-ui/src/components/ApplicationCard.vue` (line 53), update `formatDate` to accept `string | null` and return `"—"` for null. Usage at line 153.

### 3c: Type Definitions (make dateApplied nullable)

- [ ] T021 [P] [tanstack] Update `dateApplied` type from `string` to `string | null` in tanstack-ui application types
- [ ] T022 [P] [next] Verify `dateApplied` is already typed as nullable in Next.js types (Prisma `DateTime?` → nullable)
- [ ] T023 [P] [react] Update `dateApplied` type from `string` to `string | null` in react-ui application types
- [ ] T024 [P] [svelte] Update `dateApplied` type from `string` to `string | null` in svelte-ui application types
- [ ] T025 [P] [vue] Update `dateApplied` type from `string` to `string | null` in vue-ui application types (shared via `@shared` alias)

**Checkpoint**: All 5 UIs create apps without date pre-fill and display "—" for null dates

---

## Phase 4: Sort Handling

**Purpose**: Ensure null dates sort last when sorting by dateApplied

- [ ] T026 [P] [nest] Update `listApplications` in `nest-api/src/applications/applications.service.ts` — when sorting by `dateApplied`, use `NULLS LAST` in the ORDER BY clause
- [ ] T027 [P] [express] Update list query in `api/src/services/applications.service.ts` — add `NULLS LAST` for dateApplied sort
- [ ] T028 [P] [koa] Update list query in `koa-api/src/services/applications.service.ts` — add `NULLS LAST` for dateApplied sort
- [ ] T029 [P] [hono] Update list query in `hono-api/src/services/application.service.ts` — add `NULLS LAST` for dateApplied sort
- [ ] T030 [P] [nuxt] Update list query in `nuxt-api/server/services/application.service.ts` — add `NULLS LAST` for dateApplied sort

**Checkpoint**: Null-date records appear last in all list views when sorted by dateApplied

---

## Phase 5: Validation & Testing

**Purpose**: Run full validation chain for each stack and update e2e tests

- [ ] T031 [P] [nest] Run `cd nest-api && npm run build && npm run lint && npm test`
- [ ] T032 [P] [tanstack] Run `cd tanstack-ui && npm run build && npm run lint && npm test`
- [ ] T033 [P] [express] Run `cd api && npm run build && npm run lint && npm test`
- [ ] T034 [P] [next] Run `cd ui && npm run build && npm run lint && npm test`
- [ ] T035 [P] [koa] Run `cd koa-api && npm run build && npm run lint && npm test`
- [ ] T036 [P] [react] Run `cd react-ui && npm run build && npm run lint && npm test`
- [ ] T037 [P] [hono] Run `cd hono-api && npm run build && npm run lint && npm test`
- [ ] T038 [P] [svelte] Run `cd svelte-ui && npm run build && npm run lint && npm test`
- [ ] T039 [P] [nuxt] Run `cd nuxt-api && npm run build && npm run lint && npm test`
- [ ] T040 [P] [vue] Run `cd vue-ui && npm run build && npm run lint && npm test`
- [ ] T041 [all] Update shared e2e tests in `tests/e2e/application-crud.spec.ts` — add a test case that creates an application without dateApplied and verifies it displays "—"
- [ ] T042 [P] [all] Run e2e tests for each stack (`npm run test:e2e`, `test:e2e:react-koa`, `test:e2e:vue`, `test:e2e:svelte`, `test:e2e:tanstack`)

---

## Summary

**Total Tasks**: 42
**Tasks per Phase**:
- Phase 1 (DB Schema): 5 tasks (all parallel)
- Phase 2 (Backend): 5 tasks (all parallel)
- Phase 3 (Frontend): 15 tasks (all parallel within subphase)
- Phase 4 (Sort): 5 tasks (all parallel)
- Phase 5 (Validation): 12 tasks (mostly parallel)

**Parallel Opportunities**: Within each phase, all 5 stacks can be worked on simultaneously. An agent team of 5 (one per stack) could complete Phases 1-4 in parallel, then converge for Phase 5.

**Special Cases**:
- express+next (Prisma): dateApplied is already nullable — Phase 1 T002 is a verification only, Phase 2 T007 is a verification only
- koa-api: Has `DEFAULT CURRENT_DATE` in SQL that must also be removed (T003)
- next.js ApplicationForm: Has conditional auto-fill on status change to "applied" (T012) that needs removal
