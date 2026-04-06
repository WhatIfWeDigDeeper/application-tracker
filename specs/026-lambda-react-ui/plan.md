# Implementation Plan: Lambda React UI

**Branch**: `026-lambda-react-ui` | **Date**: 2026-04-05 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/026-lambda-react-ui/spec.md`

## Summary

Build `lambda-react-ui`, a new React 19 + Zustand + Vite SPA running on port 3090, styled after the UI redesign mockup (`docs/ui-redesign-mockup.html`) with a three-column responsive layout (collapsible sidebar, application grid, slideable context panel). It pairs with `lambda-api` (port 5090, Hono + DynamoDB) and implements all 9 core features from `specs/core`. Additionally, the lambda-api backend gains three new CSV endpoints (export, import, sample template) and an opt-in cursor-based pagination mode on the existing list endpoint.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: React 19, Vite 6.x, Zustand 5.0.12, React Router 7.13.1, Tailwind CSS 4.x, @testing-library/react, Vitest  
**Storage**: DynamoDB (via lambda-api — no direct DB access from frontend)  
**Testing**: Vitest + @testing-library/react (unit), Playwright (E2E)  
**Target Platform**: Browser SPA (all modern browsers)  
**Project Type**: Web application (new frontend + lambda-api backend additions)  
**Performance Goals**: Page load < 2s; interactions at 60fps; bundle size consistent with react-ui baseline  
**Constraints**: All 8 shared E2E tests must pass; TypeScript strict mode; ESLint zero warnings; WCAG 2.1 AA  
**Scale/Scope**: Single-user personal job tracker; ~50 screens-worth of components; 29 functional requirements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Build Gate | ✅ PASS | Vite build; TypeScript strict compilation |
| Lint Gate | ✅ PASS | ESLint config mirrors react-ui; zero-warning policy |
| Test Gate | ✅ PASS | Unit tests via Vitest + Testing Library; E2E via shared Playwright suite |
| Type Gate | ✅ PASS | TypeScript strict mode; `any` prohibited |
| Performance Gate | ✅ PASS | Lazy route loading; code splitting; memoized Zustand selectors |
| Accessibility Gate | ✅ PASS | Keyboard-accessible UI; ARIA labels on all interactive elements; ConfirmDialog has `role="dialog"` |

No violations. No complexity table required.

## Project Structure

### Documentation (this feature)

```text
specs/026-lambda-react-ui/
├── plan.md              ← This file
├── spec.md              ← Feature specification
├── research.md          ← Phase 0 decisions
├── data-model.md        ← Type definitions + Zustand store shapes
├── quickstart.md        ← Dev setup guide
├── contracts/
│   └── lambda-api-additions.md  ← New API endpoint contracts
└── checklists/
    └── requirements.md  ← Spec quality checklist
