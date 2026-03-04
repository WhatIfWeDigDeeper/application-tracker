# Spec 019: Java Spring Boot + Angular Implementation

**Status:** Complete
**Stack:** Java 21 + Spring Boot 3.4.x + Angular 21 + Tailwind CSS 4.x + Spring Data JPA + Hibernate 6 + Flyway + Gradle 8.x (Kotlin DSL)

---

## Context

This adds an 8th implementation to the monorepo. Spring Boot serves as a pure JSON REST API (`spring-api/`), paired with a new Angular SPA (`angular-spring-ui/`). The Angular frontend follows the same patterns established in spec 017 (`angular-ui/`) — standalone components, Angular Signals, Reactive Forms — but targets a Spring Boot backend rather than the Express/Koa/NestJS backends used by other Angular implementations.

Reference: `specs/core/` for technology-agnostic requirements.

---

## Stack Decisions

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Language | Java 21 | LTS, records, sealed classes |
| Framework | Spring Boot 3.4.x | Latest stable |
| MVC layer | Spring MVC (blocking) | Standard REST API; no reactive complexity needed |
| ORM | Spring Data JPA + Hibernate 6 | Most common Java ORM; JPA repositories reduce boilerplate |
| Migrations | Flyway (auto-runs on startup) | Standard Spring Boot migration tool |
| Build tool | Gradle 8.x with Kotlin DSL | Modern, fast builds; typed config |
| Linting | Checkstyle (Google Java Style) | Enforces consistent formatting; config at `config/checkstyle/checkstyle.xml` |
| Frontend | Angular 21 + Tailwind CSS 4.x | Consistent with spec 017 patterns |
| DB schema | `java_spring` | Follows `<language>_<framework>` naming convention |
| API port | **8080** | Java/Spring convention |
| UI port | **3070** | Next available in monorepo sequence |
| Directories | `spring-api/` + `angular-spring-ui/` | Separate UI+API processes, like all other stacks |

---

## Feature Scope

Every core feature is explicitly declared. See `specs/core/features/` for full requirements.

| Feature | Priority | Status | Notes |
|---------|----------|--------|-------|
| [001 Application Management](../core/features/001-application-management.md) | P1 | ✅ In scope | Separate form page for create/edit; unsaved-changes guard via Angular Router `CanDeactivate` |
| [002 Interview Tracking](../core/features/002-interview-tracking.md) | P1 | ✅ In scope | Default stages created on `applied → interviewing` transition (if no stages exist); reorder supported |
| [003 Offer Management](../core/features/003-offer-management.md) | P2 | ✅ In scope | Overdue/urgency indicators in list and detail; `offerDueDate` field shown when status is "given offer" |
| [004 Filtering & Sorting](../core/features/004-filtering-sorting.md) | P1 | ✅ In scope | Filters: status, companyCategory, jobSource, skillsMatch, includeArchived; sort: dateApplied/companyName/updatedAt; default sort: `updatedAt` desc; paginated response envelope |
| [005 Archive & Delete](../core/features/005-archive-delete.md) | P2 | ✅ In scope | Archive/restore on detail page; delete with confirmation dialog (cascades to stages) |
| [006 History](../core/features/006-history.md) | P2 | ✅ In scope | Snapshot created on every mutation; `data` column is JSONB; slide-in panel from right; field-level diffs; restore to version |
| [007 CSV Import/Export](../core/features/007-csv-import-export.md) | P2 | ✅ In scope | 16-column format; duplicate detection by `jobPostingUrl`; template download |
| [008 Inline Editing](../core/features/008-inline-editing.md) | P3 | ⬜ Deferred | Using separate form page instead |
| [009 Resizable Textareas](../core/features/009-resizable-textareas.md) | P3 | ⬜ Deferred | Not included in this implementation |

### Feature Notes

#### 001 — Application Management
- Edit flow: separate form page (not modal, not inline)
- Create and edit share the same `ApplicationFormComponent` with Reactive Forms
- Unsaved-changes guard: function-based `CanDeactivateFn<ApplicationFormComponent>` (Angular 17+ style — no class required); checks an `isDirty()` signal on the form component
- `dateApplied` field: hidden in the form and detail view when `status = unsubmitted`; shown for all other statuses. Auto-populated with today when status changes away from "unsubmitted" and `dateApplied` is null — handled server-side per state-transitions spec; UI reactively shows/hides the field based on the current status signal
- Validation: Bean Validation on DTOs server-side; Angular Validators client-side; exact rules per `specs/core/domain/validation-rules.md`

