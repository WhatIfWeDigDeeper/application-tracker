# Feature Specification: Lambda React UI

**Feature Branch**: `026-lambda-react-ui`
**Created**: 2026-04-05
**Status**: Complete
**Input**: User description: "Build a new React frontend for the lambda-api using the UI redesign mockup. Implement all core features (specs/core), add CSV import/export to lambda-api, handle pagination, and ensure all shared E2E tests pass. Use Zustand for state management (new to the monorepo). Use Testing Library for unit tests."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View and Browse Applications (Priority: P1)

A job seeker opens the application tracker and sees their applications displayed in a responsive three-column layout: collapsible sidebar with navigation, a main content area with pipeline summary and application cards (grid or list view), and a closable context panel for details. They can toggle between grid and list views, paginate through results, and click any application to see its details in the context panel.

**Why this priority**: The core browsing experience is the foundation — without it, no other feature is usable. This also establishes the UI shell (sidebar, main area, context panel) that all other features build on.

**Independent Test**: Can be fully tested by loading the page, verifying the layout renders, switching views, clicking cards, and confirming the context panel opens with correct data.

**Acceptance Scenarios**:

1. **Given** applications exist, **When** the user loads the homepage, **Then** they see the pipeline summary bar, filter/sort controls, and application cards in a grid layout
2. **Given** the user is on the list page, **When** they click a card, **Then** the context panel opens showing that application's details, interview progress, and history tabs
3. **Given** the user is viewing applications, **When** they toggle between grid and list views, **Then** the display switches and their preference persists across page reloads (localStorage)
4. **Given** more than 20 applications exist, **When** the user navigates pagination controls, **Then** the next page of results loads correctly

---

### User Story 2 - Create and Edit Applications (Priority: P1)

A job seeker clicks "Add Application" to navigate to a full-page creation form. They fill in company name, position title, and optional fields, then save. The application appears in the list. They can click an application and edit its fields inline on the detail page, with dirty tracking and unsaved-changes warnings.

**Why this priority**: Creating and editing applications is the core write path — the primary reason users come to the tool.

**Independent Test**: Can be tested by navigating to /applications/new, filling required fields, saving, verifying redirect to the edit page, making changes, and saving again.

**Acceptance Scenarios**:

1. **Given** the user is on the homepage, **When** they click "Add Application", **Then** they navigate to `/applications/new` with an empty form
2. **Given** the user is on the create form, **When** they submit without company name or position title, **Then** validation errors are shown
3. **Given** the user fills valid data and saves, **When** the save succeeds, **Then** they are redirected to `/applications/:id` in edit mode
4. **Given** the user has unsaved changes, **When** they try to navigate away, **Then** a confirmation dialog warns them about losing changes

---

### User Story 3 - Filter, Sort, and Search Applications (Priority: P1)

A job seeker uses the filter bar to narrow applications by status, company category, job source, or minimum skills match. They sort by date applied, company name, or last updated. The pipeline summary bar shows counts per status and acts as a quick filter when clicked.

**Why this priority**: With many applications, filtering and sorting are essential for finding relevant entries quickly.

**Independent Test**: Can be tested by creating applications with different statuses, applying a status filter, and verifying only matching applications appear.

**Acceptance Scenarios**:

1. **Given** applications with various statuses exist, **When** the user selects "Applied" from the status filter, **Then** only applied applications are shown and the count updates
2. **Given** the user clicks a pipeline summary segment (e.g., "Interviewing"), **Then** applications are filtered to that status
3. **Given** the user selects "Company Name" as sort, **Then** applications reorder alphabetically
4. **Given** filters are active, **When** the results text updates, **Then** it shows "Showing X of Y applications" with active filter labels

---

### User Story 4 - Manage Interview Stages (Priority: P1)

A job seeker whose application status is "interviewing" sees a vertical timeline of interview stages in the context panel. They can add, edit, reorder, complete (with date and rating), and delete stages. When transitioning to "interviewing" status, 6 default stages are auto-created if none exist.

**Why this priority**: Interview tracking is a core differentiator of the tool and a critical user need during active job searches.

