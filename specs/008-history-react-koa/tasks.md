---
description: "Task list for Application History & Restore (React + Koa/Raw SQL)"
---

# Tasks: Application History & Restore (React + Koa/Raw SQL)

**Input**: Design documents from `/specs/008-history-react-koa/`
**Specification**: [spec.md](spec.md) (3 user stories, all P1)
**Project**: Koa + Raw SQL (backend), React 19 + React Router (frontend)

**Organization**: Tasks grouped by phase. Backend and frontend phases can run in parallel.

## Dependencies & Execution Order

- Phase 1 (Foundation) is blocking — must complete before Phase 2
- Phase 2A (Backend) and Phase 2B (Frontend) can run in parallel
- Phase 3 (Validation) requires both 2A and 2B complete

---

## Phase 1: Foundation (Sequential)

**Purpose**: Database schema

- [ ] T001 Add `application_history` table DDL to `koa-api/src/db/schema.sql`
- [ ] T002 Apply schema to database (via init script or psql)

**Checkpoint**: Schema deployed, existing build passes

---

## Phase 2A: Backend (Parallelizable with 2B)

**Purpose**: History service, wiring, and API routes

- [ ] T003 Create `koa-api/src/services/history.service.ts` with `captureSnapshot`, `recordHistory`, `getNextSequence`
- [ ] T004 Add `listHistory(appId, page, limit)` with field-level diff computation
- [ ] T005 Add `restoreToVersion(appId, targetSequence)` with snapshot restore logic
- [ ] T006 Add `computeFieldDiffs(before, after)` and `buildDescription(action, details?)` helpers
- [ ] T007 Wire `recordHistory` into `applications.service.ts` (create, update, delete, archive, restore)
- [ ] T008 Wire `recordHistory` into `stages.service.ts` (create, update, delete)
- [ ] T009 Add history Zod schemas and TypeScript types to `koa-api/src/types/index.ts`
- [ ] T010 Add `GET /:id/history` and `POST /:id/history/restore` routes

**Checkpoint**: Backend compiles, history API functional

---

## Phase 2B: Frontend (Parallelizable with 2A)

**Purpose**: UI components and integration

- [ ] T011 Add `FieldChange`, `HistoryEntry`, `PaginatedHistoryResponse` types to `react-ui/src/types/application.ts`
- [ ] T012 Add `getHistory` and `restoreToVersion` functions to `react-ui/src/services/api.ts`
- [ ] T013 Create `react-ui/src/components/applications/FieldDiff.tsx` component
- [ ] T014 Create `react-ui/src/components/applications/HistoryPanel.tsx` component
- [ ] T015 Add "History" button and `HistoryPanel` integration to `ApplicationEdit.tsx`

**Checkpoint**: Frontend compiles, history UI renders

---

## Phase 3: Validation (Sequential)

**Purpose**: Verify everything builds and tests pass

- [ ] T016 Run `cd koa-api && npm run build` — TypeScript compiles
- [ ] T017 Run `cd koa-api && npm run lint` — passes
- [ ] T018 Run `cd react-ui && npm run build` — React compiles
- [ ] T019 Run `cd react-ui && npm run lint` — passes
- [ ] T020 Remove `--grep-invert 'History Panel'` from `test:e2e:react-koa` in `package.json`

**Checkpoint**: No regressions introduced, feature complete

---

## Summary

**Total Tasks**: 20
**Phases**:
- Phase 1 (Foundation): 2 tasks — sequential
- Phase 2A (Backend): 8 tasks — parallel with 2B
- Phase 2B (Frontend): 5 tasks — parallel with 2A
- Phase 3 (Validation): 5 tasks — sequential

**Parallel Opportunities**:
- Phase 2A and 2B touch completely different directories (`koa-api/` vs `react-ui/`) — no conflicts
