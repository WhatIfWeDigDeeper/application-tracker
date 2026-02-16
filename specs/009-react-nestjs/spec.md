# 009 - React + TanStack Query + NestJS Implementation

- **Branch**: `009-react-nestjs`
- **Created**: 2026-02-16
- **Status**: In Progress

## Overview

Add a 5th implementation pair to the monorepo: React 19 + TanStack Query/Router frontend (`tanstack-ui/`) with NestJS + Fastify backend (`nest-api/`). Matches full functionality of existing implementations.

## Technology Stack

### Frontend (`tanstack-ui/` — port 3050)
- React 19 + Vite
- TanStack Query v5 (server state management)
- TanStack Router (file-based, type-safe routing)
- Tailwind CSS 4.x (dark mode via `dark:` classes)
- Zod (client-side validation)
- Vitest + Testing Library

### Backend (`nest-api/` — port 5050)
- NestJS with Fastify adapter
- Drizzle ORM (PostgreSQL)
- Zod validation (custom pipe, not class-validator)
- Snapshot-based history
- DB schema: `react_nestjs`

## Features (matching all existing implementations)

1. **Application CRUD** — Create, read, update, delete job applications
2. **Interview Stages** — Individual CRUD for interview stages per application
3. **Filtering & Sorting** — Status, company category, job source, date range, salary, skills match
4. **Pagination** — Server-side with configurable page size
5. **Archive/Restore** — Soft archive with restore capability
6. **History Panel** — Snapshot-based history with field diffs and restore-to-version
7. **Dark Mode** — Toggle with localStorage persistence and system preference fallback
8. **Unsaved Changes Guard** — Browser beforeunload + in-app navigation blocking
9. **Form Validation** — Required fields, salary range, URL format

## E2E Selector Contract

Must match all selectors in `tests/e2e/application-crud.spec.ts` and `tests/e2e/history.spec.ts`.

## Success Criteria

- [ ] All 13 shared E2E tests pass (`test:e2e:tanstack`)
- [ ] History panel E2E tests pass
- [ ] Build, lint, and unit tests pass for both nest-api and tanstack-ui
- [ ] Full monorepo validation passes (`build:all`, `lint:all`, `test:all`)
- [ ] Dark mode works with localStorage persistence
- [ ] All CRUD operations functional end-to-end