**Independent Test**: Can be tested by creating an application, setting status to "interviewing", verifying default stages appear, completing a stage with a rating, and adding a new stage.

**Acceptance Scenarios**:

1. **Given** an application with no stages, **When** the user changes status to "interviewing", **Then** 6 default interview stages are created (Recruiter Screen, Hiring Manager, Technical Interview, System Design, Team Fit, Final Round)
2. **Given** interview stages exist, **When** the user marks a stage as completed with a date and rating, **Then** the stage shows as completed in the timeline with a green checkmark
3. **Given** multiple stages exist, **When** the user adds a new stage, **Then** it appears in the timeline at the correct position
4. **Given** a stage exists, **When** the user deletes it and confirms, **Then** the stage is removed

---

### User Story 5 - Archive, Restore, and Delete Applications (Priority: P2)

A job seeker archives old applications to declutter their active view. Archived applications are accessible via the "Archived" sidebar link. They can restore archived applications or permanently delete any application (with confirmation).

**Why this priority**: Lifecycle management keeps the active list focused and manageable.

**Independent Test**: Can be tested by archiving an application, switching to the archived view, restoring it, and verifying it returns to active view.

**Acceptance Scenarios**:

1. **Given** an active application, **When** the user clicks "Archive" from the action menu and confirms, **Then** the application moves to the archived view
2. **Given** an archived application, **When** the user clicks "Restore", **Then** it returns to the active applications list
3. **Given** any application, **When** the user clicks "Delete" and confirms via the confirmation dialog, **Then** the application is permanently removed
4. **Given** a destructive action is triggered, **Then** a custom ConfirmDialog component is shown (never native `window.confirm()`)

---

### User Story 6 - View and Restore Application History (Priority: P2)

A job seeker opens the History tab in the context panel to see a chronological log of all changes to an application. Each entry shows what changed (field-level diffs) and when. They can restore the application to any previous version.

**Why this priority**: History provides confidence that changes are tracked and recoverable — important for data integrity.

**Independent Test**: Can be tested by editing an application, opening the history tab, verifying a new entry with the correct diff appears, and restoring to a previous version.

**Acceptance Scenarios**:

1. **Given** an application has been edited, **When** the user opens the History tab, **Then** they see timestamped entries with field-level changes
2. **Given** a history entry shows a previous version, **When** the user clicks "Restore to this version", **Then** the application reverts to that state
3. **Given** history has many entries, **When** the user scrolls, **Then** pagination loads additional entries

---

### User Story 7 - Import and Export CSV (Priority: P2)

A job seeker exports their applications as a CSV file for backup or external use. They can also import applications from a CSV file (with duplicate detection by job posting URL). A sample template CSV is available for download.

**Why this priority**: CSV support enables data portability and bulk entry — valuable for users migrating from spreadsheets.

**Independent Test**: Can be tested by exporting existing applications, verifying the CSV has correct columns, downloading the template, and importing a valid CSV with new and duplicate entries.

**Acceptance Scenarios**:

1. **Given** applications exist, **When** the user clicks "Export" in the sidebar, **Then** a CSV file downloads with all application data in the standard 17-column format
2. **Given** the user clicks "Import" in the sidebar, **When** they select a valid CSV file, **Then** applications are imported with a summary of created/skipped entries
3. **Given** a CSV contains a row with a `jobPostingUrl` matching an existing application, **When** imported, **Then** that row is skipped as a duplicate
4. **Given** the user clicks the template download, **Then** they receive a CSV with the correct 17-column header row

---

### User Story 8 - Dark Mode and Responsive Layout (Priority: P2)

A job seeker toggles between light and dark themes using the sidebar theme button. The preference persists in localStorage. On mobile/tablet, the layout adapts: sidebar collapses, context panel becomes an overlay, and cards display in a single column.

**Why this priority**: Accessibility and mobile support broaden usability but aren't blocking for core functionality.

**Independent Test**: Can be tested by toggling dark mode and checking the `.dark` class and localStorage, then resizing the viewport and verifying layout changes.

**Acceptance Scenarios**:

