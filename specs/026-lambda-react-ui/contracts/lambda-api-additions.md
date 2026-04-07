# Lambda-API Contract Additions

These are the new endpoints added to `lambda-api` as part of this feature. All existing endpoints remain unchanged.

---

## CSV Endpoints

> **IMPORTANT**: These routes MUST be defined BEFORE `GET /:id` in `lambda-api/src/routes/applications.ts` — otherwise Hono will match `export` and `sample-csv` as UUID path params.

### GET /applications/export

Download all applications as a CSV file.

**Query Parameters**:
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `includeArchived` | boolean | `true` | Include archived applications in the export |

**Response**: `200 OK`
```
Content-Type: text/csv
Content-Disposition: attachment; filename="applications-YYYY-MM-DD.csv"
```

Body: CSV with header row followed by one row per application.

**CSV Columns** (17, in this exact order):
```
companyName,positionTitle,dateApplied,status,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,coverLetterRequired,specialRequirements,salaryMin,salaryMax,notes,offerDueDate,isArchived
```

**Rules**:
- Fields containing commas, double quotes, or newlines MUST be quoted
- Double quotes within values MUST be escaped as `""`
- `null` fields → empty string
- `boolean` fields → `true` / `false`
- `number` fields → numeric string

---

### GET /applications/sample-csv

Download a CSV template for use as an import guide.

**Response**: `200 OK`
```
Content-Type: text/csv
Content-Disposition: attachment; filename="applications-template.csv"
```

Body: Two rows — the 17-column header line followed by one sample data row.

---

### POST /applications/import

Import applications from an uploaded CSV file.

**Request**: `multipart/form-data`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | yes | CSV file with optional header row |

**Parsing rules**:
- Header row detected if first row matches the standard columns
- Multi-line quoted fields MUST be supported (character-by-character parser, NOT line-split)
- `isArchived` column: `true` → import as archived; `false` or empty → active
- `status` column: defaults to `unsubmitted` if empty; fails the row if an unrecognized value is provided
- `dateApplied` column: ignored if status is `unsubmitted`

**Duplicate detection**: If a row has a non-empty `jobPostingUrl` that matches an existing application's `jobPostingUrl`, the row is SKIPPED (not updated).

**Response**: `200 OK`
```json
{
  "imported": 5,
  "skipped": 2,
  "failed": 1,
  "errors": ["Row 4: invalid skillsMatch value '6' (must be 1-5)"]
}
```

**Error Response**: `400 Bad Request`
```json
{
  "code": "validation_error",
  "message": "No CSV file provided"
}
```

---

## Cursor-Based Pagination

Cursor-based pagination is added to the existing `GET /applications` endpoint as an **opt-in mode**. The existing offset-based mode is unchanged (backward compatible).

### GET /applications (cursor mode)

**When to activate**: Include a `cursor` query parameter (any value, including the special value `"start"` for the first page).

**Additional Query Parameters**:
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `cursor` | string | — | Opaque cursor token. Use `"start"` for first page, or `nextCursor` value from previous response |

**When `cursor` is present, the `page` param is ignored**. Other params (`status`, `sortBy`, `limit`, etc.) continue to work as normal.

**Response Schema (cursor mode)**:
```json
{
  "items": [ ...Application[] ],
  "limit": 20,
  "nextCursor": "eyJwYWdlIjoyfQ==",
  "hasMore": true
}
```

- `nextCursor`: base64-encoded JSON `{ "page": N }`. `null` when on the last page.
- `hasMore`: `true` if more pages exist

**Cursor implementation**: The cursor token encodes the logical page offset internally. This keeps the API surface cursor-based while the backend continues to use in-memory sort + slice. Cursor tokens are not stable across data mutations.

**Updated `ListApplicationsQuerySchema`** (zod):
```typescript
const ListApplicationsQuerySchema = z.object({
  // ... existing fields unchanged ...
  cursor: z.string().optional(),  // NEW: activates cursor mode when present
});
```

**Updated response type** (when cursor is present, return `CursorPaginatedApplicationsResponse` instead of `PaginatedApplicationsResponse`):
```typescript
const CursorPaginatedApplicationsSchema = z.object({
  items: z.array(ApplicationSchema),
  limit: z.number().int(),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});
```

---

## Route Order in applications.ts

The complete route order after additions (order matters — static paths before param paths):

```
GET  /applications/export      ← NEW (must be before /:id)
GET  /applications/sample-csv  ← NEW (must be before /:id)
POST /applications/import      ← NEW
GET  /applications             ← existing (with cursor support added)
POST /applications             ← existing
GET  /applications/:id         ← existing
PATCH /applications/:id        ← existing
DELETE /applications/:id       ← existing
POST /applications/:id/archive ← existing
POST /applications/:id/restore ← existing
GET  /applications/:id/history ← existing
POST /applications/:id/history/restore ← existing
POST /applications/:id/interview-stages ← existing
PATCH /applications/:id/interview-stages/:stageId ← existing
DELETE /applications/:id/interview-stages/:stageId ← existing
```
