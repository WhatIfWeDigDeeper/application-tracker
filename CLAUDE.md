# CLAUDE.md

## Repository Overview

Monorepo with multiple frontend+backend implementation pairs sharing a single PostgreSQL database. Skills in `.claude/skills/`, commands in `.claude/commands/`.

## Key Patterns

- **Worktree Isolation**: Complex operations use isolated worktrees at `../<name>-[timestamp]`. After a worktree agent completes, always verify the commit landed on a feature branch — not on `main` — by checking `git log --oneline --decorate -3`. If the commit is on `main`, first create a feature branch from it and push it (`git checkout -b <branch> && git push -u origin <branch>`), then reset local main (`git checkout main && git reset --hard origin/main`).
- **Validation Chain**: `build:*` → `lint:*` → `test:*` → `test:e2e:*`
- **Script Naming**: Scripts follow `verb:package-name` (e.g., `build:react-next-ui`, `lint:angular-ui`). Use `:all` suffix for scripts that run across all packages. `test:e2e:*` uses the UI package name (e.g., `test:e2e:react-next-ui`, `test:e2e:tanstack-ui`). When adding a new implementation, add per-package scripts for every verb (`dev`, `build`, `lint`, `test`) and add each to its `*:all` script and to `scripts/stop-all.sh`. When adding a new script group (new verb pattern like `validate:*`), also update `README.md` — add a TOC entry and a usage section so the pattern is discoverable. Do not wait to be asked.
- **Parallel Execution**: 3+ items use Task tool subagents
- **Spec First**: When planning a new feature, the first implementation step should be to write the spec to `specs/<number>-<name>/spec.md`
- **Spell Checker**: When cspell flags a valid term (tool names, libraries, technical jargon), add it to `cspell.config.yaml` under `words`
- **Plan Execution**: Plans must end with a statement of how the work will be run — e.g., single session (sequential), parallel subagents, agent team, or isolated worktree — so the approach is visible before implementation begins.

## Active Technologies

- TypeScript 5.x (strict mode enabled) + React 19, Next.js 16, Tailwind CSS 4.x, Vite
- Python 3.12+ with FastAPI, asyncpg, Pydantic v2, uv
- PostgreSQL 18 (single database with multiple schemas)

## Documentation Guidelines

- **NEVER create documentation at repository root** - use `/docs/` or `implementations/<name>/docs/`

## Database Architecture

Single PostgreSQL database (`app_tracker`) with schema-per-implementation isolation:
- **express_prisma** — `api/prisma/schema.prisma`
- **react_koa** — `koa-api/src/db/schema.sql`
- **svelte_hono** — `hono-api/src/db/schema.ts` (Drizzle)
- **vue_nuxt** — `nuxt-api/server/db/schema.ts` (Drizzle), shared types via `@shared` alias
- **react_nestjs** — `nest-api/src/database/schema.ts` (Drizzle)
- **python_fastapi** — `fastapi/migrations/001_initial.sql` (asyncpg, raw SQL); also used by `tanstack-start-ui/` (React SSR via TanStack Start, port 3040)
- **java_spring** — `spring-api/src/main/resources/db/migration/V1__initial.sql` (Spring Data JPA + Hibernate 6, Flyway auto-migration)

Connection string: `postgresql://<user>:<password>@localhost:5432/app_tracker?schema=<schema_name>`

See [docs/DATABASE_ARCHITECTURE.md](docs/DATABASE_ARCHITECTURE.md) for per-implementation config details.

## Code Quality Requirements

**Always complete the full validation chain before committing** — `tsc --noEmit` alone is not sufficient. Re-run the entire chain after every round of changes — not just the initial implementation. Fixing a bug introduced during review still requires the full chain.

**When fixing a bug or test failure, automatically run the relevant tests after applying the fix** — do not wait for the user to ask. Use the most targeted test command available (e.g., `test:e2e:react-ui` for a react-ui failure). Report pass/fail results immediately.