1. **Given** the user is in light mode, **When** they click the theme toggle, **Then** the UI switches to dark mode and `app-theme` is saved to localStorage
2. **Given** a mobile viewport (≤768px), **When** the page loads, **Then** the sidebar is hidden and a bottom navigation bar appears
3. **Given** a tablet viewport (≤1200px), **When** the user opens the context panel, **Then** it slides in as an overlay with a backdrop

---

### User Story 9 - Resizable Textareas and Inline Editing (Priority: P3)

A job seeker can resize textarea fields (notes, special requirements) vertically, with their preferred size persisted in localStorage. Fields on the detail page are editable inline with save-on-blur behavior.

**Why this priority**: Quality-of-life enhancement that improves the editing experience but is not essential for core functionality.

**Independent Test**: Can be tested by resizing a textarea, reloading the page, and verifying the size is preserved.

**Acceptance Scenarios**:

1. **Given** a textarea field on the detail page, **When** the user resizes it, **Then** the new height persists in localStorage across page loads
2. **Given** the user is on the detail page, **When** they click a field and edit it, **Then** the change is saved on blur

---

### Edge Cases

- What happens when the API is unreachable? Display a connection error banner with retry option.
- What happens when the user submits a form with salary min > salary max? Show a validation error.
- What happens when two browser tabs edit the same application? Last-write-wins (standard behavior); history captures both changes.
- What happens when CSV import contains malformed rows? Report row-level errors in the import summary without aborting the entire import.
- What happens when the user navigates to a non-existent application ID? Show a 404 state with a link back to the list.
- What happens when the user tries to change status from a terminal state ("accepted offer", "declined offer")? The terminal states disable further status transitions per the state machine rules.

## Requirements *(mandatory)*

### Functional Requirements

**Frontend (lambda-react-ui)**

- **FR-001**: System MUST render a three-column responsive layout matching the UI redesign mockup: collapsible sidebar (240px / 56px collapsed), main content area, and closable context panel (380px)
- **FR-002**: System MUST support grid and list view modes with localStorage persistence (`app-view-mode` key)
- **FR-003**: System MUST implement a pipeline summary bar showing application counts by status, clickable to filter
- **FR-004**: System MUST provide full CRUD for applications: create via `/applications/new`, edit via `/applications/:id`, delete with ConfirmDialog
- **FR-005**: System MUST implement filtering by status (multi-select), company category, job source, and minimum skills match
- **FR-006**: System MUST implement sorting by dateApplied, companyName, and updatedAt (default: updatedAt desc)
- **FR-007**: System MUST implement pagination supporting both offset-based (page/limit) and cursor-based modes, defaulting to offset-based for compatibility with shared E2E tests
- **FR-008**: System MUST implement interview stage management: add, edit, complete (with date + rating), reorder, and delete stages
- **FR-009**: System MUST auto-create 6 default interview stages when transitioning to "interviewing" status (if no stages exist) — this is a frontend responsibility for the lambda-api stack
- **FR-010**: System MUST implement archive/restore/delete with custom ConfirmDialog for all destructive actions (native `window.confirm()` is prohibited)
- **FR-011**: System MUST implement the History panel showing field-level diffs with restore-to-version capability
- **FR-012**: System MUST implement dark mode toggle with localStorage persistence (`app-theme` key) and full dark theme matching the mockup
- **FR-013**: System MUST be responsive: mobile (≤768px) with bottom nav, tablet (≤1200px) with sidebar collapsed and panel as overlay, desktop with full three-column layout
- **FR-014**: System MUST implement dirty tracking on edit forms with unsaved-changes navigation guards
- **FR-015**: System MUST implement resizable textareas with localStorage height persistence
- **FR-016**: System MUST use Zustand for global state management (application list, filters, UI state) — a state management library not yet used in this monorepo
- **FR-017**: System MUST use React Router for client-side routing with routes: `/` (list), `/applications/new` (create), `/applications/:id` (edit/detail)
- **FR-018**: System MUST implement CSV import/export via an Import modal (sidebar button) and Export action (sidebar button)
- **FR-019**: System MUST render status badges with color-coded styling matching the mockup's 8-status color scheme
- **FR-020**: System MUST display offer expiry indicators for applications with status "given offer" and an approaching offerDueDate
- **FR-021**: System MUST use Testing Library (@testing-library/react) for all unit tests

