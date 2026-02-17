---
description: "Task list for CSV Import/Export feature"
---

# Tasks: CSV Import/Export

**Input**: Design documents from `/specs/011-csv-import-export/`
**Specification**: [spec.md](./spec.md) (4 user stories, all P1)
**Depends on**: [010-nullable-date-applied](../010-nullable-date-applied/) must be completed first
**Scope**: nest-api + tanstack-ui only

**Organization**: Tasks grouped by phase — backend first, then frontend, then integration testing.

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel with other [P] tasks in the same phase

## Dependencies & Execution Order

- Phase 1 (Setup) → Phase 2 (Backend Service) → Phase 3 (Backend Controller) → Phase 4 (Backend Tests)
- Phase 5 (Frontend API + Types) → Phase 6 (Frontend Components) → Phase 7 (Frontend Integration)
- Phase 4 and Phase 5 can run in parallel (backend tests + frontend types are independent)
- Phase 8 (E2E) runs last after all other phases

---

## Phase 1: Backend Setup

**Purpose**: Install packages, register plugins, add validation schemas

- [ ] T001 Install `papaparse` (exact version) in nest-api
- [ ] T002 Install `@types/papaparse` (exact version, devDependency) in nest-api
- [ ] T003 Install `@fastify/multipart` (exact version) in nest-api
- [ ] T004 Register `@fastify/multipart` in `nest-api/src/main.ts` with `{ limits: { fileSize: 1_048_576 } }` (1 MB)
- [ ] T005 Add `CsvRowSchema` to `nest-api/src/types/api.ts` — Zod schema with string-to-type coercion for CSV values: `companyName` (required, min 1, max 200), `positionTitle` (required, min 1, max 200), `dateApplied` (optional, YYYY-MM-DD regex), `status` (optional, ApplicationStatusSchema), URL fields (optional, z.string().url()), `companyCategory`/`jobSource` (optional, enum), `skillsMatch` (optional, z.coerce.number 1-5), `coverLetterRequired` (optional, preprocess true/false strings to boolean), `salaryMin`/`salaryMax` (optional, z.coerce.number >= 0), `specialRequirements` (max 1000), `notes` (max 5000), `offerDueDate` (optional, YYYY-MM-DD)
- [ ] T006 Add `ImportResult` type to `nest-api/src/types/api.ts` — `{ imported: number, skipped: number, errors: Array<{ row: number, message: string }> }`

**Checkpoint**: Packages installed, multipart registered, validation schemas ready

---

## Phase 2: Backend Service

**Purpose**: Create CsvService with import, export, and sample-csv logic

- [ ] T007 Create `nest-api/src/applications/csv.service.ts` — injectable service with constructor injecting `DRIZZLE` db and `HistoryService`
- [ ] T008 Implement `getExistingJobPostingUrls()` — query all non-null `jobPostingUrl` values from `applications` table (no filter on isArchived), return as `Set<string>`
- [ ] T009 Implement `importFromCsv(buffer: Buffer): Promise<ImportResult>` — parse with `Papa.parse(buffer.toString('utf-8'), { header: true, skipEmptyLines: true })`, iterate rows, for each: trim strings, convert empty to undefined, validate with `CsvRowSchema`, check dedup against existing URLs set + intra-file set, insert valid rows via `db.insert(applications)`, call `historyService.recordHistory()` for each, collect results
- [ ] T010 Implement `exportToCsv(): Promise<string>` — query all applications ordered by `dateApplied` (nulls last), map to 16-column CSV row objects, use `Papa.unparse()` to generate CSV string
- [ ] T011 Implement `getSampleCsv(): string` — return hardcoded CSV with header row + one example row with realistic values
- [ ] T012 Register `CsvService` in `nest-api/src/applications/applications.module.ts` providers array

**Checkpoint**: CsvService fully implemented with import/export/sample methods

---

## Phase 3: Backend Controller

**Purpose**: Add three new endpoints to ApplicationsController

**IMPORTANT**: All three new methods must be placed BEFORE the `getOne(@Param('id'))` method in the controller file, otherwise NestJS/Fastify will match "import"/"export"/"sample-csv" as UUID params.

- [ ] T013 Add `POST /applications/import` endpoint — `@Post('import')` handler that calls `req.file()` to get the uploaded file, validates it exists, converts to buffer via `file.toBuffer()`, passes to `csvService.importFromCsv()`, returns `ImportResult`
- [ ] T014 Add `GET /applications/export` endpoint — `@Get('export')` handler that calls `csvService.exportToCsv()`, sets `Content-Type: text/csv` and `Content-Disposition: attachment; filename="applications-YYYY-MM-DD.csv"` headers, sends CSV string via `reply.send()`
- [ ] T015 Add `GET /applications/sample-csv` endpoint — `@Get('sample-csv')` handler that calls `csvService.getSampleCsv()`, sets headers, sends response
- [ ] T016 Inject `CsvService` into `ApplicationsController` constructor (add `@Inject(CsvService)` parameter)

**Checkpoint**: All 3 endpoints callable and returning correct responses

---

## Phase 4: Backend Tests & Validation

**Purpose**: Unit tests for CsvService and full validation chain

- [ ] T017 [P] Create `nest-api/src/applications/csv.service.spec.ts` with tests:
  - Valid CSV with all fields → all rows imported
  - CSV with only required fields → defaults applied correctly
  - CSV with duplicate `jobPostingUrl` matching DB record → row skipped
  - CSV with duplicate `jobPostingUrl` within same file → second row skipped
  - CSV with validation errors (missing required, invalid URL, invalid enum) → errors with correct row numbers
  - Empty CSV (headers only) → `{ imported: 0, skipped: 0, errors: [] }`
  - CSV with empty `jobPostingUrl` → never skipped
  - Export with no applications → header-only CSV
  - Export with applications → correct columns, null as empty, dates as YYYY-MM-DD, booleans as true/false
  - Sample CSV → correct 16 headers, parseable by Papa.parse
