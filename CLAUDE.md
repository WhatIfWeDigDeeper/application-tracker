# CLAUDE.md

## Repository Overview

Monorepo with multiple frontend+backend implementation pairs sharing a single PostgreSQL database. Skills in `.claude/skills/` (project-local and upstream-synced) and `.agents/skills/` (upstream-installed originals — see Agent Skills Policy), commands in `.claude/commands/`.

## Key Patterns

- **Worktree Isolation**: Complex operations use isolated worktrees at `../<name>-[timestamp]`. Always specify `origin/main` as the base when creating: `git worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME" origin/main` — omitting the start-point defaults to the current HEAD, which causes the PR to include unintended commits. After a worktree agent completes, always verify the commit landed on a feature branch — not on `main` — by checking `git log --oneline --decorate -3`. If the commit is on `main`, first create a feature branch from it and push it (`git checkout -b <branch> && git push -u origin <branch>`), then reset local main (`git checkout main && git reset --hard origin/main`).
- **Validation Chain**: `build:*` → `lint:*` → `test:*` → `test:e2e:*`
- **Script Naming**: Scripts follow `verb:package-name` (e.g., `build:react-next-ui`, `lint:angular-ui`). Use `:all` suffix for scripts that run across all packages. `test:e2e:*` uses the UI package name (e.g., `test:e2e:react-next-ui`, `test:e2e:tanstack-ui`). When adding a new implementation, add per-package scripts for every verb (`dev`, `build`, `lint`, `test`, `ci`, `audit:ci`) and add each to its `*:all` script and to `scripts/stop-all.sh`. When adding a new script group (new verb pattern like `validate:*`), also update `README.md` — add a TOC entry and a usage section so the pattern is discoverable. Do not wait to be asked.
- **Parallel Execution**: 3+ items use Task tool subagents
- **Spec First**: When planning a new feature, the first implementation step should be to write the spec to `specs/<number>-<name>/spec.md`
- **Spell Checker**: When cspell flags a valid term (tool names, libraries, technical jargon), add it to `cspell.config.yaml` under `words`
- **Plan Execution**: Plans must end with a statement of how the work will be run — e.g., single session (sequential), parallel subagents, agent team, or isolated worktree — so the approach is visible before implementation begins.
- **Persisting Learnings**: When you discover a new gotcha, stack-specific pattern, or tool quirk during a session, add it directly to the relevant section of `CLAUDE.md` before ending the session — so teammates and future agents benefit. For repeatable multi-step processes, create a skill in `.claude/skills/`. **NEVER write to `~/.claude/projects/.../memory/` for this project** — those files are invisible to other contributors, may be reset, and are not the persistence mechanism for this repo. `CLAUDE.md` is the only approved place for project learnings. If any files exist in the memory directory, delete them. **After applying learnings, stop — do not commit, branch, or open a PR.** The user will review the changes and run `/ship-it` manually when ready.
- **Searching files**: Use `rg` (ripgrep) instead of `grep` or `find` for better performance and features.
- **Agent Skills Policy**: When responding to PR review feedback, do not directly apply reviewer suggestions to files in `.agents/skills/` — post a reply noting the suggestion will be addressed upstream instead. Skills sourced from `WhatIfWeDigDeeper/agent-skills` (including `pr-comments`, `ship-it`, `learn`, `playwright-cli`, etc.) are maintained upstream; deliberate version upgrades or syncs via dedicated PRs are fine. Only project-owned files (`scripts/`, `.vscode/`, `docs/`, `fastapi/`, application source) are in-scope for directly applying reviewer feedback.

## Active Technologies
- TypeScript 5.x (strict mode) + React 19, Vite 7.x, Next.js 16, Tailwind CSS 4.x
- Zustand 5, React Router 7, TanStack Query v5, TanStack Router, Apollo Client
- Vitest, @testing-library/react, Playwright
- Python 3.12+ (fastapi package uses 3.14) with FastAPI, asyncpg, Pydantic v2, uv
- PostgreSQL 18 (single database with multiple schemas)
- DynamoDB (via lambda-api — no direct DB access from frontend)

## Documentation Guidelines

- **NEVER create documentation at repository root** - use `/docs/` or `<package-name>/docs/` (e.g., `yoga-api/docs/`)

## Database Architecture

Single PostgreSQL database (`app_tracker`) with schema-per-implementation isolation:
- **express_prisma** — `api/prisma/schema.prisma`
- **react_koa** — `koa-api/src/db/schema.sql`
- **svelte_hono** — `hono-api/src/db/schema.ts` (Drizzle)
- **vue_nuxt** — `nuxt-api/server/db/schema.ts` (Drizzle), shared types via `@shared` alias
- **react_nestjs** — `nest-api/src/database/schema.ts` (Drizzle)
- **python_fastapi** — `fastapi/migrations/001_initial.sql` (asyncpg, raw SQL); also used by `tanstack-start-ui/` (React SSR via TanStack Start, port 3040)
- **java_spring** — `spring-api/src/main/resources/db/migration/V1__initial.sql` (Spring Data JPA + Hibernate 6, Flyway auto-migration)
- **go_gin** — `go-api/migrations/001_initial.up.sql` (pgx/sqlc, raw SQL)
- **graphql_yoga** — `yoga-api/prisma/schema.prisma` (Prisma); paired with `react-apollo-ui` (port 3080)

Connection string: `postgresql://<user>:<password>@localhost:5432/app_tracker?schema=<schema_name>`

See [docs/DATABASE_ARCHITECTURE.md](docs/DATABASE_ARCHITECTURE.md) for per-implementation config details.

## Code Quality Requirements

**Always complete the full validation chain before committing** — `tsc --noEmit` alone is not sufficient. Re-run the entire chain after every round of changes — not just the initial implementation. Fixing a bug introduced during review still requires the full chain.