**Backend (lambda-api CSV additions)**

- **FR-022**: Lambda-api MUST implement `GET /applications/export` returning CSV with the standard 17-column format
- **FR-023**: Lambda-api MUST implement `POST /applications/import` accepting CSV upload with duplicate detection by `jobPostingUrl`
- **FR-024**: Lambda-api MUST implement `GET /applications/sample-csv` returning a template CSV with the 17-column header row
- **FR-025**: Lambda-api CSV import MUST handle multi-line quoted fields correctly (character-by-character parsing, not line splitting)
- **FR-026**: Lambda-api CSV import MUST return a summary with counts of created, skipped (duplicate), and failed rows

**Backend (lambda-api cursor-based pagination)**

- **FR-027**: Lambda-api MUST support cursor-based pagination using DynamoDB's `LastEvaluatedKey` as an alternative to offset-based pagination
- **FR-028**: Lambda-api MUST accept an optional `cursor` query parameter; when present, the response MUST include a `nextCursor` field (base64-encoded `LastEvaluatedKey`) instead of `page`/`total`
- **FR-029**: Lambda-api MUST continue to support the existing offset-based pagination (page/limit) as the default when no `cursor` parameter is provided, preserving backward compatibility

### Key Entities

- **JobApplication**: Core entity with 20+ fields — maps to DynamoDB items with `PK=APP#<id>`, `SK=APP#<id>`. Includes companyName, positionTitle, status, dateApplied, salary range, URLs, notes, isArchived, offerDueDate.
- **InterviewStage**: Belongs to an application — maps to `PK=APP#<id>`, `SK=STAGE#<id>`. Has name, order, isCompleted, completedDate, notes, performanceRating.
- **ApplicationSnapshot**: History entries — maps to `PK=APP#<id>`, `SK=HIST#<sequence>`. Full point-in-time capture with field-level diff computation.

## Assumptions

- The new frontend package will be named `lambda-react-ui` and run on a dedicated dev port (to be assigned during planning, likely 3090)
- Zustand is chosen as the state management library because it is hooks-based, minimal, and not yet used anywhere in the monorepo — fulfilling the user's request for a new state management approach
- The lambda-api will support both offset-based (page/limit) and cursor-based (DynamoDB LastEvaluatedKey) pagination. Offset-based remains the default for backward compatibility and shared E2E test compliance. Cursor-based is an opt-in alternative via a `cursor` query parameter
- The frontend will use Vite as the build tool (consistent with react-ui and other SPA frontends in the monorepo)
- Tailwind CSS 4.x will be used for styling (consistent with the monorepo's active technologies)
- The UI redesign mockup (docs/ui-redesign-mockup.html) serves as the visual reference for layout, colors, spacing, and component styling
- CSV column format follows the established 17-column standard used by nest-api, fastapi, go-api, spring-api, and yoga-api

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 8 shared E2E test files in `tests/e2e/` pass against the new frontend, including: simple-test, application-crud, dark-mode-toggle, filter, history, csv-import-export, action-menu, and responsive-layout
- **SC-002**: Users can create a new application and see it in the list within 2 seconds of saving
- **SC-003**: Users can browse, filter, and sort applications without full page reloads
- **SC-004**: The full build → lint → test → e2e validation chain passes with zero errors
- **SC-005**: CSV export produces a file matching the standard 17-column format readable by other implementations in the monorepo
- **SC-006**: CSV import correctly identifies and skips duplicate applications (by jobPostingUrl), reporting results to the user
- **SC-007**: Dark mode preference and view mode preference persist across browser sessions
- **SC-008**: The UI is usable on mobile (375px), tablet (768px), and desktop (1440px) viewports without horizontal overflow or clipped interactive elements
- **SC-009**: Unit test coverage exists for key components and Zustand stores using Testing Library
- **SC-010**: The context panel correctly displays application details, interview timeline, and history with field-level diffs
