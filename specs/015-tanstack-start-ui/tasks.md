---
description: "Task list for TanStack Start UI + FastAPI"
---

# Tasks: TanStack Start UI + FastAPI

**Input**: Design documents from `/specs/015-tanstack-start-ui/`
**Specification**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)
**Project**: TanStack Start (frontend), FastAPI (existing backend)

**Organization**: Tasks grouped by phase. All phases are sequential (single directory).

## Dependencies & Execution Order

- Phase 1 (Scaffolding) must complete before Phase 2
- Phase 2 (Server + Routes) must complete before Phase 3
- Phase 3 (Project Integration) must complete before Phase 4
- Phase 4 (Validation) must complete before Phase 5
- Phase 5 (E2E + Docs) is the final phase

---

## Phase 1: Scaffolding (Sequential)

**Purpose**: Create project structure, config files, and copy shared code from `tanstack-ui/`

- [ ] T001 Create `tanstack-start-ui/package.json` with React 19, `@tanstack/react-start`, `@tanstack/react-router`, `@tanstack/react-query` v5, Tailwind 4.x, Vite 7.x, Vitest, ESLint
- [ ] T002 Create `tanstack-start-ui/vite.config.ts` with `tanstackStart()` plugin, port 3040, proxy `/api` → `http://localhost:5160`
- [ ] T003 Create `tanstack-start-ui/tsconfig.json` (strict mode, `@/*` alias, no `verbatimModuleSyntax`)
- [ ] T004 Copy `postcss.config.js` and `eslint.config.js` from `tanstack-ui/`
- [ ] T005 Copy `public/favicon.svg` and `src/index.css` from `tanstack-ui/`
- [ ] T006 Copy all unchanged source files from `tanstack-ui/src/` to `tanstack-start-ui/src/`:
  - `types/application.ts`
  - `lib/constants.ts`, `lib/utils.ts`, `lib/utils.test.ts`
  - `hooks/useFilters.ts`, `hooks/useSorting.ts`
  - `services/api.ts`
  - `queries/queryKeys.ts`, `queries/applicationQueries.ts`, `queries/applicationMutations.ts`
  - `components/ui/*` (all 12 components + index.ts)
  - `components/interviews/*` (all 4 components + index.ts)
  - `components/applications/*` (all 7 components + index.ts)
  - `components/common/index.ts`
- [ ] T007 Copy and modify `src/components/common/Header.tsx` -- change subtitle to `"(React SSR - FastAPI - asyncpg)"`
- [ ] T008 Run `npm install` in `tanstack-start-ui/` and verify no dependency errors

**Checkpoint**: All source files in place, dependencies installed

---

## Phase 2: TanStack Start Entry Points + Server Functions (Sequential)

**Purpose**: Create TanStack Start-specific entry points, server functions, and route loaders

- [ ] T009 Create `src/router.tsx` with `getRouter()` factory function (SSR needs per-request router instances)
- [ ] T010 Create `src/routes/__root.tsx` -- full HTML document shell with `<HeadContent/>`, `<Scripts/>`, `QueryClientProvider`, `Header`, `Outlet`
- [ ] T011 Create `src/server/api.ts` -- `serverFetch<T>(path, options)` utility calling FastAPI at `http://localhost:5160`
- [ ] T012 Create `src/server/applications.ts` -- `createServerFn` wrappers: `fetchApplications(params)`, `fetchApplication({ id })`
- [ ] T013 Create `src/routes/index.tsx` -- list page with `loader` calling `fetchApplications` for default params; component body from tanstack-ui
- [ ] T014 Create `src/routes/applications/$id.tsx` -- edit page with `loader` calling `fetchApplication({ id })`; component body from tanstack-ui
- [ ] T015 Create `src/routes/applications/new.tsx` -- create page (no loader), component body from tanstack-ui
- [ ] T016 Verify `npm run build` succeeds in `tanstack-start-ui/`

**Checkpoint**: TanStack Start app builds and renders with SSR

---

## Phase 3: Project Integration (Sequential)

**Purpose**: Wire the new implementation into the monorepo

- [ ] T017 Add `"http://localhost:3040"` to CORS `allow_origins` in `fastapi/src/main.py`
- [ ] T018 Add individual scripts to root `package.json`: `dev:tanstack-start-ui`, `build:tanstack-start-ui`, `lint:tanstack-start-ui`, `test:tanstack-start-ui`, `ci:tanstack-start-ui`, `install:tanstack-start-ui`, `audit:ci:tanstack-start-ui`, `docs:types:tanstack-start-ui`
- [ ] T019 Add composite stack scripts: `build:tanstack-start`, `ci:tanstack-start`, `install:tanstack-start`
- [ ] T020 Append to all `:all` composite scripts: `build:all`, `lint:all`, `test:all`, `audit:ci:all`, `ci:all`, `install:all`, `docs:types`, `clean`
- [ ] T021 Add E2E script: `test:e2e:tanstack-start` with `TEST_UI_PORT=3040`; append to `test:e2e:all`
- [ ] T022 Add `3040: 'cd tanstack-start-ui && npm run dev'` to `webServerCommands` in `playwright.config.ts`
- [ ] T023 Add port 3040 to `scripts/stop-all.sh` PORTS array

**Checkpoint**: Monorepo scripts work, new stack integrated

---

## Phase 4: Validation (Sequential)

**Purpose**: Run full validation chain to confirm no regressions

- [ ] T024 Run `npm run build:tanstack-start-ui` -- TypeScript + Vite build succeeds
- [ ] T025 Run `npm run lint:tanstack-start-ui` -- ESLint passes
- [ ] T026 Run `npm run test:tanstack-start-ui` -- Vitest unit tests pass
- [ ] T027 Start FastAPI + TanStack Start UI, manually verify:
  - Page loads at `http://localhost:3040`
  - View source shows server-rendered HTML (SSR works)
  - CRUD operations work (create, edit, delete application)
  - Dark mode toggle works
  - History panel works

**Checkpoint**: Application fully functional with SSR

---

## Phase 5: E2E Tests + Documentation (Sequential)

**Purpose**: Run E2E tests and update all documentation

- [ ] T028 Run `npm run test:e2e:tanstack-start` -- all shared E2E tests pass
- [ ] T029 Fix any E2E test failures (selector contract issues, SSR hydration timing, etc.)
- [ ] T030 Update `README.md`: add implementation entry (#6), running instructions, test commands
- [ ] T031 Update `CLAUDE.md`: add tanstack-start-ui + FastAPI pairing to Database Architecture section
- [ ] T032 Update `docs/DATABASE_ARCHITECTURE.md`: note that tanstack-start-ui shares `python_fastapi` schema
- [ ] T033 Run `npm run build:all && npm run lint:all && npm run test:all` -- full monorepo validation passes

**Checkpoint**: Feature complete, documented, all tests green

---

## Summary

**Total Tasks**: 33
**Phases**:
- Phase 1 (Scaffolding): 8 tasks -- config + copy files
- Phase 2 (Start Entry Points): 8 tasks -- SSR-specific code
- Phase 3 (Project Integration): 7 tasks -- monorepo wiring
- Phase 4 (Validation): 4 tasks -- build/lint/test/manual
- Phase 5 (E2E + Docs): 6 tasks -- E2E tests + documentation

**No parallel opportunities**: All work is in a single directory (`tanstack-start-ui/`) plus project-level files.