**When adding or modifying tests, automatically run them after implementation** — do not wait for the user to ask. Use the most targeted test command available. Report pass/fail results immediately.

**When fixing a bug or test failure, automatically run the relevant tests after applying the fix** — do not wait for the user to ask. Use the most targeted test command available (e.g., `test:e2e:react-ui` for a react-ui failure). Report pass/fail results immediately.

**When fixing a shared E2E test failure** — shared tests in `tests/e2e/` run against all stacks. After applying a fix, run `bash scripts/run-e2e.sh all` (or `npm run test:e2e:all`) to confirm no other stack regressed. Do not stop after the originally failing stack passes.

1. **Add tests** — Create or update tests for new functionality. Include E2E tests when the change affects user-visible behavior (labels, UI interactions, API contracts). **When fixing a bug, write a failing test first that reproduces the issue, then fix it** — this ensures the bug is understood and won't regress.
2. **Build** - `npm run build:<stack>` (runs per-package build; catches compilation errors)
3. **Lint** - `npm run lint:<stack>` (ESLint/ruff across packages)
4. **Test** - `npm run test:<stack>` (unit/integration tests — catches logic errors `tsc` misses)
5. **E2E** *(when UI/API behavior changed)* - `npm run test:e2e:<stack>` (e.g., `test:e2e:react-next-ui`)
6. **Docs** *(when user-visible behavior changes)* — Update `specs/core/domain/` files and `README.md` as needed when labels, statuses, UI text, or API contracts change. Also run generated docs when applicable: `npm run docs:types:<stack>` when public TypeScript types change, `npm run docs:schema` when DB schema changes. Feature specs (`specs/<number>-*/spec.md`) are historical — do not retroactively rewrite them; document changes in the current feature's own spec instead.

**Skip when:** trivial changes (all steps), test-only changes (step 1), docs-only changes (all steps).

**When adding or changing packages** — run two additional steps before the validation chain:
- `npm run install:<stack>` — keeps the lockfile in sync
- `npm run audit:ci:<stack>` — fails on known vulnerabilities (e.g. `audit:ci:angular-ui`, `audit:ci:fastapi`). If it fails, try `npm audit fix` (npm) or `uv lock --upgrade-package <package>` (Python) first; if that doesn't resolve it, upgrade the offending package manually or find an alternative. After fixing vulnerabilities, run `audit:ci:all` and check for "Consider not allowlisting advisory" messages — remove stale GHSA entries from `.auditconfig.json` files when the underlying vulnerability has been resolved.
Then proceed with the full build → lint → test → e2e chain as normal.

**When adding a new implementation** — run `audit:ci:<stack>` for both the API and UI packages before considering the implementation complete. High or critical vulnerabilities must be fixed — do not merge with known high/critical CVEs. For npm-based stacks, try `npm audit fix` first; if that doesn't resolve it, upgrade the offending package manually or find an alternative.

**When changing public TypeScript types** — regenerate the type diagrams for the affected stack:
- `npm run docs:types:<stack>` (e.g. `docs:types:angular-ui`, `docs:types:nuxt-api`)

## Dependency Management

When installing **new npm packages**: use the latest stable major.minor.patch version, exact versions (no ^ or ~), install `@types/*` if needed. Exception: if the latest major is at `x.0.0` with no patches yet, stay on the previous major until `x.0.1+` is available — brand-new majors at `.0.0` have no patch history and may have rough edges. Use `npm install pkg@x.y.z --save-exact` (or `-E`) to pin the exact version — this prevents npm from silently adding a `^` caret. If you omitted `--save-exact`: verify package.json afterward and remove the caret to restore exact pinning; the lockfile's `packages[""]` section also picks up the caret, so after removing it from `package.json`, re-run `npm install` in the affected npm package directory (the one containing that `package.json`/`package-lock.json`) to regenerate the correct lockfile with exact specifiers, or use the corresponding `npm run install:<stack>` script if one exists.

When installing **new Python packages**: `cd fastapi && uv add <package>` (or `uv add --dev <package>` for dev deps). Use exact versions in `pyproject.toml`.

When **updating**: use the `update-deps` skill (npm only), then run the full validation chain. For Python deps, use `uv lock --upgrade-package <package>`.

**npm overrides for security vulnerabilities** — When a transitive dependency is vulnerable but the fix is within the same major version (e.g., `path-to-regexp@8.3.0` → `8.4.2`), add an `"overrides"` block to the package's `package.json` to force the patched version rather than allowlisting in `.auditconfig.json`. This keeps `npm audit` meaningful and avoids accumulating stale allowlist entries. Example: `"overrides": { "path-to-regexp": "8.4.2", "picomatch": "4.0.4" }`. After adding overrides, run `npm install` in that package's directory (or `npm run install:<stack>` if available) and verify with `npm run audit:ci:<stack>` (or explicitly `npx -y audit-ci --config .auditconfig.json`), to avoid accidentally modifying the root lockfile or another stack's lockfile.

**`audit-ci` vs `npm audit` divergence** — The advisory database can update between runs. Local `npm audit` may show 0 vulnerabilities while CI `npm run audit:ci:<stack>` / `npm run audit:ci:all` can find new advisories. Always verify security status using the repo's canonical audit-ci invocation (`npm run audit:ci:<stack>`, `npm run audit:ci:all`, or explicitly `npx -y audit-ci --config .auditconfig.json`) — not just `npm audit` — before declaring a package clean.

**`audit:ci:all` stops at first failure** — To find "Consider not allowlisting advisories" messages across all packages, run audit-ci per-package individually (`for dir in ...; do (cd "$dir" && npx -y audit-ci --config .auditconfig.json); done`) rather than `npm run audit:ci:all`, which halts at the first failing package and hides stale-allowlist warnings in later packages.

