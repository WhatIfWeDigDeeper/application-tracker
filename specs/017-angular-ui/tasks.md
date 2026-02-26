---
description: "Task list for Angular UI"
---

# Tasks: Angular UI

**Input**: Design documents from `/specs/017-angular-ui/`
**Specification**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)
**Project**: Angular UI (frontend), Go Gin API (backend — spec 016)

**Organization**: Tasks grouped by phase. All phases are sequential.

## Dependencies & Execution Order

- Phase 1 (Scaffolding) must complete before all other phases
- Phase 2 (Models + Service) must complete before Phases 3–7 (components depend on service and types)
- Phases 3, 4, 5, 6, 7 (features) are independent of each other — can be done in any order
- Phase 8 (Unit Tests) can run alongside feature phases — write tests for each feature as it's built
- Phase 9 (Project Integration) requires Phase 10 to pass first
- Phase 11 (E2E + Docs) is the final phase

---

## Phase 1: Scaffolding

**Purpose**: Create Angular project, configure Tailwind, proxy, and Jest test runner

- [ ] T001 Scaffold project: `ng new angular-ui --routing --style=css --ssr=false --standalone` inside the monorepo root; remove default Karma/Jasmine test setup
- [ ] T002 Update `angular.json`: set dev server port to 3060; add `proxyConfig: "proxy.conf.json"`; configure build output to `dist/angular-ui`
- [ ] T003 Create `proxy.conf.json`: route `/api` → `http://localhost:5070` with `changeOrigin: true`
- [ ] T004 Install Tailwind CSS 4.x: `npm install tailwindcss @tailwindcss/postcss postcss`; create `tailwind.config.js` and `postcss.config.js`; replace `src/styles.css` content with Tailwind imports
- [ ] T005 Install Jest and testing libraries: `npm install --save-dev jest jest-preset-angular @testing-library/angular @testing-library/user-event @testing-library/jest-dom @types/jest`
- [ ] T006 Create `jest.config.js` using `jest-preset-angular`; create `tsconfig.spec.json` pointing to Jest setup; add `"test"` builder in `angular.json` to use `@angular-builders/jest:run` (or configure Jest directly)
- [ ] T007 Update `tsconfig.json`: enable strict mode, `strictNullChecks`, `noImplicitAny`; ensure base config is correct
- [ ] T008 Verify scaffolding: `ng build` compiles, `ng test --watch=false` runs (0 tests is OK at this point)

**Checkpoint**: `ng build` and `ng test --watch=false` both exit 0; dev server starts on port 3060

---

## Phase 2: Models and Application Service

**Purpose**: Define all TypeScript types and the centralized HTTP service

- [ ] T009 Create `src/app/core/models/application.model.ts` with:
  - Enums: `ApplicationStatus`, `CompanyCategory`, `JobSource`, `SkillsMatch`, `PerformanceRating`
  - Interfaces: `InterviewStage`, `JobApplication` (all 36 fields matching API response)
  - `PaginatedResponse<T>` generic interface `{ data: T[]; total: number }`
  - `HistoryEntry` with `id`, `sequenceNumber`, `description`, `createdAt`, `diffs` (field-level old/new)
  - `ImportResult` with `imported`, `skipped`, `errors` (array of `{ row: number; message: string }`)
  - `FilterParams` interface for list query parameters
- [ ] T010 Create `src/app/core/services/application.service.ts` using `HttpClient` (inject via `inject(HttpClient)`):
  - `list(params: FilterParams): Observable<PaginatedResponse<JobApplication>>`
  - `get(id: string): Observable<JobApplication>`
  - `create(data: Partial<JobApplication>): Observable<JobApplication>`
  - `update(id: string, data: Partial<JobApplication>): Observable<JobApplication>`
  - `delete(id: string): Observable<void>`
  - `archive(id: string): Observable<JobApplication>`
  - `restore(id: string): Observable<JobApplication>`
  - `getHistory(id: string): Observable<HistoryEntry[]>`
  - `restoreHistory(id: string, historyId: string): Observable<JobApplication>`
  - `addStage(id: string, stage: Partial<InterviewStage>): Observable<JobApplication>`
  - `updateStage(id: string, stageId: string, stage: Partial<InterviewStage>): Observable<JobApplication>`
  - `removeStage(id: string, stageId: string): Observable<JobApplication>`
  - `importCSV(file: File): Observable<ImportResult>`
  - `exportCSV(): Observable<Blob>`
  - `getTemplate(): Observable<Blob>`
- [ ] T011 Create `src/app/core/guards/unsaved-changes.guard.ts` — `CanDeactivateFn` that checks a `isDirty` signal on the component; prompts user with `window.confirm` if dirty

