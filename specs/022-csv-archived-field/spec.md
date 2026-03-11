# Feature Specification: Add `isArchived` to CSV Import/Export

**Created**: 2026-03-10
**Status**: Complete
**Depends on**: [011-csv-import-export](../011-csv-import-export/spec.md)
**Input**: User requirement: "Add the archived field to the import/export CSV & template for all implementations that have CSV support."

- [Clarifications](#clarifications)
- [User Scenarios & Testing](#user-scenarios--testing)
- [Requirements](#requirements)
- [CSV Format](#csv-format)
- [Success Criteria](#success-criteria)

## Clarifications

- Q: What should the column name be? → A: `isArchived` — consistent with the camelCase boolean convention already used by `coverLetterRequired`.
- Q: Where should the column be positioned? → A: Appended as column 17 (last), preserving backward compatibility with existing 16-column exports.
- Q: Should import respect the `isArchived` value? → A: Yes — if `isArchived` is `true`, the imported application is created in archived state.
- Q: What if `isArchived` is missing or empty in the imported file? → A: Default to `false` (active). Existing 16-column files remain valid.
- Q: Should export include archived applications? → A: Yes — spec 011 already required this. A bug in the Spring implementation filtered them out; this spec fixes it.
- Q: Which stacks are in scope? → A: All 4 backends with CSV support: nest-api, fastapi, go-api, spring-api. Their paired UIs need no changes (CSV is backend-driven).
- Q: Should the template sample row show `isArchived=true` or `false`? → A: `false` — the template illustrates a normal active application.

## User Scenarios & Testing

### User Story 1 — Export includes archive status (Priority: P1)

As a user, I want exported CSVs to include each application's archived status, so I can distinguish active from archived records in my spreadsheet.

**Acceptance Scenarios**:

1. **Given** I have both active and archived applications, **When** I export, **Then** the CSV has an `isArchived` column as the 17th column with `true` for archived and `false` for active records.
2. **Given** I export applications, **When** I open the CSV, **Then** all applications are present (both archived and active) — unchanged from spec 011.

---

### User Story 2 — Import respects archive status (Priority: P1)

As a user, I want to import a CSV that sets `isArchived`, so I can bulk-restore or migrate archived applications correctly.

**Acceptance Scenarios**:

1. **Given** a CSV row with `isArchived=true`, **When** I import it, **Then** the application is created in archived state.
2. **Given** a CSV row with `isArchived=false` or empty, **When** I import it, **Then** the application is created as active (default behavior unchanged).
3. **Given** a 16-column CSV without the `isArchived` column (old format), **When** I import it, **Then** all rows import successfully with `isArchived` defaulting to `false`.

---

### User Story 3 — Template shows updated format (Priority: P1)

As a user, I want the template CSV to include the `isArchived` column, so I know to include it when preparing import files.

**Acceptance Scenarios**:

1. **Given** I download the template, **When** I open it, **Then** the header row has 17 columns with `isArchived` last.
2. **Given** I open the template, **When** I inspect the example row, **Then** `isArchived` is `false`.

---

### User Story 4 — Round-trip fidelity (Priority: P1)

As a user, I want to export my applications and re-import them to get the same data back, including archived status.

**Acceptance Scenarios**:

1. **Given** I have archived applications, **When** I export then re-import the CSV, **Then** the archived applications are re-imported as archived.
2. **Given** I export and re-import, **Then** previously archived apps with a `jobPostingUrl` are skipped by duplicate detection (existing dedup behavior).

---

## Requirements

### Functional Requirements

1. **Column 17**: Add `isArchived` as the 17th column in all CSV formats (export, template, and expected import format).
2. **Export**: Include `true`/`false` for every application's archived state.
3. **Import**: Parse `isArchived`; create application with that archived state. Missing/empty → `false`.
4. **Backward compatibility**: 16-column files (old format) must still import without error.
5. **Template**: Update header and example row to include `isArchived=false`.
6. **Spring export bug**: Fix `exportCsv()` to include archived applications (was incorrectly filtering to active-only).

### Technical Requirements

1. **NestJS**: Update `CSV_COLUMNS`, `CsvRowSchema`, `exportToCsv()`, `importFromCsv()`, `getSampleCsv()`.
2. **FastAPI**: Update `CSV_COLUMNS`, `CsvRow` Pydantic model, `export_to_csv()`, `import_from_csv()` INSERT, `get_sample_csv()`.
3. **Go**: Update `CSVHeaders`, `appToCSVRow()`, `GetTemplate()`, and `ImportCSV()` (two-step: create then archive via `db.ArchiveApplication` when `isArchived=true`).
4. **Spring**: Update `CSV_HEADER`, `toCsvRow()`, `getSampleCsv()`, `buildApplicationFromRow()`, and remove the `isArchived(false)` filter from `exportCsv()`.
5. **Tests**: Update shared E2E tests and NestJS API tests to expect 17 columns; add `isArchived` to all CSV fixture strings.

## CSV Format

17 columns — `isArchived` appended as the last column:

```
companyName,positionTitle,dateApplied,status,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,coverLetterRequired,specialRequirements,salaryMin,salaryMax,notes,offerDueDate,isArchived
```

*(Note: Go and Spring use a different column order for columns 3-4, `status,dateApplied`, inherited from spec 011. The `isArchived` column is appended last in all stacks.)*

| Column | Required | Format | Notes |
|---|---|---|---|
| companyName | Yes | string (max 200) | |
| positionTitle | Yes | string (max 200) | |
| dateApplied | No | `YYYY-MM-DD` | |
| status | No | enum value | |
| … (columns 5–16 unchanged) | | | |
| isArchived | No | `true` / `false` | Default `false` if missing/empty |

## Success Criteria

- [ ] Export CSVs have 17 columns with `isArchived` as the last column across all 4 stacks
- [ ] `isArchived=true` rows import as archived applications
- [ ] `isArchived=false` or missing rows import as active applications
- [ ] Old 16-column CSV files import without error (backward compatible)
- [ ] Template has 17 columns; sample row shows `isArchived=false`
- [ ] Spring now exports archived applications (bug fix)
- [ ] Round-trip: export then re-import preserves archived status
- [ ] Shared E2E tests pass with updated column count (17)
- [ ] NestJS API tests pass with updated column count and fixtures
- [ ] Build, lint, test pass for all 4 backend stacks