```

### Source Code

```text
lambda-react-ui/                    ← NEW package (Vite + React + Zustand)
├── .auditconfig.json
├── eslint.config.js
├── index.html
├── package.json                    ← react, react-dom, react-router-dom, zustand, tailwindcss
├── postcss.config.js
├── tsconfig.json                   ← strict: true
├── tsconfig.node.json
├── vite.config.ts                  ← port 3090; proxy /api → localhost:5090
└── src/
    ├── main.tsx                    ← ReactDOM.createRoot + RouterProvider
    ├── App.tsx                     ← Layout: Sidebar + Main + ContextPanel (Outlet)
    ├── router.tsx                  ← createBrowserRouter (lazy routes)
    ├── index.css                   ← Tailwind directives + CSS vars from mockup
    ├── vite-env.d.ts
    ├── types/
    │   └── application.ts          ← Application, InterviewStage, HistoryEntry, Filter/Sort types
    ├── stores/
    │   ├── applicationStore.ts     ← Zustand: list state, CRUD actions, selection
    │   ├── filterStore.ts          ← Zustand: filter/sort state + actions
    │   └── uiStore.ts              ← Zustand: sidebar, panel, theme, viewMode (localStorage persist)
    ├── services/
    │   └── api.ts                  ← Fetch wrappers; ApiError class; CSV upload/download
    ├── lib/
    │   ├── constants.ts            ← STATUS_COLORS, labels, DEFAULT_INTERVIEW_STAGES
    │   └── utils.ts                ← cn(), formatDate(), formatSalaryRange(), getDaysUntil()
    ├── hooks/
    │   └── useApplications.ts      ← Bridges Zustand store + filter store for list page
    ├── components/
    │   ├── layout/
    │   │   ├── Sidebar.tsx         ← Nav links, theme toggle, import/export buttons, collapse
    │   │   ├── PipelineSummaryBar.tsx   ← Status counts + click-to-filter
    │   │   └── ContextPanel.tsx    ← Tab container (Details / Interview / History)
    │   ├── applications/
    │   │   ├── ApplicationCard.tsx ← Card + list-row views; action menu; offer expiry
    │   │   ├── ApplicationList.tsx ← Grid/list toggle; empty state; pagination
    │   │   ├── ApplicationForm.tsx ← Create/edit fields; validation; dirty tracking
    │   │   ├── FilterBar.tsx       ← Status, category, source, skills, archived filters
    │   │   ├── HistoryPanel.tsx    ← Entry list; field diffs; restore button
    │   │   ├── FieldDiff.tsx       ← Single field change display
    │   │   └── CsvImportModal.tsx  ← File picker; import progress; result summary
    │   ├── interviews/
    │   │   ├── InterviewStageList.tsx   ← Timeline; default stages; progress bar
    │   │   ├── InterviewStageItem.tsx   ← Stage row; completion toggle; edit/delete
    │   │   └── InterviewStageForm.tsx   ← Inline form for add/edit
    │   └── ui/
    │       ├── Badge.tsx           ← Status badge with mockup color palette
    │       ├── Button.tsx          ← variant (primary, secondary, danger, ghost)
    │       ├── ConfirmDialog.tsx   ← role="dialog"; blocks window.confirm() usage
    │       ├── EmptyState.tsx      ← Icon + message + optional action
    │       ├── Input.tsx           ← text/date/number inputs with error display
    │       ├── Modal.tsx           ← Portal; Escape + backdrop close
    │       ├── Pagination.tsx      ← Prev/page-numbers/Next
    │       ├── Rating.tsx          ← RatingDisplay + RatingInput (5 stars)
    │       ├── Select.tsx          ← Dropdown with options array
    │       └── TextArea.tsx        ← Resizable with localStorage height persistence
    └── pages/
        ├── ListPage.tsx            ← PipelineSummaryBar + FilterBar + ApplicationList
        └── ApplicationEditPage.tsx ← Full-page create/edit; useBlocker; HistoryPanel toggle

lambda-api/src/                     ← ADDITIONS to existing package
├── routes/applications.ts          ← +3 new routes (export, import, sample-csv); +cursor support
├── services/
│   ├── application.service.ts      ← +cursor pagination logic in listApplications
│   └── csv.service.ts              ← NEW: CSV serialize/parse; import/export logic
└── types/
    └── api.ts                      ← +CursorPaginatedApplicationsSchema, ImportResultSchema
