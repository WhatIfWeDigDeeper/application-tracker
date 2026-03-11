# Feature: CSV Import/Export

Bulk-create applications from a CSV file, export all applications as CSV, and download a template.

**Priority**: P2 (Important)

---

## Overview

Job seekers who track applications in spreadsheets or other tools need a way to migrate their data into the system. Similarly, users may want to export their data for backup or external analysis. This feature provides CSV-based import, export, and a downloadable template with the correct column format.

---

## User Stories

### US-7.1: Import from CSV

**As a** job seeker
**I want to** upload a CSV file to create multiple applications at once
**So that** I can migrate existing data without manual entry

#### Acceptance Criteria

1. **Given** I want to import applications
   **When** I select a .csv file
   **Then** the system processes each row independently

2. **Given** the import has completed
   **When** I view the results
   **Then** I see counts of imported, skipped, and errored rows

3. **Given** a row fails validation
   **When** I view the error details
   **Then** I see the row number and a descriptive error message

4. **Given** a row is successfully imported
   **When** the application is created
   **Then** an initial history snapshot is recorded for that application

---

### US-7.2: Export to CSV

**As a** job seeker
**I want to** download all my applications as a CSV file
**So that** I can back up my data or analyze it externally

#### Acceptance Criteria

1. **Given** I want to export my applications
   **When** I trigger the export
   **Then** a file named `applications-YYYY-MM-DD.csv` is downloaded

2. **Given** I have both active and archived applications
   **When** I export
   **Then** all applications are included regardless of archive status

3. **Given** the export completes
   **When** I open the file
   **Then** it contains 17 columns matching the CSV format specification

4. **Given** an application has interview stages
   **When** it is exported
   **Then** interview stages are excluded from the CSV (application fields only)

---

### US-7.3: Download Template

**As a** job seeker
**I want to** download a CSV template with the correct headers
**So that** I can fill in my data in the right format before importing

#### Acceptance Criteria

1. **Given** I want to prepare data for import
   **When** I download the template
   **Then** I receive a CSV file with all 17 column headers

2. **Given** I have downloaded the template
   **When** I open it
   **Then** it includes one example row with realistic sample data

---

### US-7.4: Duplicate Detection

**As a** job seeker
**I want to** avoid creating duplicate applications during import
**So that** my data stays clean

#### Acceptance Criteria

1. **Given** I am importing a CSV
   **When** a row's jobPostingUrl matches an existing application (including archived)
   **Then** that row is skipped (not counted as an error)

2. **Given** I am importing a CSV
   **When** two rows in the same file share the same jobPostingUrl
   **Then** the first row is imported and subsequent duplicates are skipped

3. **Given** the import has completed with skipped rows
   **When** I view the results
   **Then** the skipped count includes all duplicates (both existing and intra-file)

---

## CSV Format

17 columns in the following order:

| Column | Required | Type | Notes |
|--------|----------|------|-------|
| companyName | Yes | string | |
| positionTitle | Yes | string | |
| dateApplied | Yes | date | YYYY-MM-DD format |
| status | No | enum | Default: "applied" |
| companyUrl | No | string | URL |
| jobPostingUrl | No | string | URL; used for duplicate detection |
| companyCareerUrl | No | string | URL |
| companyCategory | No | string | |
| skillsMatch | No | string | |
| jobSource | No | string | |
| coverLetterRequired | No | boolean | true/false |
| specialRequirements | No | string | |
| salaryMin | No | number | |
| salaryMax | No | number | |
| notes | No | string | |
| offerDueDate | No | date | YYYY-MM-DD format |
| isArchived | No | boolean | true/false; default false |

---

## Behaviors

### Import from CSV

```
Input: { file (CSV) }
Process:
  1. Parse CSV headers
  2. Validate required columns present (companyName, positionTitle, dateApplied)
  3. If required columns missing, return error immediately
  4. Initialize counters: imported=0, skipped=0, errors=[]
  5. Collect all jobPostingUrls from existing applications
  6. Initialize seenUrls set for intra-file dedup
  7. For each row:
     a. Validate required fields present
     b. Validate field formats (dates, enums, numbers)
     c. If jobPostingUrl exists and is in existing apps or seenUrls → skip, increment skipped
     d. If validation fails → add to errors with row number and message
     e. Otherwise → create application, record initial snapshot
     f. Add jobPostingUrl to seenUrls (if present)
     g. Increment imported
  8. Return { imported, skipped, errors }
Output: ImportResult { imported: number, skipped: number, errors: Array<{ row: number, message: string }> }
```

### Export to CSV

```
Input: (none)
Process:
  1. Query all applications (active + archived)
  2. Order by dateApplied descending
  3. Format each application as a CSV row (17 columns)
  4. Prepend header row
  5. Return as text/csv with filename applications-YYYY-MM-DD.csv
Output: CSV file
```

### Download Template

```
Input: (none)
Process:
  1. Generate header row with all 17 column names
  2. Generate example row with sample data:
     - "Acme Corp", "Software Engineer", "2026-01-15", "applied",
       "https://acme.com", "https://acme.com/jobs/123", "https://acme.com/careers",
       "Tech", "React, TypeScript", "LinkedIn", "false",
       "Must have US work authorization", "120000", "150000",
       "Referred by Jane", ""
  3. Return as text/csv
Output: CSV file
```

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Empty file (no data rows) | Return imported=0, skipped=0, errors=[] |
| Missing required columns | Reject entire file with error listing missing columns |
| Extra columns beyond 17 | Ignore extra columns silently |
| Round-trip (export then import) | Produces identical applications (format is compatible) |
| Very large file (1000+ rows) | Process all rows; no artificial limit |
| Invalid enum value in status column | Row-level error (e.g., "Row 5: invalid status 'pending'") |
| Row with empty required field | Row-level error (e.g., "Row 3: companyName is required") |
| CSV with different column order | Match by header name, not position |
| Quoted fields with commas | Standard CSV parsing (RFC 4180) |
| jobPostingUrl is empty | No duplicate check for that row; import normally |

---

## Display Requirements

### Import UI

- File picker accepting .csv files
- Upload button to trigger import
- Results summary: "Imported: X, Skipped: Y, Errors: Z"
- Expandable error list with row numbers and messages
- Success state returns user to applications list

### Export UI

- Export button in applications list toolbar
- Triggers immediate file download
- No configuration needed

### Template UI

- "Download Template" link near import controls
- Triggers immediate file download

---

## API Operations

| Operation | Method | Endpoint | Request | Response |
|-----------|--------|----------|---------|----------|
| Import | POST | /applications/import | multipart/form-data (CSV file) | ImportResult |
| Export | GET | /applications/export | - | text/csv |
| Template | GET | /applications/sample-csv | - | text/csv |

See [openapi.yaml](../api/openapi.yaml) for full API specification.
