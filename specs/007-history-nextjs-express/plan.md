# Implementation Plan: Application History & Restore (Next.js + Express/Prisma)

**Branch**: `007-history-nextjs-express` | **Date**: 2026-02-15 | **Spec**: [spec.md](spec.md)

## Summary

Add snapshot-based application history and restore to the Express + Prisma backend and Next.js frontend. Each mutation captures the full application state as a JSONB snapshot. Field-level diffs are computed at read time by comparing adjacent snapshots. Users can view history in a sliding panel and restore to any previous version.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Express, Prisma ORM, Zod, Next.js 16, React 19
**Storage**: PostgreSQL 18, `express_prisma` schema
**Testing**: Playwright (E2E)
**No new dependencies required**

## Architecture

### Database

New `ApplicationHistory` Prisma model in `express_prisma` schema:

```
id              String   @id @default(uuid())
applicationId   String   FK -> Application
sequence        Int      (monotonic per application)
description     String   @db.VarChar(500)
snapshot        Json     (full application + stages as JSONB)
createdAt       DateTime @default(now())
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
| `api/src/services/history.service.ts` | Core history logic (record, list, restore, diff) |
| `ui/src/components/applications/HistoryPanel.tsx` | History timeline panel |
| `ui/src/components/applications/FieldDiff.tsx` | Field change display |

### Modified Files
| File | Change |
|------|--------|
| `api/prisma/schema.prisma` | Add `ApplicationHistory` model + relation |
| `api/src/types/index.ts` | Add history Zod schemas |
| `api/src/routes/applications.ts` | Add GET history + POST restore routes |
| `api/src/services/applications.service.ts` | Add `recordHistory` calls |
| `api/src/services/stages.service.ts` | Add `recordHistory` calls |
| `ui/src/types/application.ts` | Add history TypeScript types |
| `ui/src/services/api.ts` | Add history API methods |
| `ui/src/components/applications/ApplicationEdit.tsx` | Add History button + panel |
| `package.json` | Remove `--grep-invert 'History Panel'` from `test:e2e` |

## Verification

1. `npx prisma migrate dev` — migration applied
2. `cd api && npm run build && npm run lint`
3. `cd ui && npm run build && npm run lint`
4. `npm run test:e2e` — all tests pass including history
