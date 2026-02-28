# 017 - Angular UI

- **Created**: 2026-02-26
- **Status**: Complete

## Overview

Add an Angular frontend (`angular-ui/`) that connects to the Go Gin API (port 5070). Completes the "big 4" frontend frameworks in the portfolio (React × 3, Vue, Svelte, Angular). Uses modern Angular 21 patterns: standalone components, Angular Signals for component state, Reactive Forms with typed controls, and `@testing-library/angular` for user-centric unit tests.

## Technology Stack

### Frontend (`angular-ui/` — port 3060)
- Angular 21+ (latest stable)
- TypeScript 5.x (strict mode)
- Angular Signals (`signal()`, `computed()`, `effect()`) for component state
- RxJS — `Observable<T>` for HTTP streams via `HttpClient`
- Angular Reactive Forms (`ReactiveFormsModule`, typed `FormGroup`/`FormControl`)
- Angular Router (standalone routing, `CanDeactivate` guard for unsaved changes)
- Tailwind CSS 4.x (consistent with repo style)
- Standalone components — Angular 17+ style, no `NgModule` boilerplate
- `@testing-library/angular` + Jest (unit tests — query by role/label/text)
- Playwright (shared E2E test suite via `TEST_UI_PORT=3060`)

### Backend
- Go Gin API (spec 016) at port 5070; proxied via `proxy.conf.json` as `/api`

## Features (full parity with all existing frontends)

1. **Application list** — display all applications with status badges and key metadata
2. **Filtering** — filter by status, companyCategory, jobSource, skillsMatch, isArchived
3. **Sorting** — sort by any field, toggle direction
4. **Pagination** — server-side; navigate pages, show total count
5. **Application detail / create / edit** — full form with all fields, modal or routed page
6. **Interview stage management** — add, edit, remove stages; individual CRUD calls per stage
7. **Archive / restore** — available from list and detail views
8. **Inline editing** — click-to-edit key fields without opening full form
9. **Unsubmitted status** — hide `dateApplied` when `status = unsubmitted`; auto-set today on status change away from unsubmitted
10. **History panel** — slide-in timeline, newest first; expandable field-level diffs; restore-to-version button
11. **CSV import** — file picker, upload, result summary with row-level error list
12. **CSV export** — download all applications as dated `.csv` file
13. **CSV template** — download header + example row
14. **Resizable textareas** — auto-resize on content change

## Key Design Decisions

- **Standalone components** — Angular 17+ style (`standalone: true`, no `NgModule`); `app.config.ts` provides router and HttpClient globally
- **Angular Signals for state** — `signal()` + `computed()` manage component state (filters, applications list, history panel open/closed); avoids `ngOnChanges` complexity
- **RxJS only at HTTP boundary** — `HttpClient` returns `Observable<T>`; converted to signals via `toSignal()` or subscribed in services
- **Reactive Forms** — typed `FormGroup<ApplicationForm>` with synchronous validators; avoids template-driven form ambiguity
- **Proxy to Go API** — `proxy.conf.json` routes `/api` → `http://localhost:5070`; Angular UI works with any backend without code changes
- **E2E selector contract** — button text, input placeholders, and element IDs match the shared Playwright test suite (`tests/e2e/application-crud.spec.ts`)
- **`@testing-library/angular`** — uses `render()` + accessible queries (`getByRole`, `getByLabelText`, `getByText`) instead of Angular's `TestBed.configureTestingModule` + fixture API; avoids testing implementation details; same philosophy as `@testing-library/react` used in other UIs

## Success Criteria

- [ ] All 13 shared E2E tests pass (`test:e2e:angular`)
- [ ] Angular build passes with no errors (`build:angular-ui`)
- [ ] TypeScript strict mode — zero type errors (`ng build`)
- [ ] Linting passes (`lint:angular-ui`)
- [ ] `@testing-library/angular` unit tests pass (`test:angular-ui`)
- [ ] History panel and CSV import/export work end-to-end
- [ ] `status=unsubmitted` hides `dateApplied` correctly
- [ ] No regressions in existing stacks (`build:all`, `lint:all`, `test:all`, `test:e2e:all`)