#### 002 — Interview Tracking
- 6 default stages auto-created on **any transition to "interviewing"** when no stages exist — including `unsubmitted → interviewing`, `applied → interviewing`, `rejected → interviewing`, etc. (not only from "applied"). See `specs/core/domain/state-transitions.md` for full transition table.
- Names and order per `specs/core/domain/entities.md`
- Stage CRUD: add, rename, mark complete (with date), delete (confirmation if completed), reorder
- Stages embedded in application response; no separate list endpoint

#### 003 — Offer Management
- `offerDueDate` field shown and editable when status is "given offer"
- List view shows urgency styling: warning (1–6 days), urgent (today), overdue (past due)
- Days-remaining count shown on detail page
- No separate prompt on status change — field is visible and editable in the form

#### 004 — Filtering & Sorting
- Filters: `status` (multi-select), `companyCategory` (multi-select), `jobSource` (multi-select), `skillsMatch` (minimum threshold), `includeArchived` (boolean)
- Sort fields: `dateApplied`, `companyName`, `updatedAt`; direction asc/desc
- Default sort: `updatedAt` descending
- Response envelope: `{ items: Application[], page: number, limit: number, total: number }`
- Spring `Pageable` used server-side; default page size 20

#### 006 — History
- Snapshot created on every create, update, archive, restore, and stage mutation
- `data` column: `JSONB` (stores full `JobApplication` state including stages array)
- History panel opened by a **"History" button** on the application detail page; slides in from the right
- Panel: newest-first, expandable entries showing field-level diffs (old value struck-through/red, new value green)
- Restore: writes snapshot fields back to application + creates new "Restored to version N" snapshot

#### 007 — CSV Import/Export
- 16-column format exactly as specified in `specs/core/features/007-csv-import-export.md`
- Duplicate detection: skip rows where `jobPostingUrl` matches any existing application (including archived) or a prior row in the same file
- Template download: header row + 1 example row

---

## Architecture

Two separate processes:

- **`spring-api/`** — Spring Boot REST API on port 8080; JSON responses only; no server-rendered HTML
- **`angular-spring-ui/`** — Angular SPA on port 3070; proxies `/api` → `http://localhost:8080`

CORS: Spring Boot allows requests from `http://localhost:3070`.

---

## Backend Folder Structure (`spring-api/`)

```
spring-api/
├── build.gradle.kts
├── settings.gradle.kts
├── config/checkstyle/checkstyle.xml    # Google Java Style ruleset
├── gradle/wrapper/
├── src/
│   ├── main/
│   │   ├── java/com/example/tracker/
│   │   │   ├── TrackerApplication.java
│   │   │   ├── config/
│   │   │   │   ├── WebConfig.java              # CORS configuration
│   │   │   │   └── JacksonConfig.java          # camelCase serialization
│   │   │   ├── controller/
│   │   │   │   └── ApplicationController.java  # @RestController, /api/applications
│   │   │   ├── dto/
│   │   │   │   ├── ApplicationRequest.java     # Java record + Bean Validation
│   │   │   │   ├── ApplicationResponse.java    # Java record
│   │   │   │   ├── InterviewStageRequest.java
│   │   │   │   └── InterviewStageResponse.java
│   │   │   ├── entity/
│   │   │   │   ├── Application.java            # @Entity, all fields
│   │   │   │   ├── InterviewStage.java         # @Entity, @ManyToOne Application
│   │   │   │   └── ApplicationSnapshot.java    # @Entity, JSONB data column
│   │   │   ├── repository/
│   │   │   │   ├── ApplicationRepository.java
│   │   │   │   ├── InterviewStageRepository.java
│   │   │   │   └── ApplicationSnapshotRepository.java
│   │   │   └── service/
│   │   │       ├── ApplicationService.java     # CRUD, status transitions, stage defaults
│   │   │       └── HistoryService.java         # snapshot capture, diff, restore
│   │   └── resources/
│   │       ├── application.properties
│   │       └── db/migration/V1__initial.sql
│   └── test/java/com/example/tracker/
│       ├── controller/ApplicationControllerTest.java   # @WebMvcTest slice tests
│       └── service/ApplicationServiceTest.java
└── .env
```

---

## Frontend Folder Structure (`angular-spring-ui/`)

Follows `angular-ui/` (spec 017) conventions — standalone components, Angular Signals, Reactive Forms:

