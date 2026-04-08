# Tasks: Lambda React UI

**Input**: Design documents from `/specs/026-lambda-react-ui/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Unit tests included per spec FR-021 (Testing Library) and constitution §II (coverage for all acceptance scenarios).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks in same group)
- **[Story]**: Which user story this task belongs to (US1–US9)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold the `lambda-react-ui` package and register it in the monorepo.

- [x] T001 Scaffold `lambda-react-ui/` with Vite + React + TypeScript template (`npm create vite@latest lambda-react-ui -- --template react-ts`)
- [x] T002 Configure `lambda-react-ui/vite.config.ts`: port 3090, proxy `/api → http://localhost:5090`, path alias `@/` → `src/`
- [x] T003 [P] Configure `lambda-react-ui/tsconfig.json` with `strict: true`, `noUncheckedIndexedAccess: true`, path aliases matching vite.config
- [x] T004 [P] Install and configure Tailwind CSS 4.x + PostCSS: create `lambda-react-ui/postcss.config.js`; add `@tailwindcss/vite` to vite.config
- [x] T005 [P] Install and configure Vitest + Testing Library: add `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom` as devDependencies; add `test` config block to `lambda-react-ui/vite.config.ts`
- [x] T006 [P] Configure ESLint: create `lambda-react-ui/eslint.config.js` mirroring `react-ui/eslint.config.js` (react-hooks, react-refresh, typescript-eslint plugins)
- [x] T007 [P] Install runtime dependencies at exact versions: `react@19.x`, `react-dom@19.x`, `react-router-dom@7.13.1`, `zustand@5.0.12` — use `--save-exact`; verify no `^` carets in `lambda-react-ui/package.json`
- [x] T008 Create `lambda-react-ui/.auditconfig.json`: `{ "allowlist": [], "high": true, "package-manager": "auto" }`
- [x] T009 Add per-package scripts to root `package.json`: `dev:lambda-react-ui`, `build:lambda-react-ui`, `lint:lambda-react-ui`, `test:lambda-react-ui`, `test:e2e:lambda-react-ui` (TEST_UI_PORT=3090), `ci:lambda-react-ui`, `install:lambda-react-ui`, `audit:ci:lambda-react-ui`
- [x] T010 Add `lambda-react-ui` to `:all` scripts in root `package.json` (`build:all`, `lint:all`, `test:all`, `ci:all`, `audit:ci:all`)
- [x] T011 Add port 3090 to `scripts/stop-all.sh` PORTS array (after existing 3080 entry)

**Checkpoint**: `npm run build:lambda-react-ui` compiles; `npm run test:lambda-react-ui` runs (empty suite passes)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure required before any user story work can begin. Two parallel streams: frontend foundation (F-tasks) and lambda-api additions (A-tasks) are independent and can run concurrently.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Stream F: Frontend Foundation

- [x] T012 Add CSS variables and Tailwind token config to `lambda-react-ui/src/index.css`: copy all `--color-*`, `--surface-*`, `--text-*`, `--border-*` variables from `docs/ui-redesign-mockup.html`; include `.dark` class override block; add `@import url(...)` for DM Sans and JetBrains Mono fonts; add `@tailwind` directives
- [x] T013 [P] Create `lambda-react-ui/src/types/application.ts`: all domain types from `specs/026-lambda-react-ui/data-model.md` — `ApplicationStatus`, `CompanyCategory`, `JobSource`, `InterviewStage`, `Application`, `PaginatedApplicationsResponse`, `CursorPaginatedApplicationsResponse`, `HistoryEntry`, `FieldChange`, `PaginatedHistoryResponse`, `FilterState`, `SortState`, `ImportResult`
- [x] T014 [P] Create `lambda-react-ui/src/lib/constants.ts`: `STATUS_COLORS` (CSS var mapping per status), `STATUS_LABELS`, `CATEGORY_LABELS`, `SOURCE_LABELS`, `DEFAULT_INTERVIEW_STAGES` (6 names), `TERMINAL_STATUSES`
- [x] T015 [P] Create `lambda-react-ui/src/lib/utils.ts`: `cn()` (tailwind class merger), `formatDate()` (YYYY-MM-DD → "Jan 15, 2024"), `formatSalaryRange()` ("$80K–$120K"), `getDaysUntil()`, `isOverdue()`, `getTodayDate()` (ISO date string)
- [x] T016 Create `lambda-react-ui/src/services/api.ts`: `ApiError` class (status + message), `buildQueryString()` (omits undefined/null), `handleResponse<T>()` wrapper; implement all existing lambda-api endpoints: `listApplications`, `getApplication`, `createApplication`, `updateApplication`, `deleteApplication`, `archiveApplication`, `restoreApplication`, `listHistory`, `restoreToVersion`, `createStage`, `updateStage`, `deleteStage`; add stubs for CSV endpoints (implemented in US7): `exportCSV()`, `importCSV()`, `downloadSampleCSV()`
- [x] T017 Create `lambda-react-ui/src/stores/uiStore.ts`: Zustand store with `sidebarCollapsed`, `panelOpen`, `panelTab`, `darkMode` (init from localStorage `app-theme`; toggle adds/removes `.dark` on `document.documentElement`), `viewMode` (init from localStorage `app-view-mode`); actions: `toggleSidebar`, `openPanel`, `closePanel`, `setPanelTab`, `toggleDarkMode`, `setViewMode`
- [x] T018 [P] Create `lambda-react-ui/src/stores/filterStore.ts`: Zustand store with `FilterState + SortState` fields; actions: `setStatusFilter`, `setCategoryFilter`, `setSourceFilter`, `setSkillsMatchMin`, `setIncludeArchived`, `setSortBy`, `setSortDir`, `clearFilters`; computed `activeFilterCount()`
- [x] T019 Create `lambda-react-ui/src/stores/applicationStore.ts`: Zustand store with `applications[]`, `total`, `page`, `limit`, `loading`, `error`, `selectedId`, `selectedApplication`, `selectedLoading`; actions: `fetchApplications(filters, sort, page)`, `createApplication`, `updateApplication`, `deleteApplication`, `archiveApplication`, `restoreApplication`, `selectApplication`, `loadSelectedApplication`, `refreshSelected`, `addStage`, `updateStage`, `removeStage`, `addDefaultStages`
- [x] T020 Create `lambda-react-ui/src/router.tsx`: `createBrowserRouter` with lazy-loaded `ListPage` at `/`, lazy-loaded `ApplicationEditPage` at `/applications/new` and `/applications/:id`
- [x] T021 Create `lambda-react-ui/src/App.tsx`: three-column CSS grid layout (`240px | 1fr | 380px`); apply `.dark` class to `<html>` based on `uiStore.darkMode`; render `Sidebar`, main `<Outlet>`, `ContextPanel`; responsive grid collapses (handled in US8)
- [x] T022 Create `lambda-react-ui/src/main.tsx`: `ReactDOM.createRoot` + `RouterProvider`; initialize dark mode class from localStorage before first render
- [x] T023 [P] Write unit tests for `lambda-react-ui/src/lib/utils.ts` in `lambda-react-ui/src/lib/utils.test.ts`: `formatDate` (valid, null), `formatSalaryRange` (min+max, min-only, null), `getDaysUntil` (future, past, today), `isOverdue`

