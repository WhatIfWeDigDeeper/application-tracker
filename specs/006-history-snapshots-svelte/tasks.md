---
description: "Task list for Application History & Restore (Svelte + Hono)"
---

# Tasks: Application History & Restore (Svelte + Hono)

**Input**: Design documents from `/specs/006-history-snapshots-svelte/`
**Specification**: [spec.md](spec.md) (3 user stories, all P1)
**Project**: Hono + Drizzle (backend), SvelteKit + Svelte 5 (frontend)

**Organization**: Tasks grouped by phase. Backend and frontend phases can run in parallel.

## Dependencies & Execution Order

- Phase 1 (Foundation) is blocking — must complete before Phase 2
- Phase 2A (Backend) and Phase 2B (Frontend) can run in parallel
- Phase 3 (Integration) requires both 2A and 2B complete
- Phase 4 (E2E Tests) requires Phase 3 complete

---

## Phase 1: Foundation (Sequential)

**Purpose**: Database schema and shared utilities

- [ ] T001 Add `applicationHistory` table to `hono-api/src/db/schema.ts` with relations and type exports
- [ ] T002 Run `drizzle-kit generate` and `drizzle-kit push` to create and apply migration
- [ ] T003 Extract `toApplicationResponse`, `formatDate`, `formatDateTime` to `hono-api/src/services/shared.ts`
- [ ] T004 Update `application.service.ts` and `interview-stage.service.ts` to import from shared

**Checkpoint**: Schema deployed, shared utils extracted, existing build passes

---

## Phase 2A: Backend (Parallelizable with 2B)

**Purpose**: History service, wiring, and API routes

- [ ] T005 Create `hono-api/src/services/history.service.ts` with `captureSnapshot`, `recordHistory`, `getNextSequence`
- [ ] T006 Add `listHistory(appId, page, limit)` with field-level diff computation
- [ ] T007 Add `restoreToVersion(appId, targetSequence)` with snapshot restore logic
- [ ] T008 Add `computeFieldDiffs(before, after)` and `buildDescription(action, details?)` helpers
- [ ] T009 Wire `recordHistory` into `application.service.ts` (create, update, delete, archive, restore)
- [ ] T010 Wire `recordHistory` into `interview-stage.service.ts` (create, update, delete)
- [ ] T011 Add `FieldChangeSchema`, `HistoryEntrySchema`, `PaginatedHistorySchema` to `hono-api/src/types/api.ts`
- [ ] T012 Add `GET /:id/history` and `POST /:id/history/restore` routes to `hono-api/src/routes/applications.ts`

**Checkpoint**: Backend compiles, history API functional

---

## Phase 2B: Frontend (Parallelizable with 2A)

**Purpose**: UI components and integration

- [ ] T013 Add `FieldChange`, `HistoryEntry`, `PaginatedHistoryResponse` types to `svelte-ui/src/lib/types/index.ts`
- [ ] T014 Add `getHistory` and `restoreToVersion` methods to `svelte-ui/src/lib/stores/api.ts`
- [ ] T015 Create `svelte-ui/src/lib/components/FieldDiff.svelte` component
- [ ] T016 Create `svelte-ui/src/lib/components/HistoryPanel.svelte` component
- [ ] T017 Add "History" button and `HistoryPanel` integration to `ApplicationEdit.svelte`

**Checkpoint**: Frontend compiles, history UI renders

---

## Phase 3: Validation (Sequential)

**Purpose**: Verify everything builds and existing tests pass

- [ ] T018 Run `cd hono-api && npm run build` — TypeScript compiles
- [ ] T019 Run `cd hono-api && npm run lint` — passes
- [ ] T020 Run `cd svelte-ui && npm run build && npm run check` — Svelte compiles + type checks
- [ ] T021 Run `cd svelte-ui && npm run lint` — passes
- [ ] T022 Run existing shared E2E tests (`npm run test:e2e:svelte`) — 13 tests pass

**Checkpoint**: No regressions introduced

---

## Phase 4: E2E Tests (Sequential)

**Purpose**: Add and run history-specific E2E tests

- [ ] T023 Add `test.describe.serial('History Panel - Svelte Snapshots', ...)` to `tests/e2e/history.spec.ts`
- [ ] T024 Update `package.json` `test:e2e:svelte` grep pattern from `'History Panel'` to `'Vue Event Sourcing'`
- [ ] T025 Run history E2E tests and fix any failures

**Checkpoint**: All E2E tests pass, feature complete

---

## Summary

**Total Tasks**: 25
**Phases**:
- Phase 1 (Foundation): 4 tasks — sequential
- Phase 2A (Backend): 8 tasks — parallel with 2B
- Phase 2B (Frontend): 5 tasks — parallel with 2A
- Phase 3 (Validation): 5 tasks — sequential
- Phase 4 (E2E Tests): 3 tasks — sequential

**Parallel Opportunities**:
- Phase 2A and 2B touch completely different directories (`hono-api/` vs `svelte-ui/`) — no conflicts