**Fix vulnerabilities across all packages in one pass** — When a CI audit failure names a specific package (e.g. `drizzle-orm`), grep for it across all `package.json` files before committing the fix: `grep -r '"drizzle-orm"' */package.json`. Multiple packages often share the same vulnerable dependency; fixing only the one CI reported causes a second CI failure on the next package in the chain. After applying all fixes, run `npm run audit:ci:all` (or the per-package loop) to confirm every package passes before committing.

**vitest 3.x is incompatible with vite 7.x** — Forcing vite 7.x via `"overrides": { "vite": "7.x.x" }` while a package still uses vitest 3.x causes `ReferenceError: __vite_ssr_exportName__ is not defined` at test time. vitest 4.x supports `vite ^6.0.0 || ^7.0.0 || ^8.0.0`. When adding a vite override, also upgrade vitest from 3.x to 4.x in the same package. If `vitest-mock-extended` is present, upgrade it to 4.0.0 as well (peer dep requires `vitest >=4.0.0`).

**Prisma client regeneration** — After bumping `prisma` + `@prisma/client` (or `@prisma/adapter-pg`), run `npx prisma generate` in the package directory before building — otherwise TypeScript compilation fails with "Module '@prisma/client' has no exported member 'Prisma'".

## API Design Patterns

Prefer individual CRUD operations (`addStage`, `updateStage`, `removeStage`) over batch replace. Pass individual callbacks (`onAdd`, `onUpdate`, `onRemove`) instead of a single `onChange` with full state.

## Cross-Framework Patterns

- **Prisma dates**: Returns ISO datetime (`2026-02-09T00:00:00.000Z`), HTML inputs need `YYYY-MM-DD` — use `.split('T')[0]`
- **API 204 handling**: `response.json()` on 204 throws — check `response.status === 204` first
- **Zod optional vs null**: `z.string().optional()` rejects `null` — use `undefined` so `JSON.stringify` omits the key
- **React Router useBlocker**: Only works with `createBrowserRouter` + `RouterProvider`, not `<BrowserRouter>`
- **Avoid absolute positioning for sibling elements**: When multiple elements share the same corner (e.g., badge + action menu), use flexbox flow instead of `absolute` — prevents overlap
- **Validation limit changes**: When updating max lengths in constants/schemas, rg (ripgrep) for hardcoded boundary values in tests (e.g., `repeat(1001)`) — tests may silently pass with stale limits
- **Zod boolean coercion**: `z.coerce.boolean()` treats any non-empty string (including `"false"`) as `true` — use `z.preprocess((val) => val === 'true' || val === true, z.boolean())` for query params. **`.default()` gotcha**: if the preprocess runs on `undefined` (absent param), it returns `false`, which is a valid boolean — so `.default(true)` never fires. Fix: return `undefined` from preprocess when `val === undefined` so `.default()` can apply.
- **Null vs undefined in validation**: API fields that are "not set" often return `null`, not `undefined`. Strict `!== undefined` checks let `null` slip into range/format validators where JS coercion causes false failures (e.g. `null < 1` → `true`) — use `!= null` (loose equality) to treat both as absent.
- **Drizzle `date()` columns** (hono-api, nest-api, nuxt-api): expect YYYY-MM-DD strings, not `Date` objects — use `new Date().toISOString().split('T')[0]` for today, not `new Date()` directly
- **Default sort order**: All stacks sort applications by `updatedAt` descending, not `dateApplied` — do not assume date-applied ordering in queries or E2E tests

## CSV Import Patterns

- **Stacks with CSV support**: nest-api, fastapi, go-api, spring-api, yoga-api — all 5 must be updated when changing the CSV format or column list.
- **Multi-line fields**: Never pre-split CSV content by newlines before parsing — quoted fields can contain embedded newlines. Process the entire file character-by-character, tracking `inQuotes` state, and only treat `\n` as a row separator when `inQuotes` is false.
- **Prisma enum `@map` values**: CSVs store `@map` display values (e.g. `"company-website"`, `"media-entertainment"`) but Prisma `create()`/`update()` requires the enum identifier name (`company_website`, `media_entertainment`). Add a lookup table (like `STATUS_DISPLAY_TO_PRISMA`) for each enum with hyphenated/spaced `@map` values and apply it during import.

## Angular Patterns

- **Confirm dialog `role="dialog"`**: Locators using `[role="dialog"] button:has-text(...)` require the inner dialog container div to have `role="dialog"` — Angular components don't add it automatically. Always include `role="dialog"` on the modal content div in `ConfirmDialogComponent`.

## Vue.js Patterns

- **Router component reuse**: `onMounted` won't re-fire on param change — use `watch(() => props.id)` to reload data
- **Nav guard bypass**: `onBeforeRouteLeave` fires on `router.push()` — use a `skipNavGuard` ref, set `true` before push
- **Pinia setup stores**: vue-ui uses setup stores (not options API) with Immer `produceWithPatches` for event sourcing — do not convert to composable style
- **Event sourcing schema**: `vue_nuxt` has `application_events` + `application_snapshots` tables; history is event-sourced
- **Validation limit sync**: Frontend and backend validation limits (e.g. max events list) must stay in sync
- **`@shared` alias**: Shared types live in `nuxt-api/shared/`; both `tsconfig.json` and `vite.config.ts` need the alias configured

## Svelte Patterns

- **SvelteKit SSR**: Add `export const ssr = false` in `src/routes/+layout.ts` for SPA mode with Playwright
- **Svelte 5 bind:value**: Doesn't propagate with callback `onchange` — use local `$state` + `$effect`, call callback in `oninput`
- **Svelte 5 event delegation**: `stopPropagation()` doesn't prevent parent `<a>` navigation — avoid wrapping interactive cards in `<a>` tags; use `onclick` with `goto()` instead

## Java/Spring Patterns

