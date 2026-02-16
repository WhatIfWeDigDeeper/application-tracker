# Implementation Plan: Application History & Restore (React + Koa/Raw SQL)

**Branch**: `008-history-react-koa` | **Date**: 2026-02-15 | **Spec**: [spec.md](spec.md)

## Summary

Add snapshot-based application history and restore to the Koa + Raw SQL backend and React frontend. Each mutation captures the full application state as a JSONB snapshot. Field-level diffs are computed at read time by comparing adjacent snapshots. Users can view history in a sliding panel and restore to any previous version.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Koa, pg (raw SQL), Zod, React 19, React Router, Vite
**Storage**: PostgreSQL 18, `react_koa` schema
**Testing**: Playwright (E2E)
**No new dependencies required**

## Architecture

### Database

New `application_history` table in `react_koa` schema (raw SQL DDL):

```sql
id              UUID PK DEFAULT uuid_generate_v4()
application_id  UUID FK -> applications(id) ON DELETE CASCADE
sequence        INTEGER (monotonic per application)
description     VARCHAR(500) NOT NULL
snapshot        JSONB NOT NULL (full application + stages)
created_at      TIMESTAMPTZ DEFAULT NOW()
```

### Service Layer Pattern

```
mutation request
  -> recordHistory(appId, description)  // captures current state as snapshot
  -> execute mutation
  -> return response
```

For `createApplication`: record **after** (no "before" state exists).
For all other mutations: record **before** (snapshot = pre-change state).

### API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/applications/:id/history?page=1&limit=50` | List history entries with diffs |
| POST | `/applications/:id/history/restore` | Restore to `{ sequence: N }` |

### Frontend

- `HistoryPanel.tsx`: Fixed right-side sliding panel (w-96)
- `FieldDiff.tsx`: Old/new value display component
- Integration via "History" button in `ApplicationEdit.tsx`

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `koa-api/src/services/history.service.ts` | Core history logic (record, list, restore, diff) |
| `react-ui/src/components/applications/HistoryPanel.tsx` | History timeline panel |
| `react-ui/src/components/applications/FieldDiff.tsx` | Field change display |

### Modified Files
| File | Change |
|------|--------|
| `koa-api/src/db/schema.sql` | Add `application_history` table + index |
| `koa-api/src/types/index.ts` | Add history Zod schemas + TypeScript types |
| `koa-api/src/routes/applications.ts` | Add GET history + POST restore routes |
| `koa-api/src/services/applications.service.ts` | Add `recordHistory` calls |
| `koa-api/src/services/stages.service.ts` | Add `recordHistory` calls |
| `react-ui/src/types/application.ts` | Add history TypeScript types |
| `react-ui/src/services/api.ts` | Add history API functions |
| `react-ui/src/components/applications/ApplicationEdit.tsx` | Add History button + panel |
| `package.json` | Remove `--grep-invert 'History Panel'` from `test:e2e:react-koa` |

## Verification

1. Apply schema SQL to database
2. `cd koa-api && npm run build && npm run lint`
3. `cd react-ui && npm run build && npm run lint`
4. `npm run test:e2e:react-koa` — all tests pass including history