- [ ] T018 Run `cd nest-api && npm run build && npm run lint && npm test`

**Checkpoint**: Backend tests pass, build and lint clean

---

## Phase 5: Frontend Types & API Functions

**Purpose**: Add TypeScript types, API functions, and mutation hook

- [ ] T019 [P] Add `ImportResult` interface to `tanstack-ui/src/types/application.ts` — `{ imported: number, skipped: number, errors: Array<{ row: number, message: string }> }`
- [ ] T020 [P] Add API functions to `tanstack-ui/src/services/api.ts`:
  - `importApplicationsCsv(file: File): Promise<ImportResult>` — create `FormData`, append file, POST to `/api/applications/import` (do NOT set Content-Type header — browser sets multipart boundary)
  - `getExportUrl(): string` — returns `/api/applications/export`
  - `getSampleCsvUrl(): string` — returns `/api/applications/sample-csv`
- [ ] T021 Add `useImportApplications` mutation hook to `tanstack-ui/src/queries/applicationMutations.ts` — `useMutation` with `mutationFn: (file: File) => api.importApplicationsCsv(file)`, `onSuccess: invalidate applicationKeys.lists()`

**Checkpoint**: Frontend can call import API and has export/template URLs

---

## Phase 6: Frontend Components

**Purpose**: Create ImportModal and update FilterBar with action buttons

- [ ] T022 Create `tanstack-ui/src/components/applications/ImportModal.tsx`:
  - Props: `isOpen: boolean, onClose: () => void`
  - Uses existing `Modal` component from `../ui` with `title="Import Applications"` and `size="md"`
  - **Initial state**: File input (`<input type="file" accept=".csv">`), "Download Template" link (`<a href={getSampleCsvUrl()} download>`), "Import" button (disabled until file selected, `variant="primary"`)
  - **Loading state**: Spinner/loading text, disabled inputs
  - **Results state**: Summary showing imported/skipped/error counts, scrollable error list with row numbers, "Close" button
  - Calls `useImportApplications()` hook, handles mutation state (isPending, isSuccess, isError, data)
  - On close: reset file selection and mutation state via `mutation.reset()`

- [ ] T023 Export `ImportModal` from `tanstack-ui/src/components/applications/index.ts`

- [ ] T024 Update `tanstack-ui/src/components/applications/FilterBar.tsx`:
  - Add `onImportClick: () => void` to `FilterBarProps`
  - In the second row (sort/results bar), add a button group between the result count and sort controls:
    - "Import CSV" button: `variant="secondary" size="sm"`, calls `onImportClick`
    - "Export CSV" link: `<a>` styled as secondary button, `href={getExportUrl()}` with `download` attribute
    - "Template" link: `<a>` styled as secondary button, `href={getSampleCsvUrl()}` with `download` attribute
  - Import `getExportUrl`, `getSampleCsvUrl` from `../../services/api`

**Checkpoint**: ImportModal and FilterBar buttons complete

---

## Phase 7: Frontend Integration & Validation

**Purpose**: Wire up components and run validation chain

- [ ] T025 Update `tanstack-ui/src/routes/index.tsx`:
  - Add `const [isImportOpen, setImportOpen] = useState(false)`
  - Pass `onImportClick={() => setImportOpen(true)}` to `FilterBar`
  - Render `<ImportModal isOpen={isImportOpen} onClose={() => setImportOpen(false)} />` after FilterBar
  - Import `ImportModal` from components

- [ ] T026 Run `cd tanstack-ui && npm run build && npm run lint && npm test`

**Checkpoint**: Frontend builds, lints, and tests pass

---

## Phase 8: End-to-End Testing

**Purpose**: Verify import/export flow works end-to-end

- [ ] T027 Start nest-api and tanstack-ui dev servers
- [ ] T028 Manual test: Click "Template" → verify CSV downloads with 16 headers + example row
- [ ] T029 Manual test: Click "Export CSV" → verify file downloads with all current applications
- [ ] T030 Manual test: Edit template with test data → click "Import CSV" → select file → verify results modal shows correct counts → verify new applications in list
- [ ] T031 Manual test: Re-import the same file → verify all rows with jobPostingUrl are skipped
- [ ] T032 Run existing e2e tests: `npm run test:e2e:tanstack` — verify no regressions

---

## Summary

**Total Tasks**: 32
**Tasks per Phase**:
- Phase 1 (Setup): 6 tasks
- Phase 2 (Service): 6 tasks
- Phase 3 (Controller): 4 tasks
- Phase 4 (Backend Tests): 2 tasks
- Phase 5 (Frontend Types): 3 tasks (parallel with Phase 4)
- Phase 6 (Components): 3 tasks
- Phase 7 (Integration): 2 tasks
- Phase 8 (E2E): 6 tasks

**Key Technical Notes**:
- `@fastify/multipart` (not multer) — this app uses Fastify, not Express
- Controller route ordering is critical — import/export/sample-csv before `:id`
- FormData POST must NOT set Content-Type header manually (browser adds multipart boundary)
- `Papa.parse` with `{ header: true, skipEmptyLines: true }` for robust CSV handling
- Dedup set must include both DB records and earlier rows in the same import file