- **Spring Boot port**: 8080 (`spring-api/`), Angular Spring UI port: 3070 (`angular-spring-ui/`)
- **JPA enum with PostgreSQL custom types**: PostgreSQL enum values with spaces/hyphens (e.g. "given offer", "enterprise-software") require `AttributeConverter<MyEnum, String>` — `@Enumerated(EnumType.STRING)` alone won't work correctly
- **`@Converter` without `autoApply`**: `@Converter` without `autoApply = true` is silently inert if no entity field references it directly — verify usage before writing a new Converter when entities already use `@Type(XxxUserType.class)`
- **UserType.fromDbValue delegation**: `fromDbValue()` in each `PostgreSQLEnumType` subclass should delegate to the enum's own `fromValue()` — don't re-implement the same lookup loop
- **TypeReference for diff maps**: In diff/compare methods that deserialize JSON to a map, use `objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {})` instead of raw `Map.class` — avoids `key.toString()` casts and compiler warnings
- **GlobalExceptionHandler catch-all**: Always include `@ExceptionHandler(RuntimeException.class)` in `@RestControllerAdvice` — without it, `RuntimeException` wrappers around `JsonProcessingException` surface as empty 500 responses to clients
- **JSONB snapshots**: Use `@JdbcTypeCode(SqlTypes.JSON)` from `org.hibernate.annotations` with Hibernate 6 for JSONB columns
- **Spring Data JPA filtering**: `Specification<T>` + `JpaSpecificationExecutor<T>` for multi-criteria filters; compose with `Specification.where().and()`
- **`isXxx` field naming**: JPA boolean fields named `isXxx` conflict with getter naming; name the field `archived` (not `isArchived`) — getter `isArchived()`, setter `setArchived()`
- **OWASP dependency-check heap**: `dependencyCheckAnalyze` can OOM with default Gradle heap on this repo; run it with `-Dorg.gradle.jvmargs='-Xmx4096m -XX:MaxMetaspaceSize=1024m'` (wired in `audit:ci:spring-api`)
- **Batch import + class-level `@Transactional`**: `@Transactional` at class level makes a failed `saveAndFlush` mark the transaction rollback-only — catch blocks can't recover. Fix: `@Transactional(propagation = NOT_SUPPORTED)` + `TransactionTemplate` per row.
- **LinkedIn URLs exceed VARCHAR(500)**: URL columns for job posting/company URLs should use `TEXT` — LinkedIn tracking URLs commonly exceed 500 chars
- **Jackson date serialization**: `LocalDate`/`LocalDateTime` serialize as arrays (e.g. `[2026,3,5]`) by default — add `.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)` to `ObjectMapper` config to get ISO strings (`"2026-03-05"`, `"2026-03-05T13:00:00Z"`)
- **Managed version overrides**: Use `extra["tomcat.version"]`, `extra["postgresql.version"]`, `extra["log4j2.version"]` in `build.gradle.kts` to pin patch versions ahead of Spring Boot's BOM — preferred for CVE fixes
- **InterviewStageResponse DTO**: Uses `name`/`order` (not `stageName`/`stageOrder`) to match Angular frontend model
- **HistoryEntry DTO**: Uses `sequence`/`changes` (not `sequenceNumber`/`diffs`) to match frontend model
- **`POST /interview-stages` returns 201 + `InterviewStageResponse`**: The `addStage` and `updateStage` service methods must use `stageRepository.saveAndFlush(stage)` (not cascade via `applicationRepository.saveAndFlush(app)`) to get the stage entity with its assigned UUID — `GenerationType.UUID` does not populate the ID on cascade-saved children in the caller's scope
- **`HttpMessageNotReadableException` handler**: Invalid JSON (malformed date strings, wrong type coercions) throws `HttpMessageNotReadableException` which extends `RuntimeException`. Add an explicit `@ExceptionHandler(HttpMessageNotReadableException.class)` returning 400 with `{"code": "validation_error"}` before the generic `RuntimeException` catch-all handler to distinguish client errors from server errors
- **Angular Spring UI endpoint mismatch**: `angular-spring-ui` calls `/api/applications/:id/interview-n` (not `/interview-stages`) — the interview-stage feature in the Angular Spring UI is broken by design; do not route-match or rename `/interview-stages` to `/interview-n`

## TanStack UI + NestJS Patterns

- Stack: React 19 + TanStack Query v5 + TanStack Router + NestJS (Fastify adapter) + Drizzle; tanstack-ui port 3050, nest-api port 5050, DB schema `react_nestjs`; snapshot-based history
- **TanStack Router file-based routing**: `src/routes/__root.tsx`, `index.tsx`, `applications/new.tsx`, `applications/$id.tsx`
- **TanStack Query**: Query key factory pattern in `src/queries/queryKeys.ts`
- **NestJS DI with tsx**: Must use explicit `@Inject(ServiceClass)` on constructor params — tsx/esbuild doesn't emit decorator metadata, so parameter-based injection fails silently
- **Zod validation pipe**: Custom Zod validation pipe used, not class-validator — do not add class-validator decorators
- **Vite proxy**: `/api` → `http://localhost:5050` with path rewrite

## FastAPI Patterns

- Stack: Python 3.14 + FastAPI + asyncpg (raw SQL) + Pydantic v2, managed by `uv`; port 5160 (5060 reserved by macOS SIP), DB schema `python_fastapi`
- **Functional style**: Service functions take `asyncpg.Pool` as first arg — no service classes, only Pydantic model classes
- **Pydantic CamelModel**: Base class uses `alias_generator=to_camel`; use `model_dump(by_alias=True)` for API responses
- **Partial PATCH via `model_fields_set`**: Distinguishes explicitly-set fields from absent ones — required for correct partial update behavior
- **asyncpg DATE columns**: Require `datetime.date` objects, not strings — use the `parse_date()` helper in `src/services/shared.py`
- **asyncpg SSL**: Pass `ssl=False` for local Docker PostgreSQL — asyncpg defaults to SSL which fails locally
- **python-dotenv scope**: `load_dotenv()` walks up the directory tree — restrict it to `fastapi/.env` explicitly to avoid picking up a root `.env`
- **PostgreSQL enum casts**: Need explicit schema-qualified casts, e.g. `$1::python_fastapi.application_status`
- **Dev deps**: `uv sync --extra dev`; run server via `uv run python -m src`

