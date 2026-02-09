# Event Sourcing with Undo/Redo: Immer + Pinia Implementation Plan

## Context

Adding server-persisted event sourcing with undo/redo to the vue-ui + nuxt-api implementation using Immer patches and Pinia stores. Events are per-application, snapshots every 50 commits, and the full history is server-side so it survives cache clears and works cross-device.

## Execution Strategy: Agent Teams (3 teammates)

After Phase 0 (sequential setup), launch an agent team:
1. **Backend engineer** - DB schema, event service, API routes, backend tests
2. **Frontend engineer** - Pinia + Immer stores, history UI, undo/redo, frontend tests
3. **Architect** - Reviews both tracks, validates event format consistency, catches mismatches

The backend and frontend tracks touch completely different files (no merge conflicts).

---

## Phase 0: Foundation (Sequential, before agent team)

### 0.1 Install dependencies

```bash
cd vue-ui && npm install pinia immer
cd nuxt-api && npm install immer  # needed for server-side patch replay in restore
```

### 0.2 Add shared event sourcing types

**File:** `nuxt-api/shared/types.ts` - append after existing types

```typescript
// --- Event Sourcing Types ---

// Mirror of Immer's Patch type (so backend doesn't import immer for types)
export interface ImmerPatch {
  op: 'replace' | 'add' | 'remove';
  path: (string | number)[];
  value?: unknown;
}

export interface FieldChange {
  field: string;
  label: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface ApplicationEvent {
  id: string;
  applicationId: string;
  sequence: number;
  description: string;
  changes: FieldChange[];
  patches: ImmerPatch[];
  inversePatches: ImmerPatch[];
  createdAt: string;
}

export interface ApplicationSnapshot {
  id: string;
  applicationId: string;
  atSequence: number;
  state: Application;
  createdAt: string;
}
```

### 0.3 Register Pinia + enable Immer patches

**File:** `vue-ui/src/main.ts`

```typescript
import { createPinia } from 'pinia';
import { enablePatches } from 'immer';

enablePatches();

const pinia = createPinia();
app.use(pinia);
app.use(router);
```

---

## Phase 1A: Backend Track

### B1. Drizzle schema - new tables

**File:** `nuxt-api/server/db/schema.ts`

Add `application_events` and `application_snapshots` tables to the `vueNuxtSchema`:

- **application_events**: `id` (uuid PK), `application_id` (FK cascade), `sequence` (int), `description` (varchar 500), `changes` (jsonb), `patches` (jsonb), `inverse_patches` (jsonb), `created_at` (timestamptz)
  - Unique constraint on `(application_id, sequence)`
- **application_snapshots**: `id` (uuid PK), `application_id` (FK cascade), `at_sequence` (int), `state` (jsonb), `created_at` (timestamptz)
  - Unique constraint on `(application_id, at_sequence)`

Add relations connecting both back to `applications`.

Import `jsonb` from `drizzle-orm/pg-core` (already imported: `uuid`, `varchar`, `text`, `integer`, `boolean`, `date`, `timestamp`).

### B2. Generate + run migration

```bash
cd nuxt-api && npx drizzle-kit generate && npx drizzle-kit migrate
```

### B3. Event service

**New file:** `nuxt-api/server/services/event.service.ts`

Core functions:
- `appendEvent(applicationId, description, changes, patches, inversePatches)` - calculates next sequence (`MAX(sequence)+1` or 1), inserts event, triggers snapshot at multiples of 50
- `createSnapshot(applicationId, atSequence)` - fetches current app state via `getApplication()`, stores as JSONB
- `listEvents(applicationId, page, limit)` - paginated, ordered by sequence DESC
- `getLatestSnapshot(applicationId, beforeSequence?)` - most recent snapshot at or before given sequence
- `restoreToEvent(applicationId, targetSequence)` - finds nearest snapshot, replays forward patches using Immer `applyPatches`, updates the applications table, records a "Restored to version N" event

