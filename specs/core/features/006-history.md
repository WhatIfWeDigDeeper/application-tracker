# Feature: Application History

Track how an application has changed over time and optionally restore to a previous state.

**Priority**: P2 (Important)

---

## Overview

As users update applications throughout their job search, they need visibility into what changed and when. Every mutation (create, update, status change) creates a snapshot capturing the full application state at that moment. Users can browse a timeline of changes, inspect field-level diffs, and restore to any previous version.

---

## User Stories

### US-6.1: View Change History

**As a** job seeker
**I want to** see a timeline of changes to an application
**So that** I can understand how my application has evolved

#### Acceptance Criteria

1. **Given** I am viewing an application
   **When** I open the history panel
   **Then** I see a timeline of all past changes, newest first

2. **Given** I am viewing the history panel
   **When** I look at an entry
   **Then** I see a human-readable description and a relative timestamp (e.g., "2 hours ago")

3. **Given** I am viewing the history panel
   **When** the panel opens
   **Then** it slides in from the right side of the screen

---

### US-6.2: View Field-Level Diffs

**As a** job seeker
**I want to** see exactly what changed in each update
**So that** I can review specific modifications

#### Acceptance Criteria

1. **Given** I am viewing the history panel
   **When** I click on a history entry
   **Then** it expands to show field-level diffs

2. **Given** I am viewing an expanded history entry
   **When** fields have changed
   **Then** old values are shown struck-through/red and new values in green

3. **Given** I am viewing an expanded history entry
   **When** the diff is computed
   **Then** only changed fields are shown (unchanged fields are hidden)

4. **Given** the first history entry (initial creation)
   **When** I expand it
   **Then** no diffs are shown (there is no previous snapshot to compare against)

---

### US-6.3: Restore to Previous Version

**As a** job seeker
**I want to** revert an application to a previous state
**So that** I can undo unwanted changes

#### Acceptance Criteria

1. **Given** I am viewing a non-current history entry
   **When** I look at its actions
   **Then** I see a "Restore to this point" button

2. **Given** I click "Restore to this point"
   **When** I confirm the action
   **Then** the application is updated to match that snapshot's state

3. **Given** I have restored to a previous version
   **When** the restore completes
   **Then** a new history entry is created with the description "Restored to version N"

4. **Given** I am viewing the most recent (current) history entry
   **When** I look at its actions
   **Then** there is no restore button (already at this version)

---

## Behaviors

### Record Snapshot

```
Input: { applicationId, description }
Process:
  1. Load current application state (all fields + interview stages)
  2. Capture full state as a JSON snapshot
  3. Generate human-readable description (e.g., "Status changed to Interviewing")
  4. Persist as ApplicationSnapshot with:
     - snapshotId (generated)
     - applicationId
     - data (full application state)
     - description
     - createdAt (now)
Output: Created snapshot
```

### Compute Diffs

```
Input: { currentSnapshot, previousSnapshot }
Process:
  1. If previousSnapshot is null, return empty diffs (first entry)
  2. Compare each field in currentSnapshot.data vs previousSnapshot.data
  3. For each field where values differ:
     - Record { field, oldValue, newValue }
  4. Ignore metadata fields (updatedAt, id)
Output: Array of { field, oldValue, newValue }
```

### Restore Version

```
Input: { applicationId, snapshotId }
Process:
  1. Find application (error if not found)
  2. Find snapshot (error if not found or wrong application)
  3. Load snapshot data
  4. Compare snapshot data to current application state
  5. If identical, return current application (no-op)
  6. Write snapshot field values back to application
  7. Sync interview stages (delete removed, add new, update changed)
  8. Record new snapshot with description "Restored to version N"
Output: Updated application
```

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| First snapshot (creation) | No diffs available; description is "Application created" |
| Restore with changed interview stages | Stages are fully replaced with snapshot's stage data |
| Delete application | All history snapshots cascade-deleted |
| Concurrent edits | Last write wins; both edits produce separate snapshots |
| Restore to current state | No-op; no new snapshot created |
| Snapshot references deleted stage | Stage is recreated from snapshot data on restore |
| Very long history | Paginate or lazy-load entries; newest first |

---

## Display Requirements

### History Panel

- Slide-in panel from the right side
- Timeline layout with entries listed newest-first
- Each entry shows: description, relative timestamp
- Expandable entries to reveal field-level diffs
- Close button to dismiss panel

### Diff Display

- Changed fields shown as labeled rows
- Old value: struck-through text, red/muted styling
- New value: green/highlighted styling
- Only changed fields displayed

### Restore Controls

- "Restore to this point" button on non-current entries
- Confirmation dialog before restore
- Success notification after restore completes

---

## API Operations

| Operation | Method | Endpoint | Request | Response |
|-----------|--------|----------|---------|----------|
| Get History | GET | /applications/{id}/history | - | Array of HistoryEntry |
| Restore Version | POST | /applications/{id}/history/{historyId}/restore | - | Updated application |

Note: Snapshots are created automatically by the server on every mutation. There is no explicit "create snapshot" endpoint.

See [openapi.yaml](../api/openapi.yaml) for full API specification.