## Go API Patterns

- Stack: Go + Gin + pgx/sqlc; go-api port 5070, angular-ui port 3060, DB schema `go_gin`
- **StageInput JSON keys**: Uses `name`/`order` (not `stageName`/`stageOrder`) — must match what Angular frontend sends
- **ApplicationInput validation**: No `binding:"required"` struct tags — validation done in service layer; `UpdateApplication` falls back to existing `companyName`/`positionTitle` when omitted
- **angular-ui proxy**: `/api` → `http://localhost:5070` with `pathRewrite: {'^/api': ''}` in Angular dev proxy config
- **Server startup**: `go run ./cmd/server` compiles and starts; `run-e2e.sh` manages lifecycle via `dev:go-api` npm script
- **Manual restart after kill**: If go-api is killed manually, use `bash scripts/run-e2e.sh angular-ui` (not `npm run test:e2e:angular-ui`) — the npm script does not start the API backend

## Lambda + DynamoDB API Patterns

- Stack: TypeScript + Hono + AWS Lambda + DynamoDB; lambda-api port 5090, DB `lambda_api_applications` (DynamoDB, NOT PostgreSQL)
- **Local dev approach**: Same Hono app runs as local server (`server.ts` via `@hono/node-server`) and as Lambda handler (`handler.ts` via `hono/aws-lambda`) — no LocalStack needed
- **DynamoDB Local**: `amazon/dynamodb-local` Docker container on port 8000 (configurable via `DYNAMODB_PORT` env var in docker-compose.yml); start with `docker compose up -d dynamodb-local`. Uses a bind mount (`./data/dynamodb:/data`) with `user: root` to avoid SQLite permission issues that occur with named Docker volumes. The `data/` directory is gitignored.
- **Table setup**: `npm run migrate:lambda-api` runs `lambda-api/scripts/setup-dynamodb.ts` (idempotent — skips if table exists). Data persists across container restarts via the bind mount.
- **`dotenv` + ESM module init order**: `tsx` injects `.env` AFTER module-level code runs. `dynamodb.client.ts` creates the `DynamoDBClient` at module load time, so it must `import 'dotenv/config'` as its first line — otherwise `DYNAMODB_ENDPOINT` is unset and the client silently targets real AWS. Do not rely on `dotenv.config()` in `server.ts` to cover this.
- **`GlobalSecondaryIndex` has no `BillingMode` field**: `BillingMode` is a top-level `CreateTableCommand` property only — do not set it on individual GSI definitions or TypeScript will reject the call.
- **Removing a stopped Docker container before deleting its volume**: `docker volume rm` fails with "volume is in use" even for stopped containers — run `docker rm <container>` first, then `docker volume rm`.
- **Single-table design**: All items share the `lambda_api_applications` table; item types distinguished by SK prefix (`APP#`, `STAGE#`, `HIST#`)
- **GSI1**: `GSI1PK=STATUS#<status>#ARCHIVED#<0|1>` / `GSI1SK=UPDATED#<timestamp>#<id>` — filter by status + archived, sort by updatedAt
- **GSI2**: `GSI2PK=ACTIVE` / `GSI2SK=UPDATED#<timestamp>#<id>` — all non-archived apps, sorted by updatedAt
- **Pagination**: API contract uses offset-based pagination (`page`/`limit`); DynamoDB scan + in-memory slice (appropriate at job-tracker scale). Cursor mode is opt-in: pass `cursor` query param (`'start'` or a base64-encoded `{"page":N}` token); response shape changes to `{ items, limit, nextCursor, hasMore }` (no `total`). In the Zustand store, compute a synthetic total so pagination UI stays consistent: `hasMore ? page * limit + 1 : (page - 1) * limit + items.length` — never use `items.length` alone or the total will reflect only the current page.
- **Cascade delete**: Querying `PK=APP#<id>` returns all related items (stages + history); `DeleteCommand` each one
- **History sequence**: Stored as atomic counter on the application item (`historySequence`); incremented via `UpdateCommand ADD historySequence :inc` before writing HIST# items
- **Unit tests**: Vitest; pure function tests (no Docker needed): `npm test` in lambda-api/. API integration tests require DynamoDB Local running: `npm run test:api:lambda-api`
- **`hono/aws-lambda` import**: Built into the main `hono` package (not a separate npm package); use `import { handle } from 'hono/aws-lambda'`
- **`.env` blocked by sandbox**: Use `.env.example` as template; create `.env` manually or rely on command-line env vars for CI
- **`tsx` IPC in sandbox**: `npx tsx` requires a Unix socket for hot-reload IPC which is blocked in sandbox; use `dangerouslyDisableSandbox: true` or `node --import tsx/esm` as alternative
- **`docs/types/lambda-api/api.mermaid` is hand-maintained**: `ts-to-mermaid` cannot resolve `zod` (runtime import, not a type-level dependency) — the `docs:types:lambda-api` script was removed. Update the mermaid file manually when `api.ts` types change.
- **Mermaid erDiagram syntax gotchas**: `PK`/`FK`/`UK` are reserved attribute key constraint tokens — use `PartitionKey`/`SortKey` for DynamoDB keys (lowercase `pk`/`sk` also fail; multi-letter names like `GSI1PK` are fine). Avoid `|` inside quoted annotations (write `0or1`). `nullable().optional()` → `type|null?`; `.optional()` only → `type?`. classDiagram enum values with spaces need quotes (`"given offer"`); hyphenated values work unquoted.
- **`void asyncFn()` in React event handlers**: `void` discards the promise, so rejections become unhandled. In `onClick`/`onConfirm` handlers, use `.catch()` to surface errors (e.g., `asyncFn().catch(err => setError(...))`) or wrap in an async IIFE with try/catch. When the handler has cleanup that must run regardless of outcome (e.g., closing a dialog), use `try/finally` so cleanup always executes. This applies to all lambda-react-ui async actions: API calls, store dispatches, CSV export/import.
- **Zustand load-by-ID stale state**: When a store action loads a resource by ID (e.g., `loadSelectedApplication`), clear the previous value in the same `set()` call that sets `loading: true` — otherwise the stale resource stays visible if the new fetch fails or if navigation happens faster than the previous load.