1. **Add tests** — Create or update tests for new functionality. Include E2E tests when the change affects user-visible behavior (labels, UI interactions, API contracts). **When fixing a bug, write a failing test first that reproduces the issue, then fix it** — this ensures the bug is understood and won't regress.
2. **Build** - `npm run build:<stack>` (runs per-package build; catches compilation errors)
3. **Lint** - `npm run lint:<stack>` (ESLint/ruff across packages)
4. **Test** - `npm run test:<stack>` (unit/integration tests — catches logic errors `tsc` misses)
5. **E2E** *(when UI/API behavior changed)* - `npm run test:e2e:<stack>` (e.g., `test:e2e:react-next-ui`)
6. **Docs** *(when user-visible behavior changes)* — Update `specs/core/domain/` files and `README.md` as needed when labels, statuses, UI text, or API contracts change. Also run generated docs when applicable: `npm run docs:types:<stack>` when public TypeScript types change, `npm run docs:schema` when DB schema changes. Feature specs (`specs/<number>-*/spec.md`) are historical — do not retroactively rewrite them; document changes in the current feature's own spec instead.

**Skip when:** trivial changes (all steps), test-only changes (step 1), docs-only changes (all steps).

**When adding or changing packages** — run two additional steps before the validation chain:
- `npm run install:<stack>` — keeps the lockfile in sync
- `npm run audit:ci:<stack>` — fails on known vulnerabilities (e.g. `audit:ci:angular-ui`, `audit:ci:fastapi`)
Then proceed with the full build → lint → test → e2e chain as normal.

**When changing public TypeScript types** — regenerate the type diagrams for the affected stack:
- `npm run docs:types:<stack>` (e.g. `docs:types:angular-ui`, `docs:types:nuxt`)

## Dependency Management

When installing **new npm packages**: use latest stable version, exact versions (no ^ or ~), install `@types/*` if needed. Note: `npm install pkg@x.y.z` silently adds a `^` caret — verify package.json afterward and remove it to restore exact pinning.

When installing **new Python packages**: `cd fastapi && uv add <package>` (or `uv add --dev <package>` for dev deps). Use exact versions in `pyproject.toml`.

When **updating**: use the `update-deps` skill (npm only), then run the full validation chain. For Python deps, use `uv lock --upgrade-package <package>`.

## API Design Patterns

Prefer individual CRUD operations (`addStage`, `updateStage`, `removeStage`) over batch replace. Pass individual callbacks (`onAdd`, `onUpdate`, `onRemove`) instead of a single `onChange` with full state.

## Cross-Framework Patterns

