# Research: Lambda React UI (Phase 0)

## 1. State Management Choice

**Decision**: Zustand 5.0.12

**Rationale**:
- Zustand is the only major React state library not yet used in this monorepo (React Context, TanStack Query, Pinia, Svelte runes, Angular signals, and Apollo Client are already represented)
- Hooks-native: `useStore()` API works naturally alongside React 19 hooks without providers
- Minimal boilerplate: stores are plain functions with `set` / `get`, no reducers or action creators
- Supports both client-state (UI: sidebar collapse, panel open, dark mode, view mode) and server-state (application list, selected application, filter params)
- Bundle size ~4KB minified+gzip vs ~14KB for Redux Toolkit

**Alternatives Considered**:
- **Redux Toolkit**: Not new to the React ecosystem; heavier boilerplate; overkill for a single-user app
- **Jotai**: Atom-based model is novel but less intuitive for complex interdependent state (list + filters + pagination + selection)
- **MobX**: Observable-class pattern diverges significantly from the hooks-first style the monorepo uses
- **TanStack Query**: Already used in tanstack-ui and tanstack-start-ui; not "new to the monorepo"

**Zustand store design**:
```
applicationStore  — list[], total, page, limit, selectedId, loading, error
filterStore       — status[], companyCategory, jobSource, skillsMatchMin, includeArchived, sortBy, sortDir
uiStore           — sidebarCollapsed, panelOpen, panelTab, darkMode, viewMode (grid|list)
```

---

## 2. Routing Library

**Decision**: React Router 7.13.1 (react-router-dom)

**Rationale**:
- `react-ui` already uses React Router v7 with `createBrowserRouter` + lazy loading — same pattern applies here
- `useBlocker` works with `createBrowserRouter` (required for unsaved-changes guard per CLAUDE.md)
- TanStack Router is already used in tanstack-ui and tanstack-start-ui — not novel enough

**Route structure**:
```
/                       → ListPage     (lazy)
/applications/new       → ApplicationEditPage (lazy)
/applications/:id       → ApplicationEditPage (lazy)
```

---

## 3. Port Assignment

**Decision**: Port 3090

**Rationale**:
- All ports 3000–3080 are assigned to existing frontends
- 3090 is the next sequential slot; confirmed available via grep of all vite.config.ts files and playwright.config.ts
- Lambda API: 5090 (already assigned)

---

## 4. Pagination Strategy

**Decision**: Support both offset-based and cursor-based

**Offset-based** (existing, keep as default):
- Query params: `page=1&limit=20`
- Response: `{ items, page, limit, total }`
- Implementation: in-memory sort + slice (existing code, unchanged)
- Required for: shared E2E tests (hardcoded assertion on `total` field in some stacks)

**Cursor-based** (new, opt-in via `cursor` query param):
- Query params: `cursor=<base64>&limit=20`
- Response: `{ items, limit, nextCursor: string|null, hasMore: boolean }`
- Implementation: cursor encodes `{ page }` as base64 JSON — semantically cursor-based for frontend API but still uses in-memory pagination internally. This is appropriate because DynamoDB Scan + in-memory sort cannot use `LastEvaluatedKey` reliably (the key position in the raw scan does not match the sorted position)
- When `cursor` is omitted: falls back to offset-based automatically
- The lambda-react-ui frontend uses offset-based pagination (`page`/`limit`); cursor mode is supported by lambda-api but not used by the current frontend; shared E2E tests also use offset-based

---

## 5. CSV Column Format

**Decision**: Match existing 17-column standard

**Canonical column order** (verified across nest-api, fastapi, go-api, spring-api, yoga-api, and E2E tests):

| # | Column | Notes |
|---|--------|-------|
| 1 | companyName | required |
| 2 | positionTitle | required |
| 3 | dateApplied | YYYY-MM-DD or empty |
| 4 | status | enum value |
| 5 | companyUrl | URL or empty |
| 6 | jobPostingUrl | URL; used for duplicate detection |
| 7 | companyCareerUrl | URL or empty |
| 8 | companyCategory | enum value or empty |
| 9 | skillsMatch | 1–5 integer or empty |
| 10 | jobSource | enum value or empty |
| 11 | coverLetterRequired | true/false or empty |
| 12 | specialRequirements | text (may contain commas → quoted) |
| 13 | salaryMin | integer or empty |
| 14 | salaryMax | integer or empty |
| 15 | notes | text (may contain newlines → quoted) |
| 16 | offerDueDate | YYYY-MM-DD or empty |
| 17 | isArchived | true/false |

**Duplicate detection**: By `jobPostingUrl` (skip if non-empty and a matching URL already exists in DynamoDB)

---

## 6. Build Tooling

**Decision**: Vite 7.x + TypeScript strict + Tailwind CSS 4.x + ESLint

**Rationale**: Consistent with `react-ui`, `tanstack-ui`, `react-apollo-ui` — all use Vite SPA pattern in this monorepo.

---

## 7. Testing Framework

**Decision**: Vitest + Testing Library (@testing-library/react) + jsdom

**Rationale**:
- Vitest is the test runner used by `lambda-api/` (already installed for this stack family)
- Testing Library is specified in the spec (FR-021) and is the monorepo standard for React component tests
- jsdom provides browser-like DOM in Node; `@testing-library/jest-dom` for matcher extensions

---

## 8. E2E Test Port Registration

The following test files need port 3090 added to their target port arrays:

| Test File | Current Ports | Action |
|-----------|---------------|--------|
| `tests/e2e/csv-import-export.spec.ts` | 3040, 3050, 3060, 3070, 3080 | Add 3090 |
| `tests/e2e/history.spec.ts` | 3000, 3010, 3020, 3030 | Add 3090 |
| `playwright.config.ts` | webServer map missing 3090 | Add entry |
| `scripts/stop-all.sh` | Missing 3090 | Add port |
| `scripts/run-e2e.sh` | Missing lambda-react-ui | Add stack entry |

---

## 9. DynamoDB Considerations for Cursor Pagination

True DynamoDB cursor pagination using `LastEvaluatedKey` / `ExclusiveStartKey` works well for **Query** operations on specific partition keys or GSI, but is unreliable for **Scan** operations when combined with in-memory sorting. The current lambda-api `listApplications` scans all items and sorts in memory.

**Chosen approach**: Encode offset state as an opaque cursor token (base64 JSON `{ page, limit }`). This gives the frontend a cursor-based API surface while keeping the existing Scan + sort implementation. Tradeoff accepted: cursor tokens are not truly stateless (a reordering of data between pages could cause inconsistencies), but this is acceptable at job-tracker scale.

**Alternative (rejected)**: Migrate listApplications to use GSI2 Query for sorted-by-updatedAt and GSI1 Query for status filtering with real DynamoDB cursors. Rejected because: requires significant rearchitecture, breaks backward compat, and is premature optimization for a personal tool with <1000 records.