**Checkpoint**: Service compiles with no TypeScript errors; all method signatures are typed

---

## Phase 3: Application List

**Purpose**: Main list view with filtering, sorting, pagination, and quick actions

- [ ] T012 Create `src/app/features/application-list/application-list.component.ts` (standalone):
  - Signals: `applications = signal<JobApplication[]>([])`, `total = signal(0)`, `loading = signal(false)`, `currentPage = signal(1)`, `filters = signal<FilterParams>({ sortBy: 'updatedAt', sortDir: 'desc', limit: 20 })`
  - `effect()` to call `applicationService.list()` whenever `filters()` or `currentPage()` changes; update `applications` and `total` signals
  - Methods: `onFilterChange(key, value)`, `onSortChange(field)`, `onPageChange(page)`, `onArchive(id)`, `onRestore(id)`, `onDelete(id)`
- [ ] T013 Create `src/app/features/application-list/application-list.component.html`:
  - Filter controls: status dropdown, company category, job source, skills match, archived toggle — all bound to `filters` signal
  - Sort headers: click to toggle field + direction
  - Application rows: company name, position, status badge, dateApplied, updatedAt, action buttons (view, archive/restore, delete)
  - Pagination: previous/next buttons, "Showing X-Y of N" text
  - Empty state message when `total() === 0`
  - Use element IDs and button text matching the shared E2E selector contract

**Checkpoint**: List page renders, filter/sort/page controls update the list

---

## Phase 4: Application Detail (Create + Edit)

**Purpose**: Full form for creating and editing applications, with interview stage management

- [ ] T014 Create `src/app/features/application-detail/application-detail.component.ts` (standalone):
  - Inject `ActivatedRoute` and `ApplicationService`
  - `isNew = computed(() => !this.route.snapshot.params['id'])`
  - `application = signal<JobApplication | null>(null)` — load on init for edit mode
  - Build typed `FormGroup` with controls for all 36 application fields
  - `isDirty = signal(false)` — set to true on any form value change; reset on save
  - Status/dateApplied constraint: `effect()` watching the `status` form control — set `dateApplied` to null when `unsubmitted`; auto-set today when transitioning away from `unsubmitted` and date is null
  - `onSubmit()` — call `create()` or `update()` based on `isNew`; navigate to list on success
  - `onDelete()` — confirm then delete; navigate to list
  - `onArchive()` / `onRestore()` — call service; reload application
- [ ] T015 Create `src/app/features/application-detail/application-detail.component.html`:
  - Form groups for: basic info (company, position, status, dateApplied), URLs (companyUrl, jobPostingUrl, companyCareerUrl), classification (companyCategory, skillsMatch, jobSource), compensation (salaryMin, salaryMax, offerDueDate), flags (coverLetterRequired), text areas (specialRequirements, notes)
  - Hide `dateApplied` field when status is `unsubmitted`
  - Interview stages section: list current stages with inline edit controls; add stage button
  - Save / Delete / Archive buttons; unsaved changes indicator when form is dirty
- [ ] T016 Add interview stage sub-components within the detail view:
  - Display stage list with name, order, isCompleted toggle, performanceRating, notes
  - Add stage form (inline): name input + submit
  - Edit stage: inline edit of name, notes, performanceRating
  - Remove stage: delete button with confirmation
- [ ] T017 Register `CanDeactivate` guard on the detail route in `app.routes.ts`

**Checkpoint**: Create, edit, and delete applications; interview stages add/update/remove; unsubmitted → dateApplied hidden

---

## Phase 5: History Panel

**Purpose**: Slide-in history timeline with field-level diffs and restore-to-version

- [ ] T018 Create `src/app/features/history-panel/history-panel.component.ts` (standalone):
  - `@Input() applicationId: string`
  - `isOpen = signal(false)` — toggle on open/close
  - `history = signal<HistoryEntry[]>([])`
  - `expandedEntries = signal<Set<string>>(new Set())` — which entries show diffs
  - `open()` — set `isOpen(true)`, call `applicationService.getHistory()`, update signal
  - `toggleEntry(id)` — add/remove from expandedEntries
  - `onRestore(historyId)` — call `restoreHistory()`, emit `restored` output event, close panel
- [ ] T019 Create `src/app/features/history-panel/history-panel.component.html`:
  - Slide-in panel from right (CSS transform + transition)
  - Overlay backdrop that closes panel on click
  - Timeline: entries newest-first, each showing description + relative timestamp
  - Expandable diffs: old value (struck-through red) vs new value (green); unchanged fields hidden
  - "Restore to this point" button on non-current entries
  - "History" button in application-detail that opens the panel