- **Prisma dates**: Returns ISO datetime (`2026-02-09T00:00:00.000Z`), HTML inputs need `YYYY-MM-DD` — use `.split('T')[0]`
- **API 204 handling**: `response.json()` on 204 throws — check `response.status === 204` first
- **Zod optional vs null**: `z.string().optional()` rejects `null` — use `undefined` so `JSON.stringify` omits the key
- **React Router useBlocker**: Only works with `createBrowserRouter` + `RouterProvider`, not `<BrowserRouter>`
- **SvelteKit SSR**: Add `export const ssr = false` in `src/routes/+layout.ts` for SPA mode with Playwright
- **Svelte 5 bind:value**: Doesn't propagate with callback `onchange` — use local `$state` + `$effect`, call callback in `oninput`
- **Shared E2E history tests**: `history.spec.ts` has a single `History Panel` block shared by Vue and Svelte; stacks without history use `--grep-invert 'History Panel'` (Playwright CLI flag)
- **Avoid absolute positioning for sibling elements**: When multiple elements share the same corner (e.g., badge + action menu), use flexbox flow instead of `absolute` — prevents overlap
- **Validation limit changes**: When updating max lengths in constants/schemas, rg (ripgrep) for hardcoded boundary values in tests (e.g., `repeat(1001)`) — tests may silently pass with stale limits
- **Svelte 5 event delegation**: `stopPropagation()` doesn't prevent parent `<a>` navigation — avoid wrapping interactive cards in `<a>` tags; use `onclick` with `goto()` instead
- **Zod boolean coercion**: `z.coerce.boolean()` treats any non-empty string (including `"false"`) as `true` — use `z.preprocess((val) => val === 'true' || val === true, z.boolean())` for query params
- **Playwright count assertions**: Use `/\b1(?!\d)/` not `/\b1\b/` for exact count checks — `\b` fails when the digit is immediately adjacent to a letter (e.g. Angular renders `"1Skipped"` without whitespace between count and label)
- **Playwright `toHaveText` vs `toContainText`**: `toHaveText(regex)` requires a full match including surrounding whitespace from padding; use `toContainText(regex)` when the element has CSS padding that adds whitespace around the text content
- **Null vs undefined in validation**: API fields that are "not set" often return `null`, not `undefined`. Strict `!== undefined` checks let `null` slip into range/format validators where JS coercion causes false failures (e.g. `null < 1` → `true`) — use `!= null` (loose equality) to treat both as absent.
- **webkit + React 19 form submission**: Playwright's `requestSubmit()`, button `.click()`, and `press('Enter')` do not fire React's `onSubmit` in webkit for multi-input forms. Workaround: extract a `doSubmit()` function, add `type="button"` + `data-testid="<form>-save"` + `onClick={doSubmit}` to the submit button, and use `page.locator('[data-testid="<form>-save"]').click()` in tests.
- **Submit button type changes**: When changing a button from `type="submit"` to `type="button"`, unit tests using `querySelector('button[type="submit"]')` will silently return `null`. Prefer `getByTestId()` or `getByRole('button', { name: /save/i })` instead.
- **Angular `[hidden]` vs `@if` for Playwright gates**: `[hidden]="!expr"` keeps the element in the DOM (just invisible); in webkit, `expect(locator).toBeVisible()` can pass immediately while the element's content/state is still stale/default, so later assertions may read the wrong value. Use `@if (expr)` instead of `[hidden]="!expr"` whenever a Playwright assertion waits for an element to appear.
- **Modal re-open timing in webkit**: After clicking Close on a modal/panel and immediately re-opening it, webkit can interact with stale DOM from the previous open cycle. Assert `await expect(page.locator('text=<panel heading>')).not.toBeVisible()` after Close before triggering the second open.

## Angular Patterns

- **Confirm dialog `role="dialog"`**: Locators using `[role="dialog"] button:has-text(...)` require the inner dialog container div to have `role="dialog"` — Angular components don't add it automatically. Always include `role="dialog"` on the modal content div in `ConfirmDialogComponent`.

## Vue.js Patterns

- **Router component reuse**: `onMounted` won't re-fire on param change — use `watch(() => props.id)` to reload data
- **Nav guard bypass**: `onBeforeRouteLeave` fires on `router.push()` — use a `skipNavGuard` ref, set `true` before push

## Java/Spring Patterns