## AWS CDK Patterns (lambda-api/cdk/)

- Stack: AWS CDK v2 (`aws-cdk-lib`) + `NodejsFunction` (esbuild) + `TableV2` (DynamoDB) + `HttpApi` (API Gateway v2); CDK package lives at `lambda-api/cdk/` with its own isolated `package.json`
- **CDK tsconfig must use `module: CommonJS`**: ts-node (used to run CDK apps) requires CJS — intentionally different from the parent `lambda-api/tsconfig.json` which uses ESM. Use `moduleResolution: "node"` (not `"bundler"`)
- **`esbuild` must be an explicit devDependency** in `lambda-api/cdk/package.json`: `NodejsFunction` requires it at synth time. In a monorepo, don't rely on it being resolved from the parent's `node_modules` — that's fragile if the parent ever removes it
- **`aws-cdk-local` v3 strips `AWS_*` env vars**: v3 (unlike v2) strips all `AWS_*` env vars before invoking `cdk`, then sets its own endpoint. Scripts like `bootstrap:local` should just be `cdklocal bootstrap` — don't set `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` inline, they'll be silently dropped
- **`TableV2` → `AWS::DynamoDB::GlobalTable`**: CDK's `TableV2` synthesizes to `AWS::DynamoDB::GlobalTable`, not `AWS::DynamoDB::Table`. Use the correct type name in CDK assertions tests
- **`tableName` is a CloudFormation token, not a literal**: `this.table.tableName` resolves to `{ Ref: "ApplicationsTableXXXXXXXX" }` at synth time. Assertions that expect a literal string (e.g. `'lambda_api_applications'`) will fail — use `Match.anyValue()` plus a `findResources` check that the Ref contains `'ApplicationsTable'`
- **CDK subpackage needs its own `vitest.config.ts`**: the parent `lambda-api/vitest.config.ts` has `include: ['src/**/*.test.ts']` which misses `cdk/test/`. Add a `vitest.config.ts` in `lambda-api/cdk/` with `include: ['test/**/*.test.ts']`
- **`cdk.out/` must be gitignored**: CDK writes synthesized CloudFormation templates to `cdk.out/` at synth/test time — add it to `.gitignore`
- **`aws-cdk` CLI version vs `aws-cdk-lib` version**: these are on separate version tracks within the 2.x major; a mismatch in minor/patch is normal and not a problem
- **`HttpApi`**: use `aws-cdk-lib/aws-apigatewayv2` and `aws-cdk-lib/aws-apigatewayv2-integrations` — no alpha packages needed

## Terminal Management

- **PostgreSQL prerequisite**: Before starting any API server or running E2E tests, verify the PostgreSQL Docker container is running: `docker compose ps db`. If it's not running, `docker compose up -d db` first. A server started without the DB will hang or crash and may be unkillable without a reboot.
- **UI port conflicts can invalidate E2E runs**: If a stack's UI port is already occupied by an unrelated app (for example, port `3000` serving a different project), Playwright may pass health checks but run tests against the wrong site (symptoms: missing expected selectors, API calls returning HTML `<!DOCTYPE ...>`). Before `bash scripts/run-e2e.sh all`, clear known UI/API ports with `bash scripts/kill-ports.sh <ports...>` to ensure each stack starts its intended server.
- **Repeated test runs**: Run iterative/debugging test commands as foreground tasks in one shared terminal rather than spawning a new background terminal each iteration — background terminals accumulate and are never auto-cleaned.
- **Kill background processes promptly**: Stop background Bash tasks via `TaskStop` (by task ID) or `kill <pid>` as soon as they're no longer needed — task IDs are only available in the current session.
- **DynamoDB Local (port 8000) must be stopped via Docker, not `lsof`**: `kill $(lsof -ti :8000)` terminates the Java process inside the container, which stops the container and can bring down Docker entirely. Use `docker compose stop dynamodb-local` to stop it cleanly, or `docker compose restart dynamodb-local` to restart. If Docker becomes unavailable, restart via `colima restart`. Killing port 5090 (lambda-api Hono server) via `lsof` is fine — it's a plain Node.js process.

## Sandbox Notes

Commands that require `dangerouslyDisableSandbox: true`:
- `npm install` — network access for package downloads
- `docker compose` — `.env` file access
- `drizzle-kit` commands — filesystem access outside project
- `nuxt dev/build/prepare` — filesystem access
- `git commit` with GPG signing — `~/.gnupg/` access
- `gh` CLI — network access
- Playwright tests (WebKit/Chromium) on macOS — `bootstrap_check_in` permissions