- [ ] T020 Wire history panel into `application-detail.component`: add "History" button; include `<app-history-panel>` in template; handle `restored` event by reloading application

**Checkpoint**: History panel opens, shows diffs, restore updates the application form

---

## Phase 6: CSV Import / Export / Template

**Purpose**: CSV bulk import, full export, and template download

- [ ] T021 Create `src/app/features/csv/csv-import.component.ts` (standalone):
  - File input for `.csv` files
  - `onFileSelected(event)` — capture file reference
  - `onImport()` — call `applicationService.importCSV(file)`, store `ImportResult` in signal
  - Display result summary: "Imported: N | Skipped: N | Errors: N"
  - Expandable error list: row number + message for each error
- [ ] T022 Create `src/app/features/csv/csv-export.component.ts` (standalone):
  - "Export CSV" button — calls `applicationService.exportCSV()`, creates object URL from Blob, triggers download with filename `applications-YYYY-MM-DD.csv`
  - "Download Template" button — calls `applicationService.getTemplate()`, triggers download with filename `applications-template.csv`
- [ ] T023 Add CSV import/export controls to the application-list view (buttons in the header/toolbar area)

**Checkpoint**: Import shows result counts; export and template download files with correct names

---

## Phase 7: Shared Components

**Purpose**: Inline editing, resizable textareas, header, and date pipe

- [ ] T024 Create `src/app/shared/components/header/header.component.ts` — app name, subtitle "(Angular - Go Gin - pgx/sqlc)", navigation link to home
- [ ] T025 Create `src/app/shared/components/inline-edit/inline-edit.component.ts`:
  - `@Input() value: string`; `@Output() saved = new EventEmitter<string>()`
  - Display value as text; click to switch to input; blur or Enter to save; Escape to cancel
  - Used for companyName, positionTitle on the list view
- [ ] T026 Create `src/app/shared/components/resizable-textarea/resizable-textarea.component.ts`:
  - Wraps `<textarea>` with auto-resize on input event (set height to `scrollHeight`)
  - `@Input() formControl` or `[formControlName]` passthrough for use inside reactive forms
- [ ] T027 Create `src/app/shared/pipes/relative-date.pipe.ts` — transform ISO date string to "2 days ago", "just now", "1 month ago" etc.
- [ ] T028 Update `app.component.ts` and `app.component.html` — include `<app-header>` and `<router-outlet>`; apply global layout styles

**Checkpoint**: Header renders; inline-edit and resizable-textarea work in isolation

---

## Phase 8: Unit Tests

**Purpose**: `@testing-library/angular` test files for service and feature components

- [ ] T029 Create `src/app/core/services/application.service.spec.ts`:
  - Use `HttpClientTestingModule` + `HttpTestingController`
  - Test `list()` — verify correct query params sent; returns typed response
  - Test `create()` — verify POST body; returns `JobApplication`
  - Test `importCSV()` — verify multipart request; parses `ImportResult`
- [ ] T030 Create `src/app/features/application-list/application-list.component.spec.ts`:
  - Mock `ApplicationService` with a spy returning test data
  - `render(ApplicationListComponent, { imports: [...] })`
  - Verify applications appear: `getByText('Acme Corp')`
  - Verify filter dropdown changes trigger service call
  - Verify archive button calls `service.archive(id)`
- [ ] T031 Create `src/app/features/application-detail/application-detail.component.spec.ts`:
  - Test create mode: verify all required fields present (`getByLabelText('Company Name')`)
  - Test status/dateApplied constraint: set status to 'unsubmitted', verify dateApplied field is hidden
  - Test form validation: submit empty form, verify required field error messages appear
  - Test unsaved changes: fill form, navigate away, verify guard prompts
- [ ] T032 Create `src/app/features/history-panel/history-panel.component.spec.ts`:
  - Render with mock history entries
  - Verify entries render with description text
  - Click entry to expand, verify diff fields visible
  - Click "Restore to this point", verify `restored` output emitted
- [ ] T033 Create `src/app/features/csv/csv-import.component.spec.ts`:
  - Mock service `importCSV()` returning `{ imported: 3, skipped: 1, errors: [] }`
  - Verify result summary displays "Imported: 3 | Skipped: 1"
  - Mock service returning errors, verify error list renders

**Checkpoint**: `ng test --watch=false` — all unit tests pass

---

## Phase 9: Project Integration

**Purpose**: Wire angular-ui into monorepo scripts, Playwright, and docker-compose