```

## Implementation Tasks

### Stream A: Lambda-API Backend Additions (independent)

**A1. Add CSV service module**
- Create `lambda-api/src/services/csv.service.ts`
- `serializeToCSV(applications: Application[]): string` — uses character-by-character CSV serializer; handles commas, quotes, newlines in field values
- `parseCSV(text: string): Record<string, string>[]` — character-by-character parser tracking `inQuotes` state; never pre-splits by newline
- `exportApplications(pool): Promise<string>` — fetches all apps via `listApplications` (includeArchived=true, limit=1000), serializes to CSV
- `importApplications(csvText: string, pool): Promise<ImportResult>` — parses CSV, checks duplicates by `jobPostingUrl`, creates valid rows

**A2. Add new type schemas to api.ts**
- `CursorPaginatedApplicationsSchema` — `{ items, limit, nextCursor: z.string().nullable(), hasMore }`
- `ImportResultSchema` — `{ imported, skipped, failed, errors: z.array(z.string()) }`
- Update `ListApplicationsQuerySchema` to add optional `cursor: z.string().optional()`

**A3. Add cursor pagination to application.service.ts**
- In `listApplications`: detect if `cursor` param is present
- If cursor present: decode base64 → `{ page, limit }`; run existing offset logic; encode next page as base64 cursor; return `CursorPaginatedApplicationsResponse`
- If cursor absent: return existing `PaginatedApplicationsResponse` (no behavior change)

**A4. Add new routes to routes/applications.ts**
- `GET /export` — calls `csvService.exportApplications`; responds with `text/csv` + download headers
- `GET /sample-csv` — responds with header-only CSV; download headers
- `POST /import` — parses `multipart/form-data` file field; calls `csvService.importApplications`; returns `ImportResult`
- **CRITICAL**: Define these 3 routes BEFORE `GET /:id` to prevent path collision with Hono's param matching
- Update cursor branch in `GET /` route handler to return `CursorPaginatedApplicationsResponse` when cursor param present

**A5. Unit tests for CSV service**
- Add to `lambda-api/src/__tests__/` (or alongside service): test `serializeToCSV`, `parseCSV` (including multi-line quoted fields), import duplicate detection, export column order
- Run `npm run test:lambda-api` to confirm

**A6. Update lambda-api vitest.config.ts**
- Verify `include` pattern covers new test files; update if needed

---

### Stream B: lambda-react-ui Frontend (independent)

**B1. Scaffold package**
- Create `lambda-react-ui/` with Vite + React + TypeScript template
- Configure `vite.config.ts`: port 3090, proxy `/api` → `http://localhost:5090`
- Install exact versions: `react@19.x`, `react-dom@19.x`, `react-router-dom@7.13.1`, `zustand@5.0.12`, `tailwindcss@4.x`, `@testing-library/react`, `@testing-library/jest-dom`, `vitest`
- Configure `tsconfig.json` with `strict: true`
- Create `.auditconfig.json` with `{ "allowlist": [], "high": true, "package-manager": "auto" }`
- Configure ESLint (mirror react-ui eslint.config.js)
- Create `postcss.config.js` for Tailwind
- Confirm `npm run build:lambda-react-ui` compiles cleanly

