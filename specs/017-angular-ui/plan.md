# Implementation Plan: Angular UI

**Branch**: `017-angular-ui` | **Date**: 2026-02-26 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/017-angular-ui/spec.md`

## Summary

Add an Angular 19 frontend (`angular-ui/`, port 3060) that connects to the Go Gin API (port 5070) via a dev proxy. Uses standalone components, Angular Signals for state, Reactive Forms for data entry, and `@testing-library/angular` + Jest for unit tests. Shares the existing Playwright E2E suite (`TEST_UI_PORT=3060`).

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Angular 19+
**Primary Dependencies**: `@angular/core`, `@angular/router`, `@angular/forms`, `@angular/common/http`, `rxjs`, `tailwindcss`, `@testing-library/angular`, `jest`, `jest-preset-angular`
**Build Tool**: Angular CLI (`ng build`, `ng serve`, `ng lint`, `ng test`)
**Backend**: Go Gin API at port 5070 (proxied as `/api`)
**Port**: 3060

## Architecture

### Directory Structure

```
angular-ui/
├── angular.json                    # CLI config: port 3060, proxy, jest builder
├── package.json
├── tsconfig.json                   # Strict mode, paths
├── tsconfig.app.json
├── tsconfig.spec.json              # Jest-specific tsconfig
├── proxy.conf.json                 # /api → http://localhost:5070
├── jest.config.js                  # jest-preset-angular, @testing-library/angular
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.ts                     # bootstrapApplication(AppComponent, appConfig)
    ├── styles.css                  # Tailwind @import
    ├── index.html
    └── app/
        ├── app.config.ts           # provideRouter, provideHttpClient, provideAnimations
        ├── app.routes.ts           # Route definitions
        ├── app.component.ts        # Root: header + <router-outlet>
        ├── core/
        │   ├── models/
        │   │   └── application.model.ts  # ApplicationStatus, JobApplication, InterviewStage,
        │   │                              # PaginatedResponse, HistoryEntry, ImportResult
        │   ├── services/
        │   │   └── application.service.ts # HttpClient: all 15 endpoints, typed Observables
        │   └── guards/
        │       └── unsaved-changes.guard.ts  # CanDeactivateFn using signal
        ├── features/
        │   ├── application-list/
        │   │   ├── application-list.component.ts
        │   │   └── application-list.component.html
        │   ├── application-detail/
        │   │   ├── application-detail.component.ts   # Reactive Form, all 36 fields
        │   │   └── application-detail.component.html
        │   ├── history-panel/
        │   │   ├── history-panel.component.ts        # signal(open), timeline rendering
        │   │   └── history-panel.component.html      # Slide-in, diffs, restore button
        │   └── csv/
        │       ├── csv-import.component.ts           # File picker, upload, results
        │       └── csv-export.component.ts           # Export + template download buttons
        └── shared/
            ├── components/
            │   ├── header/
            │   │   └── header.component.ts
            │   ├── inline-edit/
            │   │   └── inline-edit.component.ts      # Generic click-to-edit
            │   └── resizable-textarea/
            │       └── resizable-textarea.component.ts
            └── pipes/
                └── relative-date.pipe.ts             # "2 days ago" formatting
```

### State Management

Angular Signals are used exclusively for component state — no NgRx, no BehaviorSubject for UI state:

```
ApplicationListComponent
  filters = signal<FilterParams>({})
  applications = signal<JobApplication[]>([])
  total = signal<number>(0)
  currentPage = signal<number>(1)
  → computed() for derived values (pageCount, hasNextPage)
  → effect() to re-fetch when filters/page change

ApplicationDetailComponent
  application = signal<JobApplication | null>(null)
  isDirty = signal<boolean>(false)   ← used by CanDeactivateFn
  form = new FormGroup<ApplicationForm>(...)

HistoryPanelComponent
  isOpen = signal<boolean>(false)
  history = signal<HistoryEntry[]>([])