Calls `enablePatches()` from immer at module level for the restore replay logic.

### B4. Validation schemas

**File:** `nuxt-api/server/utils/validation.ts` - append

- `AppendEventSchema` - validates description, changes array, patches array, inversePatches array
- `ListEventsQuerySchema` - page/limit with coercion and defaults
- `RestoreToEventSchema` - validates targetSequence (int >= 1)

### B5. API routes

Following existing Nuxt file-based routing patterns (see `[id].patch.ts`, `[id]/archive.post.ts`):

| File | Method | Path | Handler |
|------|--------|------|---------|
| `nuxt-api/server/api/applications/[id]/events/index.get.ts` | GET | `/api/applications/:id/events` | List events (paginated) |
| `nuxt-api/server/api/applications/[id]/events/index.post.ts` | POST | `/api/applications/:id/events` | Append event |
| `nuxt-api/server/api/applications/[id]/events/restore.post.ts` | POST | `/api/applications/:id/events/restore` | Restore to sequence |
| `nuxt-api/server/api/applications/[id]/snapshots/latest.get.ts` | GET | `/api/applications/:id/snapshots/latest` | Get latest snapshot |

### B6. Delete undo support

**New file:** `nuxt-api/server/api/applications/recreate.post.ts`

Accepts a full `Application` object (with `id` and `interviewStages[]`), recreates it with the same ID. Used exclusively for undoing deletes. Inserts the application row + all stage rows in a transaction.

### B7. Backend tests

**New file:** `nuxt-api/tests/event.service.test.ts`
- Sequence auto-increment per application
- Snapshot creation at multiples of 50
- Restore: find snapshot, replay patches, verify state
- Cascade delete of events/snapshots when application deleted

---

## Phase 1B: Frontend Track

### F1. Application detail Pinia store (replaces `useApplication` composable)

**New file:** `vue-ui/src/stores/applicationDetail.ts`

Uses `defineStore` with setup syntax. Key change: every mutation uses `produceWithPatches(toRaw(application.value), draft => ...)` to generate patches.

Pattern for each mutating action:
1. Capture `oldState = toRaw(application.value)`
2. Call the API (same as current composable)
3. Use `produceWithPatches(oldState, draft => { /* apply response */ })` to get `[nextState, patches, inversePatches]`
4. Set `application.value = nextState`
5. Generate `FieldChange[]` for human-readable diffs
6. If `!isUndoRedoInProgress`, call `eventService.append()` and `historyStore.addCommit()`

Exposes `isUndoRedoInProgress` flag for the history store to set during undo/redo.

**Critical**: Always `toRaw()` before Immer. Always reset `isUndoRedoInProgress` in `finally` blocks.

### F2. Applications list Pinia store (replaces `useApplications` composable)

**New file:** `vue-ui/src/stores/applicationsList.ts`

Straightforward port of `useApplications()` composable to Pinia setup store. The list store does NOT need Immer patches - it's a read view that refetches from the API. Only `createApplication` records an initial creation event.

### F3. History store

**New file:** `vue-ui/src/stores/history.ts`

```typescript
defineStore('history', () => {
  // Per-application history keyed by applicationId
  commits: Map<string, Commit[]>
  cursors: Map<string, number>

  addCommit(appId, commit)     // push + truncate redo stack
  canUndo(appId): boolean      // cursor >= 0
  canRedo(appId): boolean      // cursor < commits.length - 1

  async undo(appId) {
    detailStore.isUndoRedoInProgress = true
    try {
      // Apply inverse patches via applyPatches(toRaw(state), commit.inversePatches)
      // Call API to sync the reverted state
      // Decrement cursor
    } finally {
      detailStore.isUndoRedoInProgress = false
    }
  }

  async redo(appId) { /* mirror of undo with forward patches */ }

  async loadHistory(appId) { /* fetch from GET /events, populate commits */ }
})
```