### Stream A: Lambda-API Additions (independent — different repo directory)

- [x] T024 [P] Add `CursorPaginatedApplicationsSchema` and `ImportResultSchema` to `lambda-api/src/types/api.ts`; add optional `cursor: z.string().optional()` field to `ListApplicationsQuerySchema`; export new types
- [x] T025 Create `lambda-api/src/services/csv.service.ts`: `serializeToCSV(apps)` (character-by-character; quotes fields with commas/newlines/double-quotes; 17-column order from `specs/026-lambda-react-ui/contracts/lambda-api-additions.md`); `parseCSV(text)` (character-by-character `inQuotes` tracking; never pre-splits on newlines); `importApplications(csvText, dynamodb)` (parse → validate → duplicate-check by jobPostingUrl → createApplication per row → return ImportResult); `exportApplications(dynamodb, includeArchived)` (fetch all apps → serializeToCSV)
- [x] T026 Add cursor pagination to `lambda-api/src/services/application.service.ts` in `listApplications`: when `query.cursor` is present, decode base64 JSON `{page, limit}` to get offset; run existing in-memory sort+slice; encode next page as base64 JSON; return `CursorPaginatedApplicationsResponse`; when cursor absent, keep existing `PaginatedApplicationsResponse` path
- [x] T027 Add new routes to `lambda-api/src/routes/applications.ts` — insert BEFORE the `GET /:id` route: `GET /export` (calls `csvService.exportApplications`; sets `Content-Type: text/csv`; `Content-Disposition: attachment; filename="applications-export.csv"`), `GET /sample-csv` (header-only CSV), `POST /import` (parses `multipart/form-data` file field via Hono's built-in body parser; calls `csvService.importApplications`); update `GET /` handler to branch on `cursor` param presence
- [x] T028 Add unit tests in `lambda-api/src/__tests__/csv.test.ts`: `parseCSV` with multi-line quoted fields; `serializeToCSV` quoting edge cases; `importApplications` duplicate detection; `parseCSV` with and without header row; run `npm run test:lambda-api` to confirm

**Checkpoint**: Foundation complete — all stores, services, types, and lambda-api additions ready. User stories can now begin.

---

## Phase 3: User Story 1 - View and Browse Applications (Priority: P1) 🎯 MVP

**Goal**: Three-column layout renders; application cards display in grid and list views; context panel opens on click; pagination works.

**Independent Test**: Load http://localhost:3090, verify pipeline summary and card grid render; click a card and confirm context panel opens with application name; navigate to page 2 if enough data exists; toggle grid/list view.

### Implementation

- [x] T029 [P] [US1] Create `lambda-react-ui/src/components/ui/Badge.tsx`: maps `ApplicationStatus` to CSS variable-based color classes from `STATUS_COLORS` constant; renders status text with colored background and matching border; `data-testid="status-badge"` attribute
- [x] T030 [P] [US1] Create `lambda-react-ui/src/components/ui/Button.tsx`: variants `primary` (indigo), `secondary`, `danger` (rose), `ghost`; sizes `sm`, `md`, `lg`; `loading` spinner state; `disabled` prop; forwards all button HTML attributes
- [x] T031 [P] [US1] Create `lambda-react-ui/src/components/ui/EmptyState.tsx`: icon slot, title, description, optional `action` button; two variants — no applications at all vs. no results for current filters
- [x] T032 [P] [US1] Create `lambda-react-ui/src/components/ui/Pagination.tsx`: Prev / numbered pages / Next buttons; highlights active page; calls `onPage(n)` callback; hides when `totalPages <= 1`; `data-testid="pagination"` attribute
- [x] T033 [US1] Create `lambda-react-ui/src/components/applications/ApplicationCard.tsx`: grid-view card (left status border, gradient avatar initials, Badge, date, category, skill stars, salary range, interview progress bar) and list-view compact row (same fields, single line); offer expiry banner (amber) when `status === 'given offer'` and `offerDueDate` within 7 days or overdue (red); action menu button (⋯) on hover; click card → calls `applicationStore.selectApplication(id)` + `uiStore.openPanel('details')`; selected state: accent border ring; archived state: reduced opacity; `data-testid="application-card"` and `data-testid="actions-menu-button"` (aria-label="Actions") attributes
- [x] T034 [US1] Create `lambda-react-ui/src/components/applications/ApplicationList.tsx`: renders cards in 2-column CSS grid (grid mode) or single-column list (list mode) based on `uiStore.viewMode`; skeleton loading (3 placeholder cards while `loading`); `EmptyState` when no results; `Pagination` below list; view toggle buttons (grid/list icons) in header; `data-testid="application-list"` attribute
- [x] T035 [US1] Create `lambda-react-ui/src/components/layout/PipelineSummaryBar.tsx`: 5 segments: Draft (unsubmitted), Applied, Interviewing, Offered (given offer + accepted offer + declined offer), Closed (rejected + no offer); each segment shows count and label; flex-weighted width by count (`flex: <count>`); top border colored by status color; active segment (matching current status filter) fills with status color + white text; click calls `filterStore.setStatusFilter([...statuses])` for that group
- [x] T036 [US1] Create `lambda-react-ui/src/components/applications/FilterBar.tsx`: status single-select dropdown (simple version for US1 — expanded to multi-select in US3); sort-by select (`dateApplied`, `companyName`, `updatedAt`); sort-direction toggle button (↑↓); "Showing X of Y applications" result text; view mode toggle (grid/list icons calling `uiStore.setViewMode`); "Add Application" button navigating to `/applications/new`
- [x] T037 [US1] Create `lambda-react-ui/src/components/layout/Sidebar.tsx`: logo area ("AppTracker" text + icon + collapse toggle button with 180° chevron animation); nav links: Pipeline (clears status filter), All Applications (count badge), Archived (sets includeArchived); attention stats panel (interviewing count, offers expiring); footer: theme toggle, Import button (stub in US7), Export button (stub in US7); collapsed state renders icon-only rail (56px); mobile: renders nothing (bottom nav handled in US8); sidebar width: 240px expanded, 56px collapsed; `data-testid="sidebar"` attribute
- [x] T038 [US1] Create `lambda-react-ui/src/components/layout/ContextPanel.tsx`: sticky tab header (Details / Interview / History tabs + X close button); reads `uiStore.panelTab` + `uiStore.panelOpen`; desktop: 380px right column; tablet/mobile: fixed overlay (handled fully in US8); tab content placeholders (details/interview/history content wired in US2/US4/US6); `data-testid="context-panel"` and `data-testid="history-panel"` on History tab button attributes
- [x] T039 [US1] Create `lambda-react-ui/src/pages/ListPage.tsx`: orchestrates `PipelineSummaryBar` + `FilterBar` + `ApplicationList`; calls `applicationStore.fetchApplications(filterStore state, page)` on mount and on filter/sort/page changes; handles page change; passes `onArchive`/`onDelete` callbacks to ApplicationList → ApplicationCard
- [x] T040 [P] [US1] Unit test `lambda-react-ui/src/components/applications/ApplicationCard.tsx` in `ApplicationCard.test.tsx`: renders company name and position title; shows Badge with correct status; shows offer expiry banner when `status === 'given offer'` and offerDueDate is within 7 days; action menu button has `aria-label="Actions"`; card click triggers select callback
- [x] T041 [P] [US1] Unit test `lambda-react-ui/src/components/ui/Pagination.tsx` in `Pagination.test.tsx`: renders correct page count; highlights active page; calls `onPage` with correct number on click; hides Prev on page 1; hides Next on last page

**Checkpoint**: `npm run dev:lambda-react-ui` serves a working list page. Cards load from lambda-api. Click a card → panel opens. Pagination navigates. Grid/list toggle works and persists.

---

## Phase 4: User Story 2 - Create and Edit Applications (Priority: P1)

**Goal**: "Add Application" navigates to `/applications/new`; form validates and creates; redirect to `/applications/:id`; edit saves; unsaved-changes guard warns on navigation.

**Independent Test**: Navigate to http://localhost:3090, click "Add Application", fill company name + position title, save → redirected to edit page. Change company name, try to navigate away → confirmation dialog appears.

### Implementation

- [x] T042 [P] [US2] Create `lambda-react-ui/src/components/ui/Input.tsx`: text/date/number/url input with `label`, `error` message display, `required` indicator; forwards all input HTML attributes; `data-testid` passthrough
- [x] T043 [P] [US2] Create `lambda-react-ui/src/components/ui/Select.tsx`: `options: {value, label}[]` prop; `label`, `error` display; `data-testid` passthrough; renders native `<select>`
- [x] T044 [P] [US2] Create `lambda-react-ui/src/components/ui/TextArea.tsx`: `label`, `error` display; `rows` default 4; height persistence deferred to US9 (stub localStorage logic as no-op now)
- [x] T045 [P] [US2] Create `lambda-react-ui/src/components/ui/Modal.tsx`: React portal (`createPortal` to `document.body`); Escape key closes; overlay click closes; `onClose` callback; `children` slot; `data-testid="modal-overlay"` on backdrop
- [x] T046 [US2] Create `lambda-react-ui/src/components/ui/ConfirmDialog.tsx`: extends Modal; inner wrapper has `role="dialog"`; `title`, `message`, `confirmLabel` (default "Confirm"), `cancelLabel` (default "Cancel"), `variant?: 'default' | 'danger'` props; danger variant: confirm button uses `danger` Button variant; `onConfirm` and `onCancel` callbacks; `data-testid="confirm-dialog"` on inner div
- [x] T047 [US2] Create `lambda-react-ui/src/components/applications/ApplicationForm.tsx`: 5 sections — (1) Basic Info: companyName (required, max 200), positionTitle (required, max 200), dateApplied (date input, disabled when status is `unsubmitted`), status (select); (2) Company Details: companyCategory, jobSource, companyUrl, jobPostingUrl, companyCareerUrl (URL validation); (3) Assessment: skillsMatch (RatingInput 1–5), coverLetterRequired (checkbox), specialRequirements (TextArea); (4) Compensation: salaryMin, salaryMax (validate salaryMin ≤ salaryMax); (5) Notes (TextArea); status side effects: changing from `unsubmitted` auto-sets dateApplied to today; changing to `unsubmitted` clears dateApplied; terminal status guard: disable changing away from `accepted offer` / `declined offer`; Submit and Cancel buttons; `data-testid="application-form-save"` on submit button (`type="button"` with `onClick={doSubmit}` for webkit compatibility)
- [x] T048 [US2] Create `lambda-react-ui/src/pages/ApplicationEditPage.tsx`: renders for `/applications/new` (blank form + `createApplication` on save → redirect to `/applications/:id`) and `/applications/:id` (load application, `updateApplication` on save); uses `useBlocker` for unsaved changes navigation guard (shows ConfirmDialog); shows HistoryPanel toggle button (opens context panel to history tab — stub until US6); uses `data-testid="history-panel"` on history toggle button for E2E compatibility
- [x] T049 [P] [US2] Unit test `lambda-react-ui/src/components/ui/ConfirmDialog.tsx` in `ConfirmDialog.test.tsx`: renders title and message; calls `onConfirm` on confirm click; calls `onCancel` on cancel click; has `role="dialog"` on inner div; closes on Escape key
- [x] T050 [P] [US2] Unit test `lambda-react-ui/src/components/applications/ApplicationForm.tsx` in `ApplicationForm.test.tsx`: shows required field errors when submitted empty; auto-populates dateApplied when status changes from `unsubmitted`; clears dateApplied when status changes to `unsubmitted`; shows error when salaryMin > salaryMax; submit button has `type="button"` for webkit compatibility

**Checkpoint**: Create flow works end-to-end. Edit flow saves changes. `useBlocker` shows ConfirmDialog on dirty navigation. E2E `application-crud.spec.ts` passes.

---

## Phase 5: User Story 3 - Filter, Sort, and Search Applications (Priority: P1)

**Goal**: Multi-select status filters; category/source/skills filters; sort controls; pipeline bar as clickable filter; results count updates.

**Independent Test**: Create two applications with different statuses. Select "Applied" status filter → only applied applications visible. Click pipeline "Interviewing" segment → shows only interviewing apps. Change sort to "Company Name" → cards reorder alphabetically.

### Implementation

- [x] T051 [US3] Extend `lambda-react-ui/src/components/applications/FilterBar.tsx` with full filter controls: status filter (multi-select via checkbox group — each status is a toggle; comma-joined for API `status` param); company category select (uses CATEGORY_LABELS); job source select (uses SOURCE_LABELS); skills match minimum select (options: "2+ stars", "3+ stars", "4+ stars", "5 stars" → maps to `skillsMatchMin` 2–5); include archived checkbox; clear filters button showing `filterStore.activeFilterCount()` as badge; "Showing X of Y applications — [active filter labels]" result text; wire all controls to filterStore actions
- [x] T052 [US3] Extend `lambda-react-ui/src/components/layout/PipelineSummaryBar.tsx`: compute per-status counts by querying counts from applicationStore total + fetching a status-breakdown (or approximate from current page); flex-weight each segment proportionally to count using CSS `flex` property; active segment (matching filterStore.status) fills with status color; inactive segments show top border only; ensure empty segments still render (min-width)
- [x] T053 [US3] Wire `filterStore` → `applicationStore` re-fetch in `lambda-react-ui/src/pages/ListPage.tsx`: add `useEffect` that watches all filterStore fields and sort fields; call `applicationStore.fetchApplications(filters, sort, 1)` on change (reset to page 1); debounce not needed (all changes are discrete select/checkbox actions)
- [x] T054 [P] [US3] Unit test `lambda-react-ui/src/stores/filterStore.ts` in `filterStore.test.ts`: `setStatusFilter` updates status array; `clearFilters` resets all to defaults; `activeFilterCount` returns correct count for various combinations; `setSortBy` and `setSortDir` update correctly
- [x] T055 [P] [US3] Unit test `lambda-react-ui/src/components/applications/FilterBar.tsx` in `FilterBar.test.tsx`: filter controls render; status checkbox toggle calls `filterStore.setStatusFilter`; clear button shows active filter count; "Showing X of Y" text reflects applicationStore total

**Checkpoint**: E2E `filter.spec.ts` passes against port 3090. Status filter shows only matching applications.

---

## Phase 6: User Story 4 - Manage Interview Stages (Priority: P1)

**Goal**: Interview tab shows stage timeline; status-to-"interviewing" auto-creates 6 default stages; mark stage complete with date + rating; add/delete stages.

**Independent Test**: Create an application, change status to "interviewing" → 6 default stages appear in Interview tab. Mark "Recruiter Screen" as complete with today's date and 4-star rating → stage shows green checkmark. Add a new stage "Coffee Chat" → appears in timeline.

### Implementation

- [x] T056 [P] [US4] Create `lambda-react-ui/src/components/ui/Rating.tsx`: `RatingDisplay` (renders N of 5 filled/empty stars; `performanceRating` prop; read-only); `RatingInput` (click star to set rating 1–5; click same star to clear; calls `onChange(n | null)`)
- [x] T057 [P] [US4] Create `lambda-react-ui/src/components/interviews/InterviewStageForm.tsx`: inline form fields: name (Input, required), order (hidden — auto-assigned as max+1), isCompleted (checkbox), completedDate (date Input, shown when isCompleted), notes (TextArea), performanceRating (RatingInput); Save + Cancel buttons; used for both add and edit; `data-testid="stage-form"` attribute
- [x] T058 [US4] Create `lambda-react-ui/src/components/interviews/InterviewStageItem.tsx`: renders one stage in timeline view; completion dot: green + checkmark (completed), amber + pulse (current/in-progress), empty (upcoming) — based on `isCompleted` and position among stages; shows name, completedDate, RatingDisplay; edit button (pencil icon → opens InterviewStageForm inline); delete button → ConfirmDialog; completion toggle checkbox; `data-testid="stage-item"` attribute
- [x] T059 [US4] Create `lambda-react-ui/src/components/interviews/InterviewStageList.tsx`: vertical timeline list of `InterviewStageItem` sorted by `order`; progress bar showing X of Y completed stages; "Add Stage" button → appends inline `InterviewStageForm` below list; "Add Default Stages" button (shown only when `stages.length === 0`) → calls `applicationStore.addDefaultStages(appId)`; handles add/update/remove by calling store actions; re-fetches `selectedApplication` after mutations; `data-testid="interview-stage-list"` attribute
- [x] T060 [US4] Implement Interview tab content in `lambda-react-ui/src/components/layout/ContextPanel.tsx`: when `panelTab === 'interview'`, render `InterviewStageList` with `selectedApplication?.interviewStages` and `appId = selectedApplication?.id`
- [x] T061 [US4] Add `addDefaultStages(appId)` to `lambda-react-ui/src/stores/applicationStore.ts`: creates 6 stages in sequence via `api.createStage` with names from `DEFAULT_INTERVIEW_STAGES` constant and order 0–5; refreshes `selectedApplication` after all creates
- [x] T062 [US4] Add status-change auto-trigger in `lambda-react-ui/src/components/applications/ApplicationForm.tsx`: when status field changes to `'interviewing'` and the current application has `interviewStages.length === 0` (check `selectedApplication` from store), call `applicationStore.addDefaultStages(id)` after save; guard: only for existing applications (not `/applications/new`)

**Checkpoint**: Interview tab shows timeline with correct stage dots. Default stages created on "interviewing" transition. Stage add/edit/delete/complete all work via API.

---

## Phase 7: User Story 5 - Archive, Restore, and Delete Applications (Priority: P2)

**Goal**: Action menu shows Archive/Restore/Delete; ConfirmDialog used for all destructive actions; Archived view in sidebar shows archived applications.

**Independent Test**: On an active application, click ⋯ menu → Archive → confirm → application disappears from active list. Navigate via "Archived" sidebar link → application appears. Click Restore → application returns to active view.

### Implementation

- [x] T063 [US5] Implement action menu in `lambda-react-ui/src/components/applications/ApplicationCard.tsx`: clicking ⋯ button (stopPropagation) opens dropdown positioned via `getBoundingClientRect()`; archive action → ConfirmDialog ("Archive this application?") → `applicationStore.archiveApplication(id)` → close panel + refresh list; restore action (shown instead of archive when `isArchived`) → `applicationStore.restoreApplication(id)` → refresh list; delete action → ConfirmDialog ("Delete this application permanently?", danger variant) → `applicationStore.deleteApplication(id)` → close panel + refresh list; action menu closes on click-outside
- [x] T064 [US5] Add Archive/Restore/Delete footer actions to Details tab in `lambda-react-ui/src/components/layout/ContextPanel.tsx`: Archive button (secondary) and Delete button (danger) with spacer; when `selectedApplication.isArchived`, show Restore button instead of Archive; all use ConfirmDialog; on success: close panel + call `applicationStore.fetchApplications(...)` to refresh list
- [x] T065 [US5] Wire "Archived" nav link in `lambda-react-ui/src/components/layout/Sidebar.tsx`: clicking Archived calls `filterStore.setIncludeArchived(true)` + navigates to `/` + sets pipeline segment to show archived; clicking Pipeline or All Applications resets `includeArchived` to false; show archived count badge on Archived link
- [x] T066 [P] [US5] Unit test archive/restore/delete store actions in `lambda-react-ui/src/stores/applicationStore.test.ts`: `archiveApplication` removes app from list on success; `restoreApplication` updates isArchived flag; `deleteApplication` removes from list; error state set on API failure

**Checkpoint**: E2E `action-menu.spec.ts` passes. Archive/restore cycle works. Delete removes permanently with confirmation.

---

## Phase 8: User Story 6 - View and Restore Application History (Priority: P2)

**Goal**: History tab shows chronological change log with field-level diffs; restore-to-version reverts the application.

**Independent Test**: Edit an application (change company name), open History tab → new entry shows "Updated application" with "Company Name: Old → New". Click "Restore to this version" on the previous entry → application reverts to old name.

### Implementation

- [x] T067 [P] [US6] Create `lambda-react-ui/src/components/applications/FieldDiff.tsx`: displays a single field change — shows `label`, `oldValue` (strikethrough, muted), arrow `→`, `newValue` (bold); handles null values as "—"; handles boolean values as Yes/No; `data-testid="field-diff"` attribute
- [x] T068 [US6] Create `lambda-react-ui/src/components/applications/HistoryPanel.tsx`: fetches history entries via `api.listHistory(id, page, limit)`; renders chronological list (newest first); each entry: timestamp (relative time: "Just now", "5m ago", "2h ago", "3d ago"), description string, expandable FieldDiff list; "Restore to this version" button per entry (disabled for the latest sequence); pagination (load more button at bottom); loading spinner; error display; `data-testid="history-panel"` on root; re-fetches on `selectedApplication.id` change
- [x] T069 [US6] Implement History tab content in `lambda-react-ui/src/components/layout/ContextPanel.tsx`: when `panelTab === 'history'`, render `HistoryPanel` with `applicationId = selectedApplication?.id`
- [x] T070 [US6] Add `restoreToVersion(appId, sequence)` action to `lambda-react-ui/src/stores/applicationStore.ts`: calls `api.restoreToVersion(appId, sequence)`; calls `refreshSelected()` after success; refreshes application list
- [x] T071 [US6] Wire history toggle in `lambda-react-ui/src/pages/ApplicationEditPage.tsx`: "View History" button calls `uiStore.openPanel('history')`; `data-testid="history-panel"` attribute on button; ContextPanel renders with `selectedApplication` set to current edit page's application

**Checkpoint**: E2E `history.spec.ts` passes at port 3090 (add port to test file in Polish phase). History entries appear after edits. Restore reverts application state.

---

## Phase 9: User Story 7 - Import and Export CSV (Priority: P2)

**Goal**: Export downloads CSV; import modal accepts file and shows result summary; template download works; lambda-api serves all three CSV endpoints.

**Independent Test**: Click Export in sidebar → CSV file downloads with 17-column header and correct data. Click Import → modal opens → select a valid CSV file → import summary shows counts. Click template download → CSV with only header row downloads.

### Implementation

- [x] T072 [P] [US7] Implement `exportCSV()`, `importCSV(file: File)`, `downloadSampleCSV()` in `lambda-react-ui/src/services/api.ts`: `exportCSV()` fetches `GET /api/applications/export` and triggers browser download via `URL.createObjectURL + <a> click`; `importCSV(file)` sends `POST /api/applications/import` as `FormData` with `file` field; `downloadSampleCSV()` fetches `GET /api/applications/sample-csv` and triggers download
- [x] T073 [US7] Create `lambda-react-ui/src/components/applications/CsvImportModal.tsx`: Modal with title "Import Applications"; file picker `<input type="file" accept=".csv">`; "Download Template" button → calls `api.downloadSampleCSV()`; "Import" button → calls `api.importCSV(file)` → shows loading → renders ImportResult: "✓ X imported | ⊘ Y skipped (duplicates) | ✗ Z failed" + scrollable error list; Close button; `data-testid="import-modal"` on inner dialog; `data-testid="import-file-input"` on file input; `data-testid="import-btn"` on Import button; `data-testid="sample-csv-btn"` on template button
- [x] T074 [US7] Wire Import + Export buttons in `lambda-react-ui/src/components/layout/Sidebar.tsx`: Export button in footer calls `api.exportCSV()`; Import button in footer calls `uiStore.openImportModal()` (or manages local state) to show `CsvImportModal`; after successful import, refresh application list
- [x] T075 [US7] Add port 3090 to `isTargetUI` array in `tests/e2e/csv-import-export.spec.ts` (line where ports 3040, 3050, 3060, 3070, 3080 are listed)

**Checkpoint**: E2E `csv-import-export.spec.ts` passes at port 3090. Lambda-api CSV endpoints tested via `npm run test:lambda-api`.

---

## Phase 10: User Story 8 - Dark Mode and Responsive Layout (Priority: P2)

**Goal**: Dark mode toggles and persists; layout is usable on mobile (375px), tablet (768px), and desktop (1440px).

**Independent Test**: Toggle dark mode → `.dark` class on `<html>`, localStorage `app-theme` = "dark". Resize to 375px → sidebar disappears, bottom nav appears, cards go single-column. Toggle back → light mode.

### Implementation

- [x] T076 [US8] Verify `lambda-react-ui/src/stores/uiStore.ts` `toggleDarkMode` correctly: reads initial value from localStorage `app-theme`; on toggle: updates localStorage; adds/removes `.dark` class on `document.documentElement`; confirm `App.tsx` does NOT conditionally render a `.dark` class itself — the store controls the HTML element class directly
- [x] T077 [US8] Add full dark theme CSS variable overrides in `lambda-react-ui/src/index.css` `.dark` block: background `#0B1121`, surface `#162032`, border `#243352`, accent `#818CF8`, text adjustments; ensure all status colors have dark-mode variants; test by toggling dark mode in browser
- [x] T078 [US8] Implement responsive CSS grid breakpoints in `lambda-react-ui/src/App.tsx`: `≤1200px` — grid becomes `56px | 1fr | 0px` (sidebar collapses to icon rail, panel hidden behind overlay); `≤768px` — grid becomes `0px | 1fr | 0px` (sidebar hidden entirely); use Tailwind responsive prefixes or CSS media queries matching mockup breakpoints
- [x] T079 [US8] Add mobile bottom nav to `lambda-react-ui/src/components/layout/Sidebar.tsx`: at `≤768px` renders a fixed `<nav>` at bottom of screen with 4 icon buttons: Pipeline, All Applications, Archived, Theme Toggle; above `768px` renders the normal left sidebar; `data-testid="bottom-nav"` attribute
- [x] T080 [US8] Add overlay/backdrop to `lambda-react-ui/src/components/layout/ContextPanel.tsx` for tablet/mobile: at `≤1200px` panel renders as fixed overlay sliding in from right; semi-transparent backdrop blur (`backdrop-filter: blur(4px)`); click backdrop calls `uiStore.closePanel()`; panel transitions via CSS `transform: translateX(...)` with `0.25s ease`
- [x] T081 [P] [US8] Unit test `lambda-react-ui/src/stores/uiStore.ts` in `uiStore.test.ts`: `toggleDarkMode` adds `.dark` to document.documentElement; second toggle removes it; `darkMode` value persists to localStorage `app-theme`; `viewMode` toggle persists to localStorage `app-view-mode`; `openPanel` / `closePanel` update `panelOpen` correctly

**Checkpoint**: E2E `dark-mode-toggle.spec.ts` passes. E2E `responsive-layout.spec.ts` passes. Action buttons visible at all 5 viewport sizes.

---

## Phase 11: User Story 9 - Resizable Textareas and Inline Editing (Priority: P3)

**Goal**: Textarea resize handles persist height in localStorage; detail page fields save on blur.

**Independent Test**: Resize the notes textarea on the edit page → reload page → textarea restores to resized height. Click a notes field in the context panel Details tab and type → blur → field saves without full form submit.

### Implementation

- [x] T082 [US9] Implement localStorage height persistence in `lambda-react-ui/src/components/ui/TextArea.tsx`: on `mouseup` event, read `element.style.height` and save to localStorage key `textarea-height-<fieldName>` (pass `fieldName` prop); on mount, read from localStorage and set as inline style; `fieldName` prop optional (no-op if missing)
- [x] T083 [US9] Add save-on-blur for editable fields in Details tab of `lambda-react-ui/src/components/layout/ContextPanel.tsx`: text fields (notes, specialRequirements, salary values) are `<input>` elements; on blur, if value changed from `selectedApplication`, call `applicationStore.updateApplication(id, { [field]: newValue })`; show brief "Saved" indicator; debounce not needed (blur-only)

**Checkpoint**: Textarea height persists on reload. Notes field auto-saves in context panel.

---

## Phase 12: Polish and Cross-Cutting Concerns

**Purpose**: E2E wiring, documentation, audit, and full validation chain.

- [x] T084 Add port 3090 to `playwright.config.ts` `webServerCommands` map (key: 3090, value: `cd lambda-react-ui && npm run dev`) and to the `projects` array
- [x] T085 Add port 3090 to history support in `tests/e2e/history.spec.ts` (add 3090 to the supported ports comment and filter condition — lambda-api supports history)
- [x] T086 Add `lambda-react-ui` stack handling to `scripts/run-e2e.sh`: map to `TEST_UI_PORT=3090`; start both `lambda-api` (port 5090) and `lambda-react-ui` (port 3090) dev servers; stop both after tests complete
- [x] T087 [P] Update `README.md`: add `lambda-react-ui` row to implementations table (port 3090, Zustand state management, Vite + React 19); add npm scripts to running instructions section; add to test commands section; note DynamoDB (no PostgreSQL schema) in schema docs table
- [x] T088 [P] Update `docs/DATABASE_ARCHITECTURE.md`: add `lambda-react-ui` section noting it uses DynamoDB (not PostgreSQL), shares the `lambda_api_applications` table with `lambda-api`, no schema isolation needed, connection via lambda-api only
- [x] T089 [P] Update `docs/TESTING_REFERENCE.md`: add `lambda-react-ui` entry — UI port 3090, API port 5090, DynamoDB Local port 8000, prerequisites (start DynamoDB → run `npm run migrate:lambda-api` → start lambda-api → start lambda-react-ui)
- [x] T090 [P] Add `Lambda React UI (port 3090)` browser debug configuration to `.vscode/launch.json`: `type: "chrome"`, `request: "launch"`, `url: "http://localhost:3090"`, `webRoot: "${workspaceFolder}/lambda-react-ui"`
- [x] T091 [P] Add new terms to `cspell.config.yaml` `words` list: `zustand`, `vitest`, `jsdom` (if not already present)
- [x] T092 Run `npm run audit:ci:lambda-react-ui`; fix any HIGH/CRITICAL vulnerabilities using `npm audit fix` or package upgrades; re-run until clean
- [x] T093 Run `npm run audit:ci:lambda-api`; verify no regressions from CSV multipart parsing addition; fix any issues
- [x] T094 Run `npm run test:e2e:all` (all 10 stacks) to confirm no regressions in other stacks from shared E2E file changes (csv-import-export.spec.ts, history.spec.ts)
- [x] T095 Run full validation chain: `npm run build:lambda-react-ui` → `npm run lint:lambda-react-ui` → `npm run lint:lambda-api` → `npm run test:lambda-react-ui` → `npm run test:lambda-api` → `bash scripts/run-e2e.sh lambda-react-ui`
- [x] T096 Update `specs/026-lambda-react-ui/spec.md` status field from `Draft` to `Complete`

---

## Dependencies and Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1; BLOCKS all user story phases
  - Stream F (frontend foundation) and Stream A (lambda-api additions) run in parallel within Phase 2
- **US1 (Phase 3)**: Depends on Phase 2 Foundational — establishes the browsable UI shell
- **US2 (Phase 4)**: Depends on Phase 2; uses UI components from US1 (Badge, Button) but independently testable
- **US3 (Phase 5)**: Depends on US1 (FilterBar shell) and Phase 2; extends existing components
- **US4 (Phase 6)**: Depends on Phase 2 and US2 (ConfirmDialog, form side effects)
- **US5 (Phase 7)**: Depends on Phase 2 and US2 (ConfirmDialog)
- **US6 (Phase 8)**: Depends on Phase 2 and US1 (ContextPanel, panel tab infrastructure)
- **US7 (Phase 9)**: Depends on Phase 2 Stream A (lambda-api CSV endpoints)
- **US8 (Phase 10)**: Depends on Phase 2 (uiStore); touches all layout components
- **US9 (Phase 11)**: Depends on US2 (TextArea component)
- **Polish (Phase 12)**: Depends on all user stories

### Parallel Opportunities

**Within Phase 2**: Stream F tasks T012–T023 and Stream A tasks T024–T028 are fully independent (different directories)

**Within US1 (Phase 3)**: T029, T030, T031, T032 (UI atoms) can all run in parallel; T040, T041 (tests) can run in parallel after their subjects are built

**Within US2 (Phase 4)**: T042, T043, T044, T045 (UI atoms) can all run in parallel; T049, T050 (tests) can run in parallel

**Cross-story parallel (after Phase 2)**: US4 (interview stages) and US5 (archive/delete) are independent and can be developed concurrently

---

## Parallel Example: Phase 2 Foundational

```bash
# Stream F — Frontend Foundation (T012-T023) — run in parallel across workers:
Worker 1: T012 (CSS variables) → T016 (API service) → T019 (applicationStore) → T020-T022 (router+app)
Worker 2: T013 (types) + T014 (constants) + T015 (utils) + T018 (filterStore) + T017 (uiStore)

# Stream A — Lambda-API Additions (T024-T028) — fully parallel with Stream F:
Worker 3: T024 (types) → T025 (csv.service) → T026 (cursor pagination) → T027 (routes) → T028 (tests)
```

---

## Implementation Strategy

### MVP First (User Stories 1–3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: US1 — browsable list with cards and context panel
4. Complete Phase 4: US2 — create and edit applications
5. Complete Phase 5: US3 — filtering and sorting
6. **STOP and VALIDATE**: E2E `simple-test`, `application-crud`, `filter`, `action-menu` pass
7. App is usable as an MVP job tracker

### Incremental Delivery (Full Feature Set)

- Add US4 → interview tracking
- Add US5 → archive/restore/delete lifecycle
- Add US6 → history and audit trail
- Add US7 → CSV portability
- Add US8 → dark mode + responsive polish
- Add US9 → UX refinements
- Final: Polish phase (docs, audits, full E2E suite)

### Two-Agent Parallel Strategy (per plan.md execution approach)

1. Agent A (worktree): Phase 2 Stream A + Phase 9 US7 lambda-api work
2. Agent B (worktree): Phase 1 Setup + Phase 2 Stream F + Phases 3–11 frontend
3. Integration session: Phase 12 Polish (wiring, docs, full E2E run)

---

## Notes

- **95 tasks total**: Setup (11) + Foundational (17) + US1–US9 (55) + Polish (12)
- **[P] tasks**: 28 parallelizable tasks across all phases
- **Test tasks**: 11 unit test tasks (per FR-021 Testing Library requirement and constitution §II)
- **webkit compatibility**: All submit buttons use `type="button"` + `onClick={doSubmit}` pattern per CLAUDE.md; `data-testid` attributes follow the monorepo E2E selector contract
- **ConfirmDialog**: `role="dialog"` on inner div per Angular pattern in CLAUDE.md — required for Playwright `[role="dialog"]` selectors
- **Route ordering**: CSV routes (`/export`, `/sample-csv`, `/import`) MUST be defined before `/:id` in Hono to prevent path collision
- **Cursor pagination**: Encoded as opaque base64 token; clients treat it as a black box; not stable across data mutations (acceptable at job-tracker scale)
- **DynamoDB note**: No PostgreSQL schema for this stack — DATABASE_ARCHITECTURE.md update in Polish phase explicitly documents DynamoDB shared-table approach
