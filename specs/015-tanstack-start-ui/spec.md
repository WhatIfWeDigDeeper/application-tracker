# 015 - TanStack Start UI + FastAPI

- **Created**: 2026-02-19
- **Status**: Complete

## Overview

Add a 6th UI implementation to the monorepo: React 19 + TanStack Start SSR frontend (`tanstack-start-ui/`) connecting to the existing Python FastAPI backend (`fastapi/`, port 5160). This creates a unique cross-language pairing (TypeScript SSR frontend + Python backend) and introduces the first server-side rendered UI in the project.

TanStack Start is the SSR framework built on TanStack Router. It has migrated from Vinxi to native Vite, using `@tanstack/react-start/plugin/vite` in a standard `vite.config.ts`. Key capabilities: route loaders for server-side data fetching, `createServerFn` for server functions, and full SSR hydration.

## Technology Stack

### Frontend (`tanstack-start-ui/` -- port 3040)
- React 19 + TanStack Start (Vite-based SSR)
- TanStack Query v5 (server state management)
- TanStack Router (file-based, type-safe routing)
- Tailwind CSS 4.x (dark mode via `dark:` classes)
- Vitest + Testing Library
- DB schema: `python_fastapi` (shared with FastAPI backend -- no new schema)

### Backend (existing)
- Python FastAPI on port 5160
- asyncpg (raw SQL), Pydantic v2
- DB schema: `python_fastapi`

## Architecture

### Server Functions as BFF

TanStack Start's `createServerFn` runs on the Node.js server. Server functions call FastAPI directly at `http://localhost:5160` (server-to-server, no CORS needed). Route loaders call server functions to prefetch data for SSR.

```
Browser → TanStack Start (SSR/Node.js) → FastAPI (Python)
                                       ↑ server-to-server (no CORS)
Browser → Vite Proxy (/api) → FastAPI (Python)
                             ↑ client-side mutations (CORS required)
```

### Data Flow

- **Initial page load**: Route loader calls server function → server function calls FastAPI → SSR renders HTML with data → client hydrates
- **Client interactions** (filter, sort, paginate): TanStack Query fetches via Vite proxy (`/api` → `http://localhost:5160`)
- **Mutations** (create, update, delete): TanStack Query mutations via Vite proxy, then invalidate queries

### SSR Considerations

- **Dark mode**: `Header.tsx` already guards `localStorage` with `typeof window !== "undefined"`. Server renders light theme; client hydrates with correct theme.
- **QueryClient**: Singleton is acceptable for this single-user dev tool.
- **Loader + Query integration**: Loaders prefetch default data. TanStack Query's 1-minute `staleTime` prevents duplicate fetches after SSR.

## Features (matching all existing implementations)

1. **Application CRUD** -- Create, read, update, delete job applications
2. **Interview Stages** -- Individual CRUD for interview stages per application
3. **Filtering & Sorting** -- Status, company category, job source, skills match, archived
4. **Pagination** -- Server-side with configurable page size
5. **Archive/Restore** -- Dedicated endpoints
6. **History Panel** -- Snapshot-based history with field diffs and restore-to-version
7. **Dark Mode** -- Toggle with localStorage persistence and system preference fallback
8. **Unsaved Changes Guard** -- In-app navigation blocking via `useBlocker`
9. **Form Validation** -- Required fields, salary range, URL format
10. **CSV Import/Export** -- Bulk data operations
11. **SSR** (new) -- Server-side rendered initial page loads via route loaders

## Code Reuse

Components, queries, services, types, hooks, and utilities are copied from `tanstack-ui/` and adapted for TanStack Start:

| Layer | Source | Adaptation |
|-------|--------|------------|
| UI components | `tanstack-ui/src/components/` | Unchanged (same React 19 + Tailwind) |
| Types | `tanstack-ui/src/types/` | Unchanged |
| Query hooks | `tanstack-ui/src/queries/` | Unchanged (TanStack Query works the same) |
| Client API service | `tanstack-ui/src/services/api.ts` | Unchanged (same `/api` proxy pattern) |
| Hooks | `tanstack-ui/src/hooks/` | Unchanged |
| Utils/Constants | `tanstack-ui/src/lib/` | Unchanged |
| Router | `tanstack-ui/src/router.ts` | Changed: factory function pattern for SSR |
| Root layout | `tanstack-ui/src/routes/__root.tsx` | Changed: owns full HTML document |
| Route files | `tanstack-ui/src/routes/*.tsx` | Changed: add `loader` functions |
| Entry point | `tanstack-ui/src/main.tsx` | Removed: TanStack Start handles entry |
| Vite config | `tanstack-ui/vite.config.ts` | Changed: `tanstackStart()` plugin, port 3040, proxy → 5160 |
| Header | `tanstack-ui/src/components/common/Header.tsx` | Changed: subtitle text |

## E2E Selector Contract

Must match all selectors in `tests/e2e/application-crud.spec.ts` and `tests/e2e/history.spec.ts`.

## Success Criteria

- [ ] SSR works: view page source shows server-rendered application list HTML
- [ ] All shared E2E tests pass (`test:e2e:tanstack-start`)
- [ ] History panel E2E tests pass
- [ ] Build, lint, and unit tests pass (`build:tanstack-start`, `lint:tanstack-start-ui`, `test:tanstack-start-ui`)
- [ ] Full monorepo validation passes (`build:all`, `lint:all`, `test:all`)
- [ ] Dark mode works with localStorage persistence
- [ ] All CRUD operations functional end-to-end
- [ ] Route loaders prefetch data on server (no loading spinner on initial page load)
