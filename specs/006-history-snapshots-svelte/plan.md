# Implementation Plan: Application History & Restore (Svelte + Hono)

**Branch**: `006-history-snapshots-svelte` | **Date**: 2026-02-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/006-history-snapshots-svelte/spec.md`

## Summary

Add snapshot-based application history and restore to the Hono + Drizzle backend and SvelteKit frontend. Each mutation captures the full application state as a JSONB snapshot. Field-level diffs are computed at read time by comparing adjacent snapshots. Users can view history in a sliding panel and restore to any previous version.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Hono, Drizzle ORM, Zod, SvelteKit, Svelte 5
**Storage**: PostgreSQL 18, `svelte_hono` schema
**Testing**: Playwright (E2E), Vitest (unit)
**No new dependencies required**

## Architecture

### Snapshot-Based History (vs. Vue-Nuxt Event Sourcing)

The vue-nuxt implementation uses Immer patches for deterministic undo/redo. This implementation takes a simpler approach:

| Aspect | Vue-Nuxt (Event Sourcing) | Svelte-Hono (Snapshots) |
|--------|---------------------------|-------------------------|
| Storage | Patches + inverse patches | Full state snapshots |
| Diffs | Stored as `FieldChange[]` | Computed at read time |
| Restore | Replay patches from nearest snapshot | Copy snapshot to DB |
| Undo/Redo | Yes (Ctrl+Z/Shift+Z) | No |
| Complexity | High (Immer, Pinia, cursor) | Low (service wrapper) |

### Database

New table `application_history` in `svelte_hono` schema:

```
id              uuid PK
application_id  uuid FK → applications(id) CASCADE
sequence        integer (monotonic per application)
description     varchar(500)
snapshot        jsonb (full ApplicationResponse)
created_at      timestamptz
```

### Service Layer Pattern

```
mutation request
  → recordHistory(appId, description)  // captures current state as snapshot
  → execute mutation
  → return response
```

For `createApplication`: record **after** (no "before" state exists).
For all other mutations: record **before** (snapshot = pre-change state).

### API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/applications/:id/history?page=1&limit=50` | List history entries with diffs |
| POST | `/applications/:id/history/restore` | Restore to `{ sequence: N }` |

### Frontend

- `HistoryPanel.svelte`: Fixed right-side sliding panel (w-96)
- `FieldDiff.svelte`: Old/new value display component
- Integration via "History" button in `ApplicationEdit.svelte`

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `hono-api/src/services/shared.ts` | Extracted `toApplicationResponse`, `formatDate`, `formatDateTime` |
| `hono-api/src/services/history.service.ts` | Core history logic (record, list, restore, diff) |
| `svelte-ui/src/lib/components/HistoryPanel.svelte` | History timeline panel |
| `svelte-ui/src/lib/components/FieldDiff.svelte` | Field change display |

### Modified Files
| File | Change |
|------|--------|
| `hono-api/src/db/schema.ts` | Add `applicationHistory` table + relations |
| `hono-api/src/types/api.ts` | Add history Zod schemas |
| `hono-api/src/routes/applications.ts` | Add GET history + POST restore routes |
| `hono-api/src/services/application.service.ts` | Add `recordHistory` calls, import from shared |
| `hono-api/src/services/interview-stage.service.ts` | Add `recordHistory` calls, import from shared |
| `svelte-ui/src/lib/types/index.ts` | Add history types |
| `svelte-ui/src/lib/stores/api.ts` | Add history API methods |
| `svelte-ui/src/lib/components/ApplicationEdit.svelte` | Add History button + panel |
| `tests/e2e/history.spec.ts` | Add Svelte history test block |
| `package.json` | Update e2e grep pattern |

## Execution Strategy

**Phase 1** (sequential): Schema + migration + shared utils extraction
**Phase 2** (parallel agents):
- Backend agent: history service, wiring into existing services, API routes
- Frontend agent: types, API client, HistoryPanel, FieldDiff, ApplicationEdit integration
**Phase 3** (sequential): Validation chain (build, lint, typecheck)
**Phase 4**: E2E tests

## Verification

1. `cd hono-api && npm run build && npm run lint`
2. `cd svelte-ui && npm run build && npm run check && npm run lint`
3. `npm run test:e2e:svelte` — existing 13 shared tests pass
4. `npm run test:e2e:svelte` — new history tests pass
5. Manual: create app → edit → open history → see entries → restore → verify