Additional notes:
- **Heredoc in sandbox**: `$(cat <<'EOF'...EOF)` in commit messages fails in sandbox — use plain quoted strings or write to `$TMPDIR/commit-msg.txt` and use `git commit -F`
- **`uv sync`**: Requires sandbox override for network; `uv run python -m src` works in sandbox after initial sync
- **`permissions.allow` vs `sandbox.network.allowedHosts`**: `WebFetch(*)` in permissions controls whether the tool can be called without prompting — it does NOT bypass sandbox network restrictions. External hosts also need `sandbox.network.allowedHosts` in `.claude/settings.json`; `github.com` and `registry.npmjs.org` are already added
- **npm cache permission error (EPERM)**: If `npm` fails with `Your cache folder contains root-owned files` (can recur after `sudo npm install -g`), pass `--cache /tmp/npm-cache-$$` to redirect to a writable temp dir (e.g. `npm outdated --cache /tmp/npm-cache-$$`). Permanent fix: `sudo chown -R 501:20 ~/.npm`
- **Subagent `cd` does not persist across Bash calls**: Shell working directory resets between Bash tool calls. Never instruct a subagent to `cd <dir>` in one call and `npm install` in the next — npm will run in the wrong directory (typically the main repo root), silently modifying the wrong `package.json`. Always use `npm install --prefix <absolute-path>` so no `cd` is needed. **`npm run` `--prefix` syntax**: the flag must come before the script name — `npm --prefix /path run <script>`, NOT `npm run <script> --prefix /path` (the latter is silently ignored).
- **Edit and Write tools both blocked on GitHub Actions workflow files**: A security hook blocks both the Edit and Write tools on `.github/workflows/*.yml` and `.github/workflows/*.yaml` files. The only reliable workaround is `cat > "$TMPDIR/workflow.yml" << 'EOF' ... EOF && mv "$TMPDIR/workflow.yml" .github/workflows/...` — do not use `sed` for multi-block YAML rewrites, it silently duplicates content into the wrong sections.
- **`GH_TOKEN` env var overrides keyring for `gh` CLI**: If `GH_TOKEN` is set (e.g., a fine-grained PAT without PR write permissions), it takes precedence over the keyring token, causing `gh api` write calls to fail with 403. Run `unset GH_TOKEN` before any `gh pr create`, `gh pr edit`, or `gh api` calls that require write access.

## Subagent Usage

- **Prefer blocking parallel**: Use normal parallel `Task` calls when no other work to do. Only `run_in_background: true` when continuing other work.
- **Monitor proactively**: Check background agent progress via `TaskOutput`/`Read`. Don't wait for the user to ask.
- **npm outdated without fresh install**: Run `npm outdated` against the main repo (which already has `node_modules`) to discover what needs updating, then apply version changes in a worktree. Avoids the cost of `npm install` in every worktree directory just to get an outdated report.

## Commit and Review Workflow

- **Never push directly to main**: `main` is branch-protected — always create a feature branch, push there, and open a PR. Direct pushes will be rejected.
- **Interactive sessions**: Do not commit unless explicitly asked
- **Worktree/subagent sessions**: Auto-commit before returning (worktree is ephemeral)
- **After every push to a PR branch** *(required, no exceptions)*: Immediately update the PR body via `gh pr edit <number> --body` to reflect all commits now on the branch. Do not wait to be asked. Do not skip because the change "seems minor" — always re-read the current description and update it.
- **Spec status**: When a feature has a spec file in `specs/`, update its `Status` to `Complete` before merging the PR
- **Wait for CI before merging**: Always check `gh pr checks <number>` and wait for all checks to pass before squash merging. Do not use `--admin` to bypass branch protection unless explicitly asked.
- **Post-merge cleanup**: After squash merging a PR, immediately switch to main, pull, and delete the local branch (`git checkout main && git pull && git branch -d <branch>`). Never commit cleanup work (e.g. spec status updates) directly to local main — branch protection will reject the push, and the resulting squash PR will diverge from the local commit, causing a merge commit on the next pull instead of a fast-forward. Then ask the user: "Would you like me to review if there are any learnings from this session that I should persist going forward?"
- **Resolving PR review threads**: `gh` CLI has no resolve command. Use `gh api graphql` — fetch thread IDs via `pullRequest.reviewThreads`, resolve with `resolveReviewThread` mutation. Reply to each thread before resolving.
- **CI toolchain parity**: When adding a new language/toolchain to the monorepo (e.g., Python/uv), update `.github/workflows/verify-pr.yaml` in the same PR to install the required tools
- **`claude-review` action fails on PRs that modify the workflow file**: The action requires the workflow file to match `main` before it can authenticate — PRs that change `.github/workflows/claude-code-review.yml` will always get a "Workflow validation failed" error on the `claude-review` check. This is expected and resolves automatically once the PR is merged
- **Documentation**: When adding a new implementation, update: `README.md` (TOC, implementations table, running instructions, test commands, **schema docs table link**, and **Type Diagrams list**), and as needed `CLAUDE.md`. Every new implementation adds a new DB schema — always update `docs/DATABASE_ARCHITECTURE.md` and `scripts/generate-schema-docs.sh` (add the new `schema_name:dir-name` entry to the SCHEMAS array), then run `npm run docs:schema`. When adding a TypeScript implementation, add a `docs:types:<stack>` script to `package.json` pointing to the main types/service file, add it to the `docs:types` all-script, **run it** (`npm run docs:types:<stack>`), and **add the generated file link to the Type Diagrams list in `README.md`**. Also add a debug configuration to `.vscode/launch.json` for the new API backend (use the appropriate debug type: `node` for TS/Node APIs, `debugpy` for Python, `go` for Go). For Java/Spring, use `type: java, request: attach` on port 5005 and add a `dev:<stack>:debug` npm script that runs `./gradlew bootRun --debug-jvm` — do not use `request: launch` as it requires full Java extension project resolution which is fragile. Do not wait to be asked — include docs in the implementation plan.

## Running API Integration Tests