```
angular-spring-ui/
├── package.json
├── angular.json
├── tsconfig.json
├── proxy.conf.json                     # /api → http://localhost:8080
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── models/                 # ApplicationStatus, CompanyCategory, JobSource, types
│   │   │   └── services/
│   │   │       └── application.service.ts   # HttpClient wrappers for all endpoints
│   │   ├── features/
│   │   │   └── applications/
│   │   │       ├── list/               # ApplicationListComponent (filters, sort, pagination)
│   │   │       ├── form/               # ApplicationFormComponent (create + edit)
│   │   │       ├── detail/             # ApplicationDetailComponent (stages, archive, history)
│   │   │       └── history/            # HistoryPanelComponent (slide-in, diffs, restore)
│   │   └── shared/
│   │       └── components/             # StatusBadgeComponent, ConfirmDialogComponent
│   ├── environments/
│   └── styles.css
└── eslint.config.js
```

---

## Database: Schema `java_spring`

Flyway migration `V1__initial.sql` creates:
- `java_spring` schema
- Enums: `application_status`, `company_category`, `job_source` (matching other stacks — values per `specs/core/domain/enums.md`)
- Tables: `applications`, `interview_stages`, `application_snapshots`
- Snapshot `data` column: `JSONB` — stores full `JobApplication` state including stages array

JPA config: `spring.jpa.properties.hibernate.default_schema=java_spring`

---

## Backend Dependencies (`build.gradle.kts`)

```kotlin
plugins {
    java
    id("org.springframework.boot") version "3.4.x"
    id("io.spring.dependency-management") version "1.1.x"
    id("checkstyle")                    // Google Java Style; config/checkstyle/checkstyle.xml
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.flywaydb:flyway-database-postgresql")
    runtimeOnly("org.postgresql:postgresql")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}
```

---

## Backend Configuration (`application.properties`)

```properties
server.port=8080
spring.datasource.url=${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/app_tracker?currentSchema=java_spring}
spring.datasource.username=${SPRING_DATASOURCE_USERNAME:postgres}
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD:}
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.properties.hibernate.default_schema=java_spring
spring.flyway.schemas=java_spring
spring.flyway.locations=classpath:db/migration
```

---

## Backend Implementation Notes

### Entity vs DTO distinction

JPA entities (`Application`, `InterviewStage`, `ApplicationSnapshot`) are standard mutable classes — **not** Java records. JPA requires a no-arg constructor and mutable fields. DTOs (`ApplicationRequest`, `ApplicationResponse`, etc.) are Java records and may use Bean Validation annotations.

### JSONB mapping (Hibernate 6)

The `ApplicationSnapshot.data` field maps to a PostgreSQL JSONB column. Annotate it with:

```java
@JdbcTypeCode(SqlTypes.JSON)
private String data;
```

Import `org.hibernate.type.SqlTypes` and `org.hibernate.annotations.JdbcTypeCode`. Jackson handles serialization automatically via Spring Boot's auto-configuration. Store the snapshot as a JSON string of the full `ApplicationResponse` shape (including stages array).

### Enum storage strategy

The Flyway migration creates PostgreSQL enum types (`application_status`, `company_category`, `job_source`). JPA entity fields use `@Enumerated(EnumType.STRING)` — Hibernate maps Java enum string values to PostgreSQL enum columns correctly. No custom type converter is needed.

### Filter implementation

Use Spring Data JPA `Specification<Application>` (Criteria API) for composing multi-criteria filters:

- Add `JpaSpecificationExecutor<Application>` to `ApplicationRepository`
- Create `ApplicationSpecifications` with static factory methods: `hasStatus(List<String>)`, `hasCategory(List<String>)`, `hasJobSource(List<String>)`, `hasMinSkillsMatch(Integer)`, `isArchived(boolean)`
- Combine in `ApplicationService` using `Specification.where(...).and(...)`
- Pass the combined spec + `Pageable` to `repository.findAll(spec, pageable)`

### Backend test strategy

- `ApplicationControllerTest`: `@WebMvcTest(ApplicationController.class)` with `@MockBean ApplicationService` — no database involved. Test HTTP request/response mapping, validation rejection (400s), and response shapes via MockMvc.
- `ApplicationServiceTest`: plain JUnit with `@ExtendWith(MockitoExtension.class)` and mocked repositories. Test business logic: status transitions, default stage creation, snapshot capture, filter composition.
- No H2 or TestContainers required — service and controller layers are tested in isolation.

---

## Frontend Implementation Notes

### RxJS / Signal boundary

Follow spec 017 (`angular-ui/`) patterns exactly:
- `HttpClient` returns `Observable<T>` — keep RxJS at the HTTP layer only
- Convert to signals at the component boundary using `toSignal()` from `@angular/core/rxjs-interop`
- Component state (filters, selected application, history panel open/closed, pagination) uses Angular Signals (`signal()`, `computed()`)
- Avoid `ngOnChanges` — use `effect()` to react to signal changes

### CanDeactivate guard

Use the function-based `CanDeactivateFn` interface (Angular 17+ style — no class required):