- [ ] T034 Add individual scripts to root `package.json`:
  - `"dev:angular-ui": "cd angular-ui && ng serve --port 3060"`
  - `"build:angular-ui": "cd angular-ui && ng build"`
  - `"lint:angular-ui": "cd angular-ui && ng lint"`
  - `"test:angular-ui": "cd angular-ui && ng test --watch=false"`
  - `"audit:ci:angular-ui": "cd angular-ui && npx -y audit-ci --config .auditconfig.json"`
  - `"install:angular-ui": "cd angular-ui && npm install"`
  - `"docs:types:angular-ui": "cd angular-ui && npx ts-to-mermaid src/app/core/models/application.model.ts -o ../docs/types/angular-ui/"`
  - `"test:e2e:angular": "TEST_UI_PORT=3060 PLAYWRIGHT_HTML_OPEN=never npx -y playwright test"`
- [ ] T035 Add composite stack scripts:
  - `"build:angular": "npm run build:angular-ui"`
  - `"install:angular": "npm run install:angular-ui"`
- [ ] T036 Append `angular-ui` to all `:all` composite scripts:
  - `build:all` — append `&& npm run build:angular`
  - `lint:all` — append `&& npm run lint:angular-ui`
  - `test:all` — append `&& npm run test:angular-ui`
  - `audit:ci:all` — append `&& npm run audit:ci:angular-ui`
  - `install:all` — append `&& npm run install:angular`
  - `docs:types` — append `&& npm run docs:types:angular-ui`
  - `test:e2e:all` — append `&& npm run test:e2e:angular`
- [ ] T037 Add `3060: 'cd angular-ui && npm run dev'` to `webServerCommands` in `playwright.config.ts`
- [ ] T038 Add port 3060 to `scripts/stop-all.sh` PORTS array: `3060  # Angular UI`
- [ ] T039 Add `angular-ui` service to `docker-compose-all.yml`: port 3060:3060, environment `API_URL=http://go-api:5070`; depends on `go-api`
- [ ] T040 Create `angular-ui/.auditconfig.json` — copy format from another UI package's `.auditconfig.json`

**Checkpoint**: `npm run build:angular && npm run lint:angular-ui && npm run test:angular-ui` all pass

---

## Phase 10: Validation

**Purpose**: Confirm full build, lint, and unit test chain is green

- [ ] T041 Run `npm run build:angular-ui` — `ng build` exits 0, no TypeScript errors
- [ ] T042 Run `npm run lint:angular-ui` — ESLint exits 0
- [ ] T043 Run `npm run test:angular-ui` — all Jest unit tests pass
- [ ] T044 Run `npm run build:all && npm run lint:all && npm run test:all` — no regressions in existing stacks

**Checkpoint**: All validation gates green

---

## Phase 11: E2E Tests and Documentation

**Purpose**: Run shared Playwright suite, fix any selector issues, update all documentation

- [ ] T045 Start Go API (port 5070) + Angular UI (port 3060); manually verify:
  - Application list loads
  - Create, edit, delete application works
  - Filter and sort work
  - History panel opens and restores
  - CSV import shows result summary; export downloads file
- [ ] T046 Run `npm run test:e2e:angular` — all 13 shared E2E tests pass
- [ ] T047 Fix any E2E failures (selector contract mismatches, timing issues, unsubmitted status edge cases)
- [ ] T048 Update `README.md`: add Angular UI row to implementations table; add `dev:angular-ui` to running instructions; add `test:angular-ui` and `test:e2e:angular` to test commands; note Go API prerequisite for Angular UI
- [ ] T049 Run `npm run test:e2e:all` — all existing E2E stacks still pass (no regressions)

**Checkpoint**: All E2E tests green; documentation complete; implementation ready for PR

---

## Summary

**Total Tasks**: 49
**Phases**:
- Phase 1 (Scaffolding): 8 tasks — ng new, Tailwind, proxy, Jest config
- Phase 2 (Models + Service): 3 tasks — types, HttpClient service, guard
- Phase 3 (Application List): 2 tasks — list component + template
- Phase 4 (Application Detail): 4 tasks — form, stages, guard wiring
- Phase 5 (History Panel): 3 tasks — panel component, template, wiring
- Phase 6 (CSV): 3 tasks — import, export, integration into list
- Phase 7 (Shared Components): 5 tasks — header, inline-edit, textarea, pipe, root
- Phase 8 (Unit Tests): 5 tasks — service + 4 feature component specs
- Phase 9 (Project Integration): 7 tasks — package.json, playwright, stop-all, docker-compose
- Phase 10 (Validation): 4 tasks — ng build/lint/test + full monorepo
- Phase 11 (E2E + Docs): 5 tasks — manual verify, E2E, fixes, README

**Parallel opportunities**: Phases 3–7 (features) are independent — an agent team could implement application-list, application-detail, history-panel, CSV, and shared components concurrently after Phase 2 completes.