**Server lifecycle**: For fully managed runs (API auto-start/stop for all 10 stacks), use `bash scripts/run-api-tests.sh [stack|all]` or `npm run test:api:all`. To run against a single already-running API, use `npm run test:api:<stack>` (e.g., `npm run test:api:nest-api`).

**All stacks run sequentially with `--runInBand`** — tests share a DB schema per stack; parallel Jest workers cause state contamination (race conditions in export/import round-trip tests). The script passes `--runInBand` to ensure test files run sequentially within each stack run.

**`run-api-tests.sh all` continues on failure** — unlike `run-e2e.sh`, it accumulates `FAILED_STACKS` and reports them all at the end, so all stacks are tested even when one fails.

**Cross-stack PATCH compatibility**: Go API and Spring API require all non-optional fields in PATCH requests. Always include `companyName` + `positionTitle` for application PATCH, and `name` + `order` for interview stage PATCH.

**Stack-specific flags in `tests/api/helpers.ts`**: `validatesDates` (true only for stacks that return 400 + `code: validation_error` for bad dates), `hasInterviewStageDates` (false for go-api which lacks `completedDate` on stages). Update these when adding a new stack.

## Running E2E Tests

**Server lifecycle**: For fully managed runs (API auto-start/stop), use `bash scripts/run-e2e.sh [stack|all]` — `npm run test:e2e:all` also uses this. To run manually when servers are already up, use `npm run test:e2e:<stack>` directly and leave pre-existing servers running afterward. **`npm run test:e2e:<stack>` only starts the UI dev server** (via playwright `webServer`), not the API backend — if you've killed the backend manually, use `bash scripts/run-e2e.sh <stack>` to restart it before running tests.

Each requires its backend running separately. See [docs/TESTING_REFERENCE.md](docs/TESTING_REFERENCE.md) for prerequisites, selector contracts, doc generation commands, and unit test patterns.

**`run-e2e.sh all` stops at the first failing stack** — if a flaky test causes early exit, run the remaining stacks individually (`bash scripts/run-e2e.sh <stack>`) to get full coverage rather than re-running all from scratch.

**E2E test data cleanup**: Tests that create data must clean up in `afterAll` using API calls (e.g., `page.request.delete('/api/applications/${id}')`) — not fragile UI interactions. Cleanup must run even if individual tests fail.

**Shared E2E tests run against all implementations**: Files in `tests/e2e/` are not stack-specific — every test runs against all 9 stacks. A fix for a failure on one stack can silently break another. Selectors, timing assumptions, and interaction patterns must work across React (SSR and CSR), Vue, Svelte, Angular, and Next.js. When modifying a shared E2E test, reason through how each stack will behave — e.g., React SSR apps require `waitForLoadState('networkidle')` before interacting with controlled inputs (including `beforeAll` setup), while SPA frameworks handle `selectOption()` natively after `domcontentloaded`. After any change to a shared E2E file, run `npm run test:e2e:all` (or `bash scripts/run-e2e.sh`) to confirm nothing regressed across stacks.

**E2E `beforeAll` PATCH must include all required fields**: Go and Spring backends reject partial PATCHes (e.g. `{ status: 'applied' }` alone) because `companyName` and `positionTitle` are required. Always send the full required body in `beforeAll` PATCHes: `{ companyName, positionTitle, status }`. All backends accept `status` and `dateApplied` on POST create — status can be set at create time directly.

**`test.describe.serial` for `beforeAll`-dependent tests**: With `fullyParallel: true`, `test.describe` (non-serial) runs each worker with an independent module load — module-scope variables like `const company = uniqueCompanyName(...)` produce different values per worker, so `beforeAll`-created data is invisible to `beforeEach` in other workers. Use `test.describe.serial` for any describe block whose tests share `beforeAll` setup data.

### Playwright / webkit Quirks

- **webkit + React 19 form submission**: Playwright's `requestSubmit()`, button `.click()`, and `press('Enter')` do not fire React's `onSubmit` in webkit for multi-input forms. Workaround: extract a `doSubmit()` function, add `type="button"` + `data-testid="<form>-save"` + `onClick={doSubmit}` to the submit button, and use `page.locator('[data-testid="<form>-save"]').click()` in tests.
- **Submit button type changes**: When changing a button from `type="submit"` to `type="button"`, unit tests using `querySelector('button[type="submit"]')` will silently return `null`. Prefer `getByTestId()` or `getByRole('button', { name: /save/i })` instead.
- **Angular `[hidden]` vs `@if` for Playwright gates**: `[hidden]="!expr"` keeps the element in the DOM (just invisible); in webkit, `expect(locator).toBeVisible()` can pass immediately while the element's content/state is still stale/default, so later assertions may read the wrong value. Use `@if (expr)` instead of `[hidden]="!expr"` whenever a Playwright assertion waits for an element to appear.
- **Modal re-open timing in webkit**: After clicking Close on a modal/panel and immediately re-opening it, webkit can interact with stale DOM from the previous open cycle. Assert `await expect(page.locator('text=<panel heading>')).not.toBeVisible()` after Close before triggering the second open.
- **`selectOption('')` in webkit**: webkit does not fire a `change` event when `selectOption('')` returns a `<select>` to its blank default option. Framework event handlers that listen to `change` (e.g. Angular's `(ngModelChange)`) will not fire. Fix: follow `selectOption('')` with `await locator.dispatchEvent('change')` to ensure the event fires in all browsers.
- **Playwright count assertions**: Use `/\b1(?!\d)/` not `/\b1\b/` for exact count checks — `\b` fails when the digit is immediately adjacent to a letter (e.g. Angular renders `"1Skipped"` without whitespace between count and label)
- **Playwright `toHaveText` vs `toContainText`**: `toHaveText(regex)` requires a full match including surrounding whitespace from padding; use `toContainText(regex)` when the element has CSS padding that adds whitespace around the text content