### F4. Event API service

**File:** `vue-ui/src/services/api.ts` - add `eventService` object

- `list(appId, page, limit)` - GET events
- `append(appId, { description, changes, patches, inversePatches })` - POST event
- `restore(appId, targetSequence)` - POST restore
- `getLatestSnapshot(appId, beforeSequence?)` - GET snapshot

### F5. Event description utilities

**New file:** `vue-ui/src/utils/eventDescriptions.ts`

- `FIELD_LABELS` map: `companyName` -> `"Company Name"`, etc.
- `generateFieldChanges(oldState, newState, changedKeys)` -> `FieldChange[]`
- `generateDescription(action, context)` -> human-readable string like "Updated status from 'Applied' to 'Interviewing'"

### F6. Update components to use Pinia stores

**File:** `vue-ui/src/views/ApplicationDetail.vue`
- Replace `useApplication()` with `useApplicationDetailStore()` + `storeToRefs()`
- Add undo/redo keyboard listeners (`Ctrl+Z` / `Ctrl+Shift+Z`, `Cmd` on Mac)
- Add history panel toggle button
- Add `UndoRedoBar` component

**File:** `vue-ui/src/views/ApplicationList.vue`
- Replace `useApplications()` with `useApplicationsListStore()` + `storeToRefs()`
- Remove `inject('refreshTrigger')` - use store reactivity instead

**File:** `vue-ui/src/App.vue`
- Remove `provide('refreshTrigger')` pattern
- Use list store directly for post-creation refresh

**File:** `vue-ui/src/components/ApplicationFormModal.vue`
- Edit mode: call `detailStore.updateApplication()` instead of `applicationService.update()`
- Create mode: call `listStore.createApplication()` instead of `applicationService.create()`

### F7. History UI components

**New file:** `vue-ui/src/components/HistoryPanel.vue`
- Slide-out panel on ApplicationDetail showing event timeline
- Each event: description, timestamp, expandable field changes
- "Restore to this point" button per event
- Paginated loading of older events

**New file:** `vue-ui/src/components/EventDiff.vue`
- Renders a single event's `FieldChange[]` as old (red) / new (green) values
- Special rendering for status (badges), dates, ratings

**New file:** `vue-ui/src/components/UndoRedoBar.vue`
- Floating toolbar: undo button, redo button (disabled states via `canUndo`/`canRedo`)
- Shows last action description
- Keyboard shortcut hints

### F8. Special cases

**Delete undo**: Before deleting, capture full application state. Store it as the commit's metadata. On undo, call `POST /api/applications/recreate` with the saved state. Only available immediately (not after navigation).

**Create undo**: Undoing a create calls `DELETE /api/applications/:id`.

**Interview stages**: `produceWithPatches` operates on the full `Application` (including nested `interviewStages[]`). Stage mutations produce patches with paths like `["interviewStages", 2, "isCompleted"]`.

### F9. Frontend tests

- `vue-ui/src/stores/__tests__/applicationDetail.test.ts` - patches generated correctly, events not recorded during undo/redo
- `vue-ui/src/stores/__tests__/history.test.ts` - cursor management, redo truncation, canUndo/canRedo
- `vue-ui/src/utils/__tests__/eventDescriptions.test.ts` - field change generation, description strings
- `vue-ui/src/components/__tests__/HistoryPanel.test.ts` - event list rendering, restore interaction

---

## Phase 2: Integration (Sequential, after agent team merges)

### 2.1 Delete old composables

- Delete `vue-ui/src/composables/useApplication.ts`
- Delete `vue-ui/src/composables/useApplications.ts`
- Keep `vue-ui/src/composables/useDarkMode.ts` (unrelated)

### 2.2 Integration testing