- **Spring Boot port**: 8080 (`spring-api/`), Angular Spring UI port: 3070 (`angular-spring-ui/`)
- **JPA enum with PostgreSQL custom types**: PostgreSQL enum values with spaces/hyphens (e.g. "given offer", "enterprise-software") require `AttributeConverter<MyEnum, String>` — `@Enumerated(EnumType.STRING)` alone won't work correctly
- **`@Converter` without `autoApply`**: `@Converter` without `autoApply = true` is silently inert if no entity field references it directly — verify usage before writing a new Converter when entities already use `@Type(XxxUserType.class)`
- **UserType.fromDbValue delegation**: `fromDbValue()` in each `PostgreSQLEnumType` subclass should delegate to the enum's own `fromValue()` — don't re-implement the same lookup loop
- **TypeReference for diff maps**: In diff/compare methods that deserialize JSON to a map, use `objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {})` instead of raw `Map.class` — avoids `key.toString()` casts and compiler warnings
- **Immutable constants**: Use `Set.of()` for excluded-field constant sets in diff logic; use `List.of()` (not `Arrays.asList()`) when the list is truly immutable by intent
- **GlobalExceptionHandler catch-all**: Always include `@ExceptionHandler(RuntimeException.class)` in `@RestControllerAdvice` — without it, `RuntimeException` wrappers around `JsonProcessingException` surface as empty 500 responses to clients
- **JSONB snapshots**: Use `@JdbcTypeCode(SqlTypes.JSON)` from `org.hibernate.annotations` with Hibernate 6 for JSONB columns
- **Spring Data JPA filtering**: `Specification<T>` + `JpaSpecificationExecutor<T>` for multi-criteria filters; compose with `Specification.where().and()`
- **`isXxx` field naming**: JPA boolean fields named `isXxx` conflict with getter naming; name the field `archived` (not `isArchived`) — getter `isArchived()`, setter `setArchived()`
- **Flyway auto-migration**: Flyway runs on startup — `./gradlew flywayMigrate` is only needed for manual runs; migrations live in `classpath:db/migration/`
- **Gradle Kotlin DSL**: Uses `build.gradle.kts` — Kotlin syntax for plugin/dependency blocks
- **Commit message file**: Multi-line `git commit -m` strings cause a `dquote>` hang in zsh. Write the message with `create_file` to `/tmp/commit-msg.txt`, then run `git commit -F /tmp/commit-msg.txt`
- **Batch import + class-level `@Transactional`**: `@Transactional` at class level makes a failed `saveAndFlush` mark the transaction rollback-only — catch blocks can't recover. Fix: `@Transactional(propagation = NOT_SUPPORTED)` + `TransactionTemplate` per row.
- **LinkedIn URLs exceed VARCHAR(500)**: URL columns for job posting/company URLs should use `TEXT` — LinkedIn tracking URLs commonly exceed 500 chars
- **Jackson date serialization**: `LocalDate`/`LocalDateTime` serialize as arrays (e.g. `[2026,3,5]`) by default — add `.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)` to `ObjectMapper` config to get ISO strings (`"2026-03-05"`, `"2026-03-05T13:00:00Z"`)

## Terminal Management

- **Repeated test runs**: Run iterative/debugging test commands as foreground tasks in one shared terminal rather than spawning a new background terminal each iteration — background terminals accumulate and are never auto-cleaned.
- **Kill background terminals promptly**: Call `kill_terminal` immediately after a background process is no longer needed; IDs are only available in the current session and cannot be recovered later.

## Subagent Usage

- **Prefer blocking parallel**: Use normal parallel `Task` calls when no other work to do. Only `run_in_background: true` when continuing other work.
- **Monitor proactively**: Check background agent progress via `TaskOutput`/`Read`. Don't wait for the user to ask.

## Commit and Review Workflow