```ts
export const unsavedChangesGuard: CanDeactivateFn<ApplicationFormComponent> =
  (component) => component.isDirty() ? confirm('Discard unsaved changes?') : true;
```

Register on the form route in `app.routes.ts`. The `isDirty` property on `ApplicationFormComponent` is a `Signal<boolean>`.

### CSV operations

- **Export**: `GET /api/applications/export` — trigger via `window.location.href` (simplest; browser handles the download). No Angular HTTP client needed.
- **Import**: `POST /api/applications/import` with `multipart/form-data` — use Angular `HttpClient` with a `FormData` body; display the `ImportResult` response inline.
- **Template**: `GET /api/applications/sample-csv` — same `window.location.href` approach as export.

---

## Monorepo Integration

### Root `package.json` Scripts

```json
"dev:spring-api":            "cd spring-api && ./gradlew bootRun",
"build:spring-api":          "cd spring-api && ./gradlew build",
"lint:spring-api":           "cd spring-api && ./gradlew checkstyleMain",
"test:spring-api":           "cd spring-api && ./gradlew test",
"migrate:spring-api":        "cd spring-api && ./gradlew flywayMigrate",
"install:spring-api":        "cd spring-api && ./gradlew dependencies",
"dev:angular-spring-ui":     "cd angular-spring-ui && ng serve --port 3070",
"build:angular-spring-ui":   "cd angular-spring-ui && ng build",
"lint:angular-spring-ui":    "cd angular-spring-ui && ng lint",
"test:angular-spring-ui":    "cd angular-spring-ui && ng test --watch=false",
"install:angular-spring-ui": "cd angular-spring-ui && npm install",
"test:e2e:spring":           "TEST_UI_PORT=3070 PLAYWRIGHT_HTML_OPEN=never npx -y playwright test"
```

Add each to its `:all` counterpart. Add ports `8080` and `3070` to `scripts/stop-all.sh`.

### `playwright.config.ts`

```ts
3070: { command: 'npm run dev:angular-spring-ui', timeout: 120_000 },
```

The Spring Boot API must be started separately (or via `run-e2e.sh`) before Playwright runs. The 2-minute timeout accounts for Gradle compilation on first run (~15–30s) plus JVM startup.

### `scripts/run-e2e.sh`

Add `spring` to `STACKS`. `api_port=8080`, `api_script=dev:spring-api`, `ui_port=3070`, `ui_script=dev:angular-spring-ui`.

### CI (`.github/workflows/verify-pr.yaml`)

```yaml
- uses: actions/setup-java@v4
  with:
    java-version: '21'
    distribution: 'temurin'
- uses: gradle/actions/setup-gradle@v4
```

Add steps for `build:spring-api`, `lint:spring-api`, `test:spring-api`, `build:angular-spring-ui`, `lint:angular-spring-ui`, `test:angular-spring-ui`.

---

## Validation Chain

Before merging, all of the following must pass:

1. `npm run build:spring-api` — Gradle build + JAR compilation succeeds
2. `npm run lint:spring-api` — Checkstyle passes (Google Java Style)
3. `npm run test:spring-api` — unit + `@WebMvcTest` slice tests pass
4. `npm run build:angular-spring-ui` — Angular build passes with no errors
5. `npm run lint:angular-spring-ui` — ESLint passes
6. `npm run test:angular-spring-ui` — Angular unit tests pass
7. `npm run test:e2e:spring` — all 13 shared Playwright tests pass
8. `bash scripts/run-e2e.sh` — all stacks pass with no regression

---

## Documentation

When complete, the following must be updated:

- `README.md` — add stack to TOC, implementations list, dev commands (`dev:spring-api`, `dev:angular-spring-ui`), test commands
- `docs/DATABASE_ARCHITECTURE.md` — add `java_spring` schema, connection string, JPA config details
- `scripts/generate-schema-docs.sh` — add `java_spring` schema; run `npm run docs:schema`
- `CLAUDE.md` — add port mappings (8080 API, 3070 UI) and any new Java-specific patterns discovered

---

## E2E Test Compatibility

The Angular frontend must match the shared Playwright selector contract used by all other implementations:
- Button text, input placeholders, element IDs, and labels must be identical to other stacks
- `page.request.delete('/api/applications/${id}')` → `ApplicationController.deleteApplication()`
- Test cleanup in `afterAll` uses API calls, not UI interactions
- Confirm selector contract against `tests/e2e/` before declaring E2E complete

---

## Execution Approach

Single session, sequential (tasks in `tasks.md`). Isolated worktree recommended given the number of new files (new Gradle project, new Angular project), CI config changes, and monorepo wiring across multiple root-level files.