```

### Routing

```
/                          → ApplicationListComponent
/applications/new          → ApplicationDetailComponent (create mode)
/applications/:id          → ApplicationDetailComponent (edit mode)
```

`CanDeactivate` guard on `/applications/:id` and `/applications/new` — checks `isDirty` signal before navigating away.

### HTTP / Proxy

`proxy.conf.json` routes all `/api/**` requests to `http://localhost:5070` during dev. Production build would need environment-specific API URL configuration.

### Testing Strategy

Unit tests use `@testing-library/angular`:
- `render(ComponentClass, { imports: [...] })` — mount standalone component
- `getByRole`, `getByLabelText`, `getByText` — accessible queries; never query by CSS selector or component internals
- `HttpClientTestingModule` + `HttpTestingController` in `ApplicationService` tests to verify request/response mapping
- No snapshot tests

## Files to Create

### Angular Source (~28 files)
| File | Purpose |
|------|---------|
| `src/main.ts` | Bootstrap entry point |
| `src/index.html` | Shell HTML |
| `src/styles.css` | Tailwind CSS entry |
| `src/app/app.config.ts` | Global providers (router, HttpClient, animations) |
| `src/app/app.routes.ts` | Route definitions |
| `src/app/app.component.ts` | Root shell component |
| `src/app/core/models/application.model.ts` | All TypeScript interfaces and enums |
| `src/app/core/services/application.service.ts` | All 15 API endpoint methods |
| `src/app/core/guards/unsaved-changes.guard.ts` | CanDeactivateFn |
| `src/app/features/application-list/application-list.component.ts` | List + filter + sort + pagination |
| `src/app/features/application-list/application-list.component.html` | List template |
| `src/app/features/application-detail/application-detail.component.ts` | Full form (create + edit) |
| `src/app/features/application-detail/application-detail.component.html` | Form template |
| `src/app/features/history-panel/history-panel.component.ts` | Slide-in history timeline |
| `src/app/features/history-panel/history-panel.component.html` | History template |
| `src/app/features/csv/csv-import.component.ts` | File picker + upload + results |
| `src/app/features/csv/csv-export.component.ts` | Export + template download buttons |
| `src/app/shared/components/header/header.component.ts` | App header |
| `src/app/shared/components/inline-edit/inline-edit.component.ts` | Click-to-edit |
| `src/app/shared/components/resizable-textarea/resizable-textarea.component.ts` | Auto-resize textarea |
| `src/app/shared/pipes/relative-date.pipe.ts` | Relative date formatting |
| Unit test files (`.spec.ts`) for each feature component and service (~6 files) | `@testing-library/angular` tests |

### Config Files (8 files)
| File | Purpose |
|------|---------|
| `package.json` | Angular + dependencies |
| `angular.json` | CLI workspace config (port 3060, proxy, jest builder) |
| `tsconfig.json` | Base TypeScript config (strict) |
| `tsconfig.app.json` | App-specific tsconfig |
| `tsconfig.spec.json` | Jest-specific tsconfig |
| `proxy.conf.json` | Dev proxy: /api → :5070 |
| `jest.config.js` | jest-preset-angular setup |
| `tailwind.config.js` + `postcss.config.js` | Tailwind CSS config |

## Files to Modify (Project-Level)

| File | Change |
|------|--------|
| Root `package.json` | Add `dev:angular-ui`, `build:angular-ui`, `lint:angular-ui`, `test:angular-ui`, `audit:ci:angular-ui`, `install:angular-ui`, `docs:types:angular-ui`; add composites `build:angular`, `install:angular`; append to all `:all` scripts; add `test:e2e:angular` |
| `playwright.config.ts` | Add `3060: 'cd angular-ui && npm run dev'` to `webServerCommands` |
| `scripts/stop-all.sh` | Add port 3060 |
| `docker-compose-all.yml` | Add `angular-ui` service |
| `README.md` | Add Angular UI to implementations table, running instructions, test commands |

## Execution Strategy

**Phase 1** (Scaffolding): `ng new`, Tailwind config, proxy config, Jest config, tsconfig
**Phase 2** (Models + Service): `application.model.ts` (all types), `application.service.ts` (all 15 endpoints)
**Phase 3** (Application List): list component with filtering, sorting, pagination, archive/restore actions
**Phase 4** (Application Detail): reactive form, status/dateApplied constraint, interview stages, unsaved changes guard
**Phase 5** (History Panel): slide-in component, timeline rendering, field diffs, restore button
**Phase 6** (CSV): import component, export button, template download
**Phase 7** (Shared): inline-edit component, resizable-textarea, header, relative-date pipe
**Phase 8** (Unit Tests): `@testing-library/angular` test files for service and each feature component
**Phase 9** (Project Integration): package.json scripts, playwright.config.ts, stop-all.sh, docker-compose-all.yml
**Phase 10** (Validation): `ng build`, `ng lint`, `ng test --watch=false`
**Phase 11** (E2E + Docs): `test:e2e:angular`, fix selector issues, update README

## Verification

1. `cd angular-ui && npm install && ng build` — zero TypeScript/build errors
2. `cd angular-ui && ng lint` — zero ESLint warnings
3. `cd angular-ui && ng test --watch=false` — all Jest unit tests pass
4. Start Go API + Angular UI; manually verify CRUD, history panel, CSV import/export
5. `npm run test:e2e:angular` — all 13 shared Playwright tests pass
6. `npm run build:all && npm run lint:all && npm run test:all` — no regressions
