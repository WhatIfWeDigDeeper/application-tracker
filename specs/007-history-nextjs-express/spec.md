# Feature Specification: Application History & Restore (Next.js + Express/Prisma)

**Feature Branch**: `007-history-nextjs-express`
**Created**: 2026-02-15
**Status**: Complete
**Input**: Add version history and restore functionality to the Next.js+Express stack, using a snapshot-based approach matching the Hono implementation.

- [Context](#context)
- [User Scenarios & Testing](#user-scenarios--testing)
  - [User Story 1 - View Application History (Priority: P1)](#user-story-1---view-application-history-priority-p1)
  - [User Story 2 - View Field-Level Changes (Priority: P1)](#user-story-2---view-field-level-changes-priority-p1)
  - [User Story 3 - Restore to Previous Version (Priority: P1)](#user-story-3---restore-to-previous-version-priority-p1)
- [Requirements](#requirements)
  - [Functional Requirements](#functional-requirements)
  - [Technical Requirements](#technical-requirements)
- [Success Criteria](#success-criteria)

## Context

The svelte-hono implementation has snapshot-based history with Drizzle, and vue-nuxt uses event sourcing with Immer patches. This spec covers adding the same **snapshot-based** history feature to the Next.js + Express/Prisma stack.

**Scope**: History panel + restore only. No undo/redo keyboard shortcuts.

## User Scenarios & Testing

### User Story 1 - View Application History (Priority: P1)

As a user, I want to see a timeline of all changes made to an application so that I can understand its history.

**Acceptance Scenarios**:

1. **Given** I have created an application, **When** I click the "History" button on the edit page, **Then** a side panel opens showing a timeline with a "Created application" entry marked as "(current)".
2. **Given** I have edited an application multiple times, **When** I open the history panel, **Then** I see all changes listed newest-first with relative timestamps.
3. **Given** I have the history panel open, **When** I click the close button, **Then** the panel closes.
4. **Given** an application has no history entries, **When** I open the history panel, **Then** I see an appropriate empty state message.

### User Story 2 - View Field-Level Changes (Priority: P1)

As a user, I want to see exactly which fields changed in each history entry so that I can understand what was modified.

**Acceptance Scenarios**:

1. **Given** I am viewing the history panel, **When** I click on a history entry, **Then** it expands to show field-level changes (old value struck through in red, new value in green).
2. **Given** I updated the company name from "Acme" to "Acme Corp", **When** I expand that history entry, **Then** I see "Company Name: ~~Acme~~ Acme Corp".
3. **Given** I added an interview stage, **When** I expand that history entry, **Then** I see the interview stages change.
4. **Given** a history entry has no detected field changes, **When** I expand it, **Then** I see "No field changes recorded".

### User Story 3 - Restore to Previous Version (Priority: P1)

As a user, I want to restore an application to a previous version so that I can undo unwanted changes.

**Acceptance Scenarios**:

1. **Given** I am viewing a history entry that is not the current version, **When** I click "Restore to this point", **Then** the application is restored to that version's state and the form updates.
2. **Given** I restore to a previous version, **When** I view the history panel, **Then** I see a new "Restored to version N" entry as the newest entry.
3. **Given** I restore to a version that had different interview stages, **When** I view the application, **Then** the interview stages match the restored version.
4. **Given** I am viewing the newest (current) history entry, **Then** the "Restore to this point" button is not shown.

## Requirements

### Functional Requirements

1. **History Recording**: Automatically record a snapshot of application state on every mutation (create, update, delete, archive, restore, stage CRUD)
2. **History Panel**: Sliding side panel on the application edit page showing change timeline
3. **Field-Level Diffs**: Computed at read time by comparing adjacent snapshots
4. **Restore**: Copy any historical snapshot back to the application table, replacing current state
5. **Cascade Cleanup**: History entries deleted when parent application is deleted

### Technical Requirements

1. **Database**: New `ApplicationHistory` Prisma model in `express_prisma` schema
2. **Snapshot Format**: Full application (including `interviewStages[]`) stored as JSONB
3. **Sequence Numbers**: Monotonically increasing per application for ordering
4. **Service Layer**: Capture state before/after mutations at the service layer
5. **API**: RESTful endpoints for listing history and restoring versions
6. **No New Dependencies**: Uses existing Prisma, Express, Zod, and Next.js tooling

## Success Criteria

- [ ] Every application mutation creates a history entry
- [ ] History panel shows all entries with correct descriptions and relative timestamps
- [ ] Expanding an entry shows accurate field-level diffs
- [ ] Restoring to a version correctly reverts application fields and interview stages
- [ ] "Restored to version N" entry appears after restore
- [ ] Existing shared E2E tests (13 tests) continue to pass
- [ ] New history-specific E2E tests pass
- [ ] Build and lint pass for both api and ui