- **Never push directly to main**: `main` is branch-protected — always create a feature branch, push there, and open a PR. Direct pushes will be rejected.
- **Interactive sessions**: Do not commit unless explicitly asked
- **Worktree/subagent sessions**: Auto-commit before returning (worktree is ephemeral)
- **After every push to a PR branch** *(required, no exceptions)*: Immediately update the PR body via `gh pr edit <number> --body` to reflect all commits now on the branch. Do not wait to be asked. Do not skip because the change "seems minor" — always re-read the current description and update it.
- **Spec status**: When a feature has a spec file in `specs/`, update its `Status` to `Complete` before merging the PR
- **Before merging**: Ask the user — "Worth running `/learn` if anything non-obvious came up this session." Wait for their response before proceeding with the merge.
- **Wait for CI before merging**: Always check `gh pr checks <number>` and wait for all checks to pass before squash merging. Do not use `--admin` to bypass branch protection unless explicitly asked.
- **Post-merge cleanup**: After squash merging a PR, immediately switch to main, pull, and delete the local branch (`git checkout main && git pull && git branch -d <branch>`). Never commit cleanup work (e.g. spec status updates) directly to local main — branch protection will reject the push, and the resulting squash PR will diverge from the local commit, causing a merge commit on the next pull instead of a fast-forward.
- **Resolving PR review threads**: `gh` CLI has no resolve command. Use `gh api graphql` — fetch thread IDs via `pullRequest.reviewThreads`, resolve with `resolveReviewThread` mutation. Reply to each thread before resolving.
- **CI toolchain parity**: When adding a new language/toolchain to the monorepo (e.g., Python/uv), update `.github/workflows/verify-pr.yaml` in the same PR to install the required tools
- **Documentation**: When adding a new implementation, update: `README.md` (TOC, implementations, running instructions, test commands), and as needed `CLAUDE.md`. When DB schema changes are involved, update `docs/DATABASE_ARCHITECTURE.md`, `scripts/generate-schema-docs.sh`, and run `npm run docs:schema`. When adding a TypeScript implementation, add a `docs:types:<stack>` script. Also add a debug configuration to `.vscode/launch.json` for the new API backend (use the appropriate debug type: `node` for TS/Node APIs, `debugpy` for Python, `go` for Go). For Java/Spring, use `type: java, request: attach` on port 5005 and add a `dev:<stack>:debug` npm script that runs `./gradlew bootRun --debug-jvm` — do not use `request: launch` as it requires full Java extension project resolution which is fragile. Do not wait to be asked — include docs in the implementation plan.

## Running E2E Tests

**Server lifecycle**: For fully managed runs (API auto-start/stop), use `bash scripts/run-e2e.sh [stack|all]` — `npm run test:e2e:all` also uses this. To run manually when servers are already up, use `npm run test:e2e:<stack>` directly and leave pre-existing servers running afterward. **`npm run test:e2e:<stack>` only starts the UI dev server** (via playwright `webServer`), not the API backend — if you've killed the backend manually, use `bash scripts/run-e2e.sh <stack>` to restart it before running tests.

Run all: `npm run test:e2e:all`. Run one stack: `npm run test:e2e:<stack>` (e.g., `react-next-ui`, `vue-ui`).

Each requires its backend running separately. See [docs/TESTING_REFERENCE.md](docs/TESTING_REFERENCE.md) for prerequisites, selector contracts, doc generation commands, and unit test patterns.

**E2E test data cleanup**: Tests that create data must clean up in `afterAll` using API calls (e.g., `page.request.delete('/api/applications/${id}')`) — not fragile UI interactions. Cleanup must run even if individual tests fail.

**Shared E2E tests run against all implementations**: Files in `tests/e2e/` are not stack-specific — every test runs against all 8 stacks. A fix for a failure on one stack can silently break another. Selectors, timing assumptions, and interaction patterns must work across React (SSR and CSR), Vue, Svelte, Angular, and Next.js. When modifying a shared E2E test, reason through how each stack will behave — e.g., React SSR apps require `waitForLoadState('networkidle')` before interacting with controlled inputs, while SPA frameworks handle `selectOption()` natively after `domcontentloaded`. After any change to a shared E2E file, run `npm run test:e2e:all` (or `bash scripts/run-e2e.sh`) to confirm nothing regressed across stacks.

**E2E `beforeAll` PATCH must include all required fields**: Go and Spring backends reject partial PATCHes (e.g. `{ status: 'applied' }` alone) because `companyName` and `positionTitle` are required. Always send the full required body in `beforeAll` PATCHes: `{ companyName, positionTitle, status }`. Note: some backends also strip unknown POST fields, so status cannot always be set at create time — a two-step POST + full PATCH is the safe pattern for all stacks.

**`test.describe.serial` for `beforeAll`-dependent tests**: With `fullyParallel: true`, `test.describe` (non-serial) runs each worker with an independent module load — module-scope variables like `const company = uniqueCompanyName(...)` produce different values per worker, so `beforeAll`-created data is invisible to `beforeEach` in other workers. Use `test.describe.serial` for any describe block whose tests share `beforeAll` setup data.

## Searching files

-  **Use 'rg' (ripgrep)** instead of 'grep' or 'find' for better performance and features
