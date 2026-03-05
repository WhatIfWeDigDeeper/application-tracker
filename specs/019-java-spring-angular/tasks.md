# Tasks: Java Spring Boot + Angular

## Status: Complete

### Backend (`spring-api/`)

| # | Task | Status |
|---|------|--------|
| 1 | Bootstrap Gradle project (`build.gradle.kts`, `settings.gradle.kts`, wrapper, `TrackerApplication.java`) + Checkstyle config (`config/checkstyle/checkstyle.xml` — Google Java Style) | ✅ Done |
| 2 | `application.properties` + `.env` | ✅ Done |
| 3 | Flyway migration `V1__initial.sql` (schema, enums, tables) | ✅ Done |
| 4 | JPA entities (`Application`, `InterviewStage`, `ApplicationSnapshot`) | ✅ Done |
| 5 | Repositories (Spring Data JPA interfaces) | ✅ Done |
| 6 | Service layer (`ApplicationService`, `HistoryService`) | ✅ Done |
| 7 | CORS config (`WebConfig.java`) and Jackson camelCase config | ✅ Done |
| 8 | REST controller — core application endpoints: list (with filter/sort/pagination via `Specification` + `Pageable`), get, create, update (PATCH with status transitions + side effects), delete, archive, restore | ✅ Done |
| 8a | REST controller — interview stage endpoints: add stage, update stage (complete/rename/rate), delete stage, default stage creation on `→ interviewing` transition | ✅ Done |
| 8b | REST controller — history endpoints: get history, restore version; `HistoryService` snapshot capture on every mutation | ✅ Done |
| 8c | REST controller — CSV endpoints: import (`multipart/form-data`), export (`text/csv`), template; `CsvService` with 16-column format and duplicate detection | ✅ Done |
| 9 | Unit + slice tests: `ApplicationControllerTest` (`@WebMvcTest` + `@MockBean`), `ApplicationServiceTest` (Mockito) — cover status transitions, default stages, filter composition, validation errors | ✅ Done |

### Frontend (`angular-spring-ui/`)

| # | Task | Status |
|---|------|--------|
| 10 | Bootstrap Angular project (`ng new`), configure proxy (`proxy.conf.json → port 8080`), install Tailwind | ✅ Done |
| 11 | Core models and `ApplicationService` (HttpClient, all endpoints) | ✅ Done |
| 12 | Application list component (status badges, filter, sort, pagination) | ✅ Done |
| 13 | Application form component (create + edit, all fields, unsaved-changes guard) | ✅ Done |
| 14 | Application detail component (interview stages, archive/restore, offer due date display) | ✅ Done |
| 15 | History panel component (timeline, diffs, restore-to-version) | ✅ Done |
| 16 | CSV import/export | ✅ Done |
| 17 | Angular unit tests (`@testing-library/angular` + Jest) | ✅ Done |

### Monorepo Integration

| # | Task | Status |
|---|------|--------|
| 18 | Root `package.json` scripts (`dev`, `build`, `lint`, `test`, `migrate`, `install`, `test:e2e` for both packages; `:all` entries) | ✅ Done |
| 19 | `playwright.config.ts` — add port 3070 dev server | ✅ Done |
| 20 | `scripts/stop-all.sh` — add ports 3070 and 8080 | ✅ Done |
| 21 | `scripts/run-e2e.sh` — add `spring` stack entry | ✅ Done |
| 22 | CI workflow (`.github/workflows/verify-pr.yaml`) — Java 21 + Gradle setup | ✅ Done |
| 23 | Documentation (`README.md`, `docs/DATABASE_ARCHITECTURE.md`, `scripts/generate-schema-docs.sh`) | ✅ Done |