**B2. CSS variables and Tailwind config**
- Copy CSS variable definitions from `docs/ui-redesign-mockup.html` into `src/index.css`
- Define light and dark theme variables (surfaces, text, accent #4F46E5, 8 status colors)
- Configure Tailwind to use CSS variables for colors
- Add `DM Sans` (UI text) and `JetBrains Mono` (monospace) font imports

**B3. Types and constants**
- `src/types/application.ts` — all domain types from data-model.md
- `src/lib/constants.ts` — `STATUS_COLORS`, `STATUS_LABELS`, `CATEGORY_LABELS`, `SOURCE_LABELS`, `DEFAULT_INTERVIEW_STAGES`
- `src/lib/utils.ts` — `cn()`, `formatDate()`, `formatSalaryRange()`, `getDaysUntil()`, `isOverdue()`, `getTodayDate()`

**B4. Zustand stores**
- `src/stores/uiStore.ts` — sidebar collapse, panel open/tab, dark mode (localStorage `app-theme`), view mode (localStorage `app-view-mode`)
  - Initialize from localStorage on store creation
  - `darkMode` toggle: add/remove `.dark` class on `<html>`
- `src/stores/filterStore.ts` — filter state + sort state + clear action + `activeFilterCount()`
- `src/stores/applicationStore.ts` — list state + selection + CRUD actions (stub API calls for now)

**B5. API service**
- `src/services/api.ts` — fetch wrappers with `ApiError` class
  - `API_BASE_URL = import.meta.env.VITE_API_URL || "/api"`
  - All existing lambda-api endpoints (CRUD, archive/restore, stages, history)
  - New endpoints: `exportCSV()` → triggers file download; `importCSV(file: File)` → returns `ImportResult`; `downloadSampleCSV()` → triggers template download

**B6. UI component library** (`src/components/ui/`)
- `Button.tsx` — variant: primary (indigo), secondary, danger (rose), ghost
- `Badge.tsx` — maps ApplicationStatus to CSS variable colors from mockup
- `Input.tsx` — text/date/number with error display
- `TextArea.tsx` — resizable; reads/saves height from localStorage key `textarea-height-<field>`
- `Select.tsx` — standard HTML select with label
- `Modal.tsx` — React portal; Escape key + overlay click to close
- `ConfirmDialog.tsx` — extends Modal; `role="dialog"` on inner div; confirm/cancel buttons
- `Rating.tsx` — `RatingDisplay` (stars read-only) + `RatingInput` (click to set 1–5)
- `Pagination.tsx` — Prev / page numbers / Next; highlights active page
- `EmptyState.tsx` — icon + title + description + optional CTA button

**B7. Router and app shell**
- `src/router.tsx` — `createBrowserRouter` with lazy ListPage and ApplicationEditPage
- `src/App.tsx` — three-column CSS grid: `Sidebar (240px) | main (1fr) | ContextPanel (380px)`;  apply `.dark` class based on uiStore; responsive breakpoints matching mockup
- `src/main.tsx` — `createRoot` + `RouterProvider`

**B8. Sidebar component**
- `src/components/layout/Sidebar.tsx`
- Logo + "AppTracker" text + collapse toggle (chevron rotation)
- Nav links: Pipeline (active = status filter cleared), All Applications (count badge), Archived (count badge)
- Attention stats: counts of interviewing, expiring offers, applied this week
- Footer: theme toggle, Import (opens CsvImportModal), Export (calls api.exportCSV)
- Collapsed state: icon-only rail (56px wide)
- Mobile: hidden entirely; bottom nav shows instead

**B9. Pipeline Summary Bar**
- `src/components/layout/PipelineSummaryBar.tsx`
- 5 segments: Draft/Applied/Interviewing/Offered/Closed with counts from `applicationStore.total` broken down by status
- Click segment → sets filterStore status filter to that status group
- Active segment: filled with status color; inactive: transparent with colored top border
- Flex-weighted segments via CSS `flex` proportional to count

**B10. Filter bar**
- `src/components/applications/FilterBar.tsx`
- Status (multi-select via checkboxes or segmented toggle)
- Company category (select)
- Job source (select)
- Skills match minimum (select: 2+, 3+, 4+, 5 stars)
- Include archived (checkbox)
- Sort by (select) + sort direction (asc/desc toggle button)
- Clear filters button (shows active count badge)
- "Showing X of Y applications" result text with active filter labels

**B11. Application card and list**
- `src/components/applications/ApplicationCard.tsx`
  - Grid view: card with left status border, gradient avatar, status badge, date, category, skill stars, salary, interview progress bar, offer expiry banner (if applicable)
  - List view: compact horizontal row (same data, reduced height)
  - Hover: translateY(-1px), thicker border
  - Action menu (⋯): Archive/Restore, Delete — visible on hover; opens ConfirmDialog for destructive actions
  - Click card → calls `applicationStore.selectApplication(id)` + `uiStore.openPanel('details')`
  - Selected: accent border ring
- `src/components/applications/ApplicationList.tsx`
  - Grid (2-col) or list view based on `uiStore.viewMode`
  - Skeleton loading (3 placeholder cards)
  - EmptyState with/without filters active
  - Pagination controls below list

**B12. Context panel**
- `src/components/layout/ContextPanel.tsx`
  - Sticky header: company/position, close (X) button, 3 tabs (Details, Interview, History)
  - Desktop: right column (380px); tablet: fixed overlay slide-in from right + backdrop blur; mobile: full-width overlay
  - Tab content rendered by `ContextPanel` using `uiStore.panelTab`
- **Details tab**: Status pills (click to change status), application info fields, compensation, links, notes, cover letter, footer actions (Edit, Archive, Delete)
- **Interview tab**: `InterviewStageList` component
- **History tab**: `HistoryPanel` component

**B13. Application form (create/edit)**
- `src/components/applications/ApplicationForm.tsx`
  - Sections: Basic Info (companyName, positionTitle, dateApplied, status), Company Details (category, source, URLs), Assessment (skillsMatch, coverLetterRequired, specialRequirements), Compensation (salaryMin, salaryMax), Notes
  - Validation: required fields, URL format, salaryMin ≤ salaryMax, char limits
  - Status side effects: unsubmitted ↔ non-unsubmitted auto-populates/clears dateApplied
  - Terminal status check: disable "accepted offer" / "declined offer" transitions from those states
- `src/pages/ApplicationEditPage.tsx`
  - Route: `/applications/new` and `/applications/:id`
  - `useBlocker` for unsaved changes (requires `createBrowserRouter`)
  - Loads application by ID from `applicationStore`; creates new if `/new`
  - Shows HistoryPanel toggle button (opens context panel to history tab)
  - Redirects to `/applications/:id` after successful create

**B14. Interview stages**
- `src/components/interviews/InterviewStageItem.tsx` — stage row: completion toggle (checkbox), name, date, rating, edit/delete buttons
- `src/components/interviews/InterviewStageForm.tsx` — inline form for add/edit: name, order, isCompleted, completedDate, notes, rating
- `src/components/interviews/InterviewStageList.tsx`
  - Vertical timeline layout matching mockup (green/amber/empty dots)
  - Progress bar (X of Y stages completed)
  - "Add Stage" button → inline form below list
  - "Add Default Stages" button when list is empty → calls `applicationStore.addDefaultStages(appId)`
  - On status change to "interviewing" with no stages: auto-calls addDefaultStages

**B15. History panel**
- `src/components/applications/HistoryPanel.tsx`
  - Entry list with timestamp, description, field-level diffs
  - `FieldDiff.tsx` — shows old → new value with label
  - "Restore to this version" button per entry (disabled for latest)
  - Pagination (load more)
  - Relative time formatting

**B16. CSV Import modal**
- `src/components/applications/CsvImportModal.tsx`
  - File picker input (accept=".csv")
  - Template download button → `api.downloadSampleCSV()`
  - Import button → calls `api.importCSV(file)` → shows `ImportResult` summary
  - Result display: "Imported: 5 | Skipped: 2 | Failed: 1" + error list

**B17. Responsive layout**
- Implement CSS media queries in `App.tsx` matching mockup breakpoints:
  - `≤1200px`: sidebar collapses to icon rail; panel becomes fixed overlay + backdrop
  - `≤768px`: sidebar hidden; bottom nav bar (Pipeline/All/Archived/Theme)
- Mobile bottom nav: `Sidebar.tsx` renders a `<nav>` at bottom instead of left rail
- Panel backdrop: semi-transparent + blur; click to close
- Cards: single column at ≤768px; 2-column at desktop

**B18. Unit tests**
- Use `@testing-library/react` + Vitest + jsdom
- Test files colocated in `src/` or in `src/__tests__/`
- Coverage targets (per constitution §II):
  - `uiStore.ts` — dark mode toggle, view mode, panel state
  - `filterStore.ts` — filter setters, clearFilters, activeFilterCount
  - `applicationStore.ts` — state updates on fetch/create/delete
  - `utils.ts` — formatDate, formatSalaryRange, getDaysUntil
  - `ApplicationCard.tsx` — renders with application data; action menu; offer expiry banner
  - `ConfirmDialog.tsx` — opens, closes, calls onConfirm/onCancel, has role="dialog"
  - `FilterBar.tsx` — filter controls render; clear button shows count
  - `Pagination.tsx` — page navigation; active page highlighted
- Run: `npm run test:lambda-react-ui`

---

### Stream C: Integration and Wiring (after A + B)

**C1. Register in root package.json scripts**
- Follow the exact monorepo script naming pattern:
```json
"dev:lambda-react-ui": "cd lambda-react-ui && npm run dev",
"build:lambda-react-ui": "cd lambda-react-ui && npm run build",
"lint:lambda-react-ui": "cd lambda-react-ui && npm run lint",
"test:lambda-react-ui": "cd lambda-react-ui && npm test",
"test:e2e:lambda-react-ui": "TEST_UI_PORT=3090 npx playwright test",
"ci:lambda-react-ui": "cd lambda-react-ui && npm ci",
"install:lambda-react-ui": "cd lambda-react-ui && npm install",
"audit:ci:lambda-react-ui": "cd lambda-react-ui && npx -y audit-ci --config .auditconfig.json"
```
- Add `lambda-react-ui` to the `build:all`, `lint:all`, `test:all`, `ci:all`, `audit:ci:all` scripts

**C2. Update stop-all.sh**
- Add port 3090 to the `PORTS` array in `scripts/stop-all.sh`

**C3. Update run-e2e.sh**
- Add `lambda-react-ui` as a valid stack name → maps to `TEST_UI_PORT=3090` + starts both lambda-api + lambda-react-ui dev servers

**C4. Update playwright.config.ts**
- Add port 3090 to `webServerCommands` map
- Add 3090 to the projects list

**C5. Update E2E test port filtering**
- `tests/e2e/csv-import-export.spec.ts` — add 3090 to `isTargetUI` port array
- `tests/e2e/history.spec.ts` — add 3090 to supported ports array (lambda-api stack supports history)

**C6. Run audit**
- `npm run audit:ci:lambda-react-ui` — fix any HIGH/CRITICAL vulnerabilities before merge
- `npm run audit:ci:lambda-api` — re-run after adding CSV multipart library if any added

**C7. Update documentation**
- `README.md`:
  - Add `lambda-react-ui` to implementations table (port 3090, Zustand state management)
  - Add npm scripts section (dev, build, lint, test, e2e, ci commands)
  - Add `lambda-api` DynamoDB schema note (no schema — DynamoDB)
  - Add Type Diagrams list entry (if TS types docs generated)
  - Update scripts TOC
- `docs/DATABASE_ARCHITECTURE.md`:
  - Add section for `lambda_react_dynamodb` / lambda-react-ui implementation noting it uses DynamoDB (not PostgreSQL), shares the `lambda_api_applications` table with lambda-api
- `docs/TESTING_REFERENCE.md`:
  - Add lambda-react-ui entry: UI port 3090, API port 5090, DynamoDB Local port 8000, startup commands
- `.vscode/launch.json`:
  - Add `Lambda React UI (port 3090)` browser debug launch configuration
- `cspell.config.yaml`:
  - Add any new terms flagged by cspell (zustand, etc.)

**C8. Run full validation chain**
```bash
npm run build:lambda-react-ui
npm run lint:lambda-react-ui
npm run lint:lambda-api      # verify no lint regressions from API changes
npm run test:lambda-react-ui
npm run test:lambda-api      # verify existing tests still pass
npm run test:api:lambda-api  # API integration tests (requires DynamoDB + lambda-api running)
bash scripts/run-e2e.sh lambda-react-ui  # Full E2E (starts servers automatically)
```

---

## Complexity Tracking

> No constitution violations.

---

## Execution Approach

**Two parallel worktree agents + one integration session**:

1. **Agent A (worktree: `026-lambda-api-csv-cursor`)** — Stream A only (lambda-api additions: CSV endpoints + cursor pagination + unit tests). Commits to feature branch.
2. **Agent B (worktree: `026-lambda-react-ui-scaffold`)** — Stream B only (full lambda-react-ui package). Commits to feature branch.
3. **Integration session (main worktree)** — Stream C: merge agents' work, wire E2E test ports, update docs, run full validation chain.

Agents A and B are independent (no shared source files) and can run concurrently. Stream C depends on both completing.
