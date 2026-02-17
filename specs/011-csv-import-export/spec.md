# Feature Specification: CSV Import/Export

**Created**: 2026-02-16
**Status**: Draft
**Depends on**: [010-nullable-date-applied](../010-nullable-date-applied/spec.md)
**Input**: User requirement: "Add CSV import with duplicate detection on job posting URL, CSV export, and a downloadable sample template. Start with nest-api + tanstack-ui."

- [Clarifications](#clarifications)
- [User Scenarios & Testing *(mandatory)*](#user-scenarios--testing-mandatory)
  - [User Story 1 - Import Applications from CSV (Priority: P1)](#user-story-1---import-applications-from-csv-priority-p1)
  - [User Story 2 - Export Applications to CSV (Priority: P1)](#user-story-2---export-applications-to-csv-priority-p1)
  - [User Story 3 - Download Sample CSV Template (Priority: P1)](#user-story-3---download-sample-csv-template-priority-p1)
  - [User Story 4 - Duplicate Detection on Import (Priority: P1)](#user-story-4---duplicate-detection-on-import-priority-p1)
- [Requirements *(mandatory)*](#requirements-mandatory)
  - [Functional Requirements](#functional-requirements)
  - [Technical Requirements](#technical-requirements)
- [CSV Format](#csv-format)
- [Success Criteria *(mandatory)*](#success-criteria-mandatory)

## Clarifications

- Q: Which fields should be in the CSV? → A: All 16 user-editable fields (excludes id, createdAt, updatedAt, isArchived). Interview stages are excluded (too complex for flat CSV).
- Q: Should the import auto-default dateApplied or status? → A: No. dateApplied is nullable (per spec 010). status uses the DB default `applied` if omitted.
- Q: How should duplicate detection work? → A: Skip rows where `jobPostingUrl` matches any existing record, including archived ones. Also dedup within the same file. Rows with empty jobPostingUrl are never skipped.
- Q: Should import be transactional? → A: No, partial success is fine. Each row is independent.
- Q: Should export include archived applications? → A: Yes, export ALL applications.
- Q: Should there be a preview step before importing? → A: No, upload immediately and show results.
- Q: Should export respect the current filter? → A: No, always export all applications.
- Q: Which implementations? → A: Start with nest-api + tanstack-ui. Other stacks in a future spec.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import Applications from CSV (Priority: P1)

As a user, I want to upload a CSV file to bulk-create job application records, so that I can quickly populate my tracker with multiple applications at once.

**Why this priority**: Core feature — bulk import is the primary motivation.

**Independent Test**: Upload a CSV with 3 valid rows, verify all 3 applications appear in the list.

**Acceptance Scenarios**:

1. **Given** I have a CSV file with valid application data, **When** I click "Import CSV" and select the file, **Then** a modal shows the import results with the number of successfully imported records.
2. **Given** I upload a CSV with only required fields (companyName, positionTitle), **When** the import completes, **Then** all rows are created with optional fields as null and status defaulting to `applied`.
3. **Given** I upload a CSV with some invalid rows (missing companyName, invalid URL format), **When** the import completes, **Then** valid rows are imported and invalid rows are reported with row numbers and error messages.
4. **Given** I upload a CSV with all 16 columns populated, **When** the import completes, **Then** all field values are correctly stored (enums, booleans, dates, URLs, text).
5. **Given** I upload an empty CSV (headers only), **When** the import completes, **Then** the result shows 0 imported, 0 skipped, 0 errors.
6. **Given** I upload a file that is not valid CSV, **When** the import is attempted, **Then** I see a clear error message explaining the file could not be parsed.

---

### User Story 2 - Export Applications to CSV (Priority: P1)

As a user, I want to export all my job applications to a CSV file, so that I can work with my data in a spreadsheet, share it, or back it up.

**Why this priority**: Equal importance to import — users need data portability in both directions.

**Independent Test**: Click "Export CSV" with existing applications, verify a CSV file downloads with correct data.

**Acceptance Scenarios**:

1. **Given** I have applications in the tracker, **When** I click "Export CSV", **Then** a CSV file downloads with the filename `applications-YYYY-MM-DD.csv`.
2. **Given** I have both active and archived applications, **When** I export, **Then** all applications are included in the CSV (both active and archived).
3. **Given** I export my applications, **When** I open the CSV, **Then** the columns match the import format exactly (same 16 columns, same order, same header names).
4. **Given** an application has null fields, **When** I export, **Then** null values appear as empty strings in the CSV.
5. **Given** an application has text fields with commas or quotes, **When** I export, **Then** those fields are properly quoted/escaped per CSV standards.
6. **Given** I have no applications, **When** I export, **Then** a CSV with only the header row downloads.

---

### User Story 3 - Download Sample CSV Template (Priority: P1)

As a user, I want to download a sample CSV template with the correct column headers and an example row, so that I know the expected format before preparing my import file.

**Why this priority**: Users need guidance on the CSV format to avoid errors during import.

**Independent Test**: Click "Template", verify the downloaded CSV has the correct 16 column headers and one example row.

**Acceptance Scenarios**:

1. **Given** I want to import applications, **When** I click the "Template" link, **Then** a CSV file downloads with filename `applications-template.csv`.
2. **Given** I open the template, **When** I inspect its contents, **Then** it has the 16 column headers matching the import format.
3. **Given** I open the template, **When** I inspect its contents, **Then** it contains one example row with realistic sample data showing the expected format for each field.
4. **Given** I fill in the template with my own data and import it, **When** the import completes, **Then** my applications are created successfully.

---

### User Story 4 - Duplicate Detection on Import (Priority: P1)

As a user, I want the import to skip rows where the job posting URL already exists in my tracker, so that I don't create duplicate records when re-importing or merging data.

**Why this priority**: Critical for data integrity — duplicate detection prevents user confusion and data mess.

**Independent Test**: Import a CSV, then import the same CSV again. Verify all rows are skipped the second time.

**Acceptance Scenarios**:

1. **Given** I import a CSV where some rows have a `jobPostingUrl` matching existing records, **When** the import completes, **Then** those rows are skipped and reported in the "skipped" count.
2. **Given** I import a CSV where a `jobPostingUrl` matches an archived application, **When** the import completes, **Then** that row is still skipped (archived records count for dedup).
3. **Given** I import a CSV with two rows having the same `jobPostingUrl`, **When** the import completes, **Then** the first row is imported and the second is skipped.
4. **Given** I import a CSV where rows have empty `jobPostingUrl`, **When** the import completes, **Then** those rows are never skipped (empty URLs don't trigger dedup).
5. **Given** I re-import the same CSV file after a successful import, **When** the import completes, **Then** all rows with `jobPostingUrl` are skipped and the skip count matches the number of previously imported rows.

---

## Requirements *(mandatory)*

### Functional Requirements

1. **CSV Import**: Upload a CSV file via a modal dialog to bulk-create applications
2. **CSV Export**: Download all applications (including archived) as a CSV file
3. **Sample Template**: Download a CSV template with correct headers and one example row
4. **Duplicate Detection**: Skip import rows where `jobPostingUrl` matches any existing record (including archived) or an earlier row in the same file
5. **Partial Success**: Import processes all rows independently — valid rows succeed even if others fail
6. **Import Results**: Show imported count, skipped count, and per-row error details after import
7. **History Tracking**: Each imported application gets a history snapshot entry
8. **No Preview**: Import uploads and processes immediately (no preview/confirm step)

### Technical Requirements

1. **Backend**: Three new API endpoints on nest-api (`POST /import`, `GET /export`, `GET /sample-csv`)
2. **File Upload**: Use `@fastify/multipart` for multipart/form-data handling (Fastify, not Express/multer)
3. **CSV Parsing**: Use `papaparse` for robust CSV parsing (handles quoted fields, commas in values, etc.)
4. **File Size**: 1 MB upload limit (sufficient for thousands of rows)
5. **Response Format**: Import returns `{ imported: number, skipped: number, errors: Array<{ row: number, message: string }> }`
6. **Export Headers**: `Content-Type: text/csv` with `Content-Disposition: attachment; filename="applications-YYYY-MM-DD.csv"`
7. **Route Ordering**: Import/export/sample-csv endpoints must be registered before the `:id` param route in the NestJS controller
8. **Scope**: nest-api + tanstack-ui only (other stacks in a future spec)

## CSV Format

16 columns matching all user-editable application fields:

```
companyName,positionTitle,dateApplied,status,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,coverLetterRequired,specialRequirements,salaryMin,salaryMax,notes,offerDueDate
```

| Column | Required | Format | Notes |
|---|---|---|---|
| companyName | Yes | string (max 200) | |
| positionTitle | Yes | string (max 200) | |
| dateApplied | No | `YYYY-MM-DD` | Null if empty (per spec 010) |
| status | No | enum value | DB default `applied` if empty |
| companyUrl | No | valid URL | |
| jobPostingUrl | No | valid URL | Used for duplicate detection |
| companyCareerUrl | No | valid URL | |
| companyCategory | No | enum value | One of 18 category values |
| skillsMatch | No | integer 1-5 | |
| jobSource | No | enum value | One of 7 source values |
| coverLetterRequired | No | `true` / `false` | |
| specialRequirements | No | string (max 5000) | |
| salaryMin | No | integer >= 0 | |
| salaryMax | No | integer >= 0 | |
| notes | No | string (max 5000) | |
| offerDueDate | No | `YYYY-MM-DD` | |

**Export rules**: Dates as `YYYY-MM-DD`, booleans as `true`/`false`, nulls as empty string. Fields with commas/quotes are properly escaped per RFC 4180.

**Excluded fields**: `id`, `createdAt`, `updatedAt`, `isArchived`, interview stages.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- [ ] Importing a valid CSV creates all applications in the database with correct field values
- [ ] Importing a CSV with duplicate `jobPostingUrl` values correctly skips matching rows
- [ ] Duplicate detection includes archived applications
- [ ] Import results accurately report imported, skipped, and error counts
- [ ] Per-row validation errors include the row number and a descriptive message
- [ ] Exporting produces a valid CSV with all 16 columns and all applications (including archived)
- [ ] Exported CSV can be re-imported successfully (round-trip compatibility)
- [ ] Sample template downloads with correct headers and a realistic example row
- [ ] Import modal shows file picker, upload progress, and results
- [ ] Import/Export/Template buttons are accessible from the application list view
- [ ] Each imported application has a history snapshot entry
- [ ] Build, lint, and test pass for both nest-api and tanstack-ui
- [ ] Existing e2e tests continue to pass
