# Implementation Plan: TanStack Start UI + FastAPI

**Branch**: `015-tanstack-start-ui` | **Date**: 2026-02-19 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/015-tanstack-start-ui/spec.md`

## Summary

Add a TanStack Start SSR frontend (`tanstack-start-ui/`, port 3040) that connects to the existing Python FastAPI backend (port 5160). Components are copied from `tanstack-ui/` and adapted for SSR: route loaders prefetch data via `createServerFn`, the root route owns the HTML document, and the router uses a factory function pattern.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 19
**Primary Dependencies**: `@tanstack/react-start`, `@tanstack/react-router`, `@tanstack/react-query` v5, Tailwind CSS 4.x
**Build Tool**: Vite 7.x with `@tanstack/react-start/plugin/vite`
**Backend**: Existing Python FastAPI on port 5160 (no changes except CORS)
**Testing**: Playwright (E2E), Vitest (unit)

## Architecture

### TanStack Start vs. tanstack-ui (Vite SPA)

| Aspect | tanstack-ui (SPA) | tanstack-start-ui (SSR) |
|--------|-------------------|-------------------------|
| Build tool | Vite + `@tanstack/router-plugin` | Vite + `@tanstack/react-start/plugin` |
| Entry point | `index.html` + `main.tsx` | Root route owns HTML document |
| Data loading | Client-side only (TanStack Query) | Server loaders + client TanStack Query |
| Router | Singleton `createRouter()` | Factory `getRouter()` (per-request) |
| API calls | All via Vite proxy | Loaders: server-to-server; Mutations: Vite proxy |
| Backend | nest-api (port 5050) | fastapi (port 5160) |

### Directory Structure

```
tanstack-start-ui/
├── package.json
├── vite.config.ts              # tanstackStart() plugin, port 3040, proxy /api → 5160
├── tsconfig.json
├── postcss.config.js
├── eslint.config.js
├── public/
│   └── favicon.svg
└── src/
    ├── router.tsx              # getRouter() factory (SSR needs per-request router)
    ├── index.css               # Tailwind CSS 4.x entry
    ├── routes/
    │   ├── __root.tsx          # HTML document shell + QueryClientProvider
    │   ├── index.tsx           # List page with server loader
    │   └── applications/
    │       ├── new.tsx         # Create page (no loader)
    │       └── $id.tsx         # Edit page with server loader
    ├── server/
    │   ├── api.ts              # serverFetch() utility for FastAPI calls
    │   └── applications.ts     # createServerFn wrappers for loaders
    ├── services/
    │   └── api.ts              # Client-side fetch wrapper (copied from tanstack-ui)
    ├── queries/
    │   ├── queryKeys.ts        # Query key factory (copied)
    │   ├── applicationQueries.ts  # useQuery hooks (copied)
    │   └── applicationMutations.ts  # useMutation hooks (copied)
    ├── components/             # All copied from tanstack-ui unchanged
    │   ├── applications/
    │   ├── interviews/
    │   ├── common/
    │   └── ui/
    ├── hooks/                  # Copied from tanstack-ui unchanged
    ├── types/                  # Copied from tanstack-ui unchanged
    └── lib/                    # Copied from tanstack-ui unchanged
```

### Server Function Layer

```
src/server/api.ts       — serverFetch<T>(path, options) → calls http://localhost:5160
src/server/applications.ts:
  fetchApplications     — createServerFn, called by index.tsx loader
  fetchApplication      — createServerFn, called by $id.tsx loader
```

### Route Loaders

| Route | Loader | Purpose |
|-------|--------|---------|
| `/` (index) | `fetchApplications({ sortBy: "updatedAt", sortDir: "desc", page: 1, limit: 20 })` | Prefetch default list view |
| `/applications/$id` | `fetchApplication({ id: params.id })` | Prefetch application for edit |
| `/applications/new` | None | No data to prefetch |

## Files to Create

### Configuration (5 files)
| File | Source |
|------|--------|
| `tanstack-start-ui/package.json` | New (based on tanstack-ui, add `@tanstack/react-start`) |
| `tanstack-start-ui/vite.config.ts` | New (`tanstackStart()` plugin, port 3040, proxy → 5160) |
| `tanstack-start-ui/tsconfig.json` | New (based on tanstack-ui, no `verbatimModuleSyntax`) |
| `tanstack-start-ui/postcss.config.js` | Copy from tanstack-ui |
| `tanstack-start-ui/eslint.config.js` | Copy from tanstack-ui |

### Entry Points (3 files)
| File | Source |
|------|--------|
| `src/router.tsx` | New (factory function pattern) |
| `src/routes/__root.tsx` | New (HTML document shell with HeadContent/Scripts) |
| `src/index.css` | Copy from tanstack-ui |

### Server Functions (2 files)
| File | Purpose |
|------|---------|
| `src/server/api.ts` | serverFetch utility calling FastAPI at localhost:5160 |
| `src/server/applications.ts` | createServerFn wrappers for route loaders |

### Routes (3 files)
| File | Source |
|------|--------|
| `src/routes/index.tsx` | Adapted from tanstack-ui (add loader) |
| `src/routes/applications/$id.tsx` | Adapted from tanstack-ui (add loader) |
| `src/routes/applications/new.tsx` | Adapted from tanstack-ui (minimal change) |

### Copied Unchanged (~30 files)
| Directory | Files |
|-----------|-------|
| `src/types/` | `application.ts` |
| `src/lib/` | `constants.ts`, `utils.ts`, `utils.test.ts` |
| `src/hooks/` | `useFilters.ts`, `useSorting.ts` |
| `src/services/` | `api.ts` |
| `src/queries/` | `queryKeys.ts`, `applicationQueries.ts`, `applicationMutations.ts` |
| `src/components/ui/` | All 12 components |
| `src/components/interviews/` | All 4 components + index.ts |
| `src/components/applications/` | All 7 components + index.ts |
| `src/components/common/` | `index.ts` |
| `public/` | `favicon.svg` |

### Copied with Changes (1 file)
| File | Change |
|------|--------|
| `src/components/common/Header.tsx` | Subtitle: `"(React SSR - FastAPI - asyncpg)"` |

## Files to Modify (Project-Level)

| File | Change |
|------|--------|
| `fastapi/src/main.py` | Add `"http://localhost:3040"` to CORS `allow_origins` |
| Root `package.json` | Add scripts to all groups (see tasks) |
| `playwright.config.ts` | Add `3040: 'cd tanstack-start-ui && npm run dev'` |
| `scripts/stop-all.sh` | Add port 3040 |
| `README.md` | Add implementation entry, running instructions, test commands |
| `CLAUDE.md` | Add tanstack-start-ui section |
| `docs/DATABASE_ARCHITECTURE.md` | Note shared `python_fastapi` schema |

## Execution Strategy

**Phase 1** (sequential): Config files, entry points, copy unchanged files
**Phase 2** (sequential): Server functions, adapted routes
**Phase 3** (sequential): Project-level updates (package.json scripts, CORS, playwright, etc.)
**Phase 4** (sequential): Validation chain (install, build, lint, test)
**Phase 5**: E2E tests, documentation updates

## Verification

1. `cd tanstack-start-ui && npm install && npm run build` -- compiles
2. `npm run lint:tanstack-start-ui` -- no lint errors
3. `npm run test:tanstack-start-ui` -- unit tests pass
4. Start FastAPI + Start UI, verify SSR (view source shows rendered HTML)
5. `npm run test:e2e:tanstack-start` -- shared E2E tests pass
6. `npm run build:all && npm run lint:all && npm run test:all` -- no regressions