1. Create application -> verify event in `application_events` table
2. Update fields -> verify patches and inverse patches stored
3. Add/update/delete interview stage -> verify events
4. Ctrl+Z -> verify undo: UI reverts, API syncs, undo event recorded
5. Ctrl+Shift+Z -> verify redo
6. Make 50+ changes -> verify snapshot created
7. Open history panel -> verify events listed with diffs
8. Click "Restore to version N" -> verify state reconstructed
9. Clear browser, reload -> verify history loads from server

### 2.3 Validation chain

```bash
cd vue-ui && npm run build && npm run lint && npm test
cd nuxt-api && npm run build && npm run lint
```

---

## Files Summary

### New files (17)
| File | Owner |
|------|-------|
| `nuxt-api/server/services/event.service.ts` | Backend |
| `nuxt-api/server/api/applications/[id]/events/index.get.ts` | Backend |
| `nuxt-api/server/api/applications/[id]/events/index.post.ts` | Backend |
| `nuxt-api/server/api/applications/[id]/events/restore.post.ts` | Backend |
| `nuxt-api/server/api/applications/[id]/snapshots/latest.get.ts` | Backend |
| `nuxt-api/server/api/applications/recreate.post.ts` | Backend |
| `nuxt-api/tests/event.service.test.ts` | Backend |
| `vue-ui/src/stores/applicationDetail.ts` | Frontend |
| `vue-ui/src/stores/applicationsList.ts` | Frontend |
| `vue-ui/src/stores/history.ts` | Frontend |
| `vue-ui/src/utils/eventDescriptions.ts` | Frontend |
| `vue-ui/src/components/HistoryPanel.vue` | Frontend |
| `vue-ui/src/components/EventDiff.vue` | Frontend |
| `vue-ui/src/components/UndoRedoBar.vue` | Frontend |
| `vue-ui/src/stores/__tests__/applicationDetail.test.ts` | Frontend |
| `vue-ui/src/stores/__tests__/history.test.ts` | Frontend |
| `vue-ui/src/utils/__tests__/eventDescriptions.test.ts` | Frontend |

### Modified files (11)
| File | Owner | Change |
|------|-------|--------|
| `nuxt-api/shared/types.ts` | Phase 0 | Add event sourcing types |
| `nuxt-api/server/db/schema.ts` | Backend | Add 2 tables + relations |
| `nuxt-api/server/utils/validation.ts` | Backend | Add event validation schemas |
| `nuxt-api/package.json` | Phase 0 | Add immer |
| `vue-ui/package.json` | Phase 0 | Add pinia, immer |
| `vue-ui/src/main.ts` | Phase 0 | Register Pinia, enablePatches |
| `vue-ui/src/services/api.ts` | Frontend | Add eventService |
| `vue-ui/src/views/ApplicationDetail.vue` | Frontend | Use store, add undo/redo/history |
| `vue-ui/src/views/ApplicationList.vue` | Frontend | Use store |
| `vue-ui/src/App.vue` | Frontend | Remove provide/inject, use store |
| `vue-ui/src/components/ApplicationFormModal.vue` | Frontend | Use store methods |

### Deleted files (2, Phase 2)
- `vue-ui/src/composables/useApplication.ts`
- `vue-ui/src/composables/useApplications.ts`

---

## Key Design Decisions

1. **Frontend generates patches** - the frontend holds before/after state via Immer's `produceWithPatches`. Backend stores them as JSONB. Avoids double-reads on the backend.

2. **`applications` table stays as read-optimized source of truth** - no replay needed for normal reads. Events are an append-only audit log alongside it.

3. **Two API calls per mutation** (update + append event) - keeps existing endpoints backward-compatible. Could optimize later with middleware.

4. **Delete undo via recreate endpoint** - preserves destructive delete semantics while enabling undo. Full state captured before deletion.

5. **Per-application events** - not global. Each application has its own sequence counter and snapshot cadence.

6. **immer installed on backend too** - needed for `restoreToEvent()` to replay patches server-side. ~16KB, minimal footprint.
