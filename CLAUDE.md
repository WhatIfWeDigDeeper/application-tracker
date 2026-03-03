# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Monorepo with multiple frontend+backend implementation pairs sharing a single PostgreSQL database. Skills in `.claude/skills/`, commands in `.claude/commands/`.

## Key Patterns

- **Worktree Isolation**: Complex operations use isolated worktrees at `../<name>-[timestamp]`
- **Validation Chain**: `build:*` → `lint:*` → `test:*` → `test:e2e:*`
- **Script Naming**: Scripts follow `verb:package-name` (e.g., `build:react-next`, `lint:angular-ui`). Use `:all` suffix for scripts that run across all packages. `test:e2e:*` uses stack names (e.g., `test:e2e:express`, `test:e2e:tanstack`). When adding a new implementation, add per-package scripts for every verb (`dev`, `build`, `lint`, `test`) and add each to its `*:all` script and to `scripts/stop-all.sh`.
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

Connection string: `postgresql://<user>:<password>@localhost:5432/app_tracker?schema=<schema_name>`

See [docs/DATABASE_ARCHITECTURE.md](docs/DATABASE_ARCHITECTURE.md) for per-implementation config details.

## Code Quality Requirements

**Always complete the full validation chain before committing** — `tsc --noEmit` alone is not sufficient. Re-run the entire chain after every round of changes — not just the initial implementation. Fixing a bug introduced during review still requires the full chain.

**When fixing a bug or test failure, automatically run the relevant tests after applying the fix** — do not wait for the user to ask. Use the most targeted test command available (e.g., `test:e2e:react-koa` for a react-koa failure). Report pass/fail results immediately.

1. **Add tests** — Create or update tests for new functionality. Include E2E tests when the change affects user-visible behavior (labels, UI interactions, API contracts). **When fixing a bug, write a failing test first that reproduces the issue, then fix it** — this ensures the bug is understood and won't regress.
2. **Build** - `npm run build:<stack>` (runs per-package build; catches compilation errors)
3. **Lint** - `npm run lint:<stack>` (ESLint/ruff across packages)
4. **Test** - `npm run test:<stack>` (unit/integration tests — catches logic errors `tsc` misses)
5. **E2E** *(when UI/API behavior changed)* - `npm run test:e2e:<stack>` (e.g., `test:e2e:express`)
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
- **Shared E2E history tests**: `history.spec.ts` has a single `History Panel` block shared by Vue and Svelte; stacks without history use `--grep-invert 'History Panel'`
- **Avoid absolute positioning for sibling elements**: When multiple elements share the same corner (e.g., badge + action menu), use flexbox flow instead of `absolute` — prevents overlap
- **Validation limit changes**: When updating max lengths in constants/schemas, grep for hardcoded boundary values in tests (e.g., `repeat(1001)`) — tests may silently pass with stale limits
- **Svelte 5 event delegation**: `stopPropagation()` doesn't prevent parent `<a>` navigation — avoid wrapping interactive cards in `<a>` tags; use `onclick` with `goto()` instead
- **Zod boolean coercion**: `z.coerce.boolean()` treats any non-empty string (including `"false"`) as `true` — use `z.preprocess((val) => val === 'true' || val === true, z.boolean())` for query params
- **Playwright count assertions**: Use `/\b1(?!\d)/` not `/\b1\b/` for exact count checks — `\b` fails when the digit is immediately adjacent to a letter (e.g. Angular renders `"1Skipped"` without whitespace between count and label)

## Vue.js Patterns

- **Router component reuse**: `onMounted` won't re-fire on param change — use `watch(() => props.id)` to reload data
- **Nav guard bypass**: `onBeforeRouteLeave` fires on `router.push()` — use a `skipNavGuard` ref, set `true` before push

## Subagent Usage

- **Prefer blocking parallel**: Use normal parallel `Task` calls when no other work to do. Only `run_in_background: true` when continuing other work.
- **Monitor proactively**: Check background agent progress via `TaskOutput`/`Read`. Don't wait for the user to ask.

## Commit and Review Workflow

- **Never push directly to main**: `main` is branch-protected — always create a feature branch, push there, and open a PR. Direct pushes will be rejected.
- **Interactive sessions**: Do not commit unless explicitly asked
- **Worktree/subagent sessions**: Auto-commit before returning (worktree is ephemeral)
- **After every push to a PR branch** *(required, no exceptions)*: Immediately update the PR body via `gh pr edit <number> --body` to reflect all commits now on the branch. Do not wait to be asked. Do not skip because the change "seems minor" — always re-read the current description and update it.
- **Spec status**: When a feature has a spec file in `specs/`, update its `Status` to `Complete` before merging the PR
- **Before merging**: Mention to the user — "Worth running `/learn` if anything non-obvious came up this session." One sentence, easy to dismiss for small PRs.
- **Wait for CI before merging**: Always check `gh pr checks <number>` and wait for all checks to pass before squash merging. Do not use `--admin` to bypass branch protection unless explicitly asked.
- **Post-merge cleanup**: After squash merging a PR, immediately switch to main, pull, and delete the local branch (`git checkout main && git pull && git branch -d <branch>`). Never commit cleanup work (e.g. spec status updates) directly to local main — branch protection will reject the push, and the resulting squash PR will diverge from the local commit, causing a merge commit on the next pull instead of a fast-forward.
- **Resolving PR review threads**: `gh` CLI has no resolve command. Use `gh api graphql` — fetch thread IDs via `pullRequest.reviewThreads`, resolve with `resolveReviewThread` mutation. Reply to each thread before resolving.
- **CI toolchain parity**: When adding a new language/toolchain to the monorepo (e.g., Python/uv), update `.github/workflows/verify-pr.yaml` in the same PR to install the required tools
- **Documentation**: When adding a new implementation update: `README.md` (TOC, implementations, running instructions, test commands), and as needed `CLAUDE.md`. When DB schema changes are involved, update `docs/DATABASE_ARCHITECTURE.md`, `scripts/generate-schema-docs.sh`, and run `npm run docs:schema`. If Typescript changes run `npm run docs:types` or new ts implementations add script. Do not wait to be asked — include docs in the implementation plan.

## Running E2E Tests

**Server lifecycle**: For fully managed runs (API auto-start/stop), use `bash scripts/run-e2e.sh [stack|all]` — `npm run test:e2e:all` also uses this. To run manually when servers are already up, use `npm run test:e2e:<stack>` directly and leave pre-existing servers running afterward.

Run all: `npm run test:e2e:all`. Run one stack: `npm run test:e2e:<stack>` (e.g., `express`, `vue`).

Each requires its backend running separately. See [docs/TESTING_REFERENCE.md](docs/TESTING_REFERENCE.md) for prerequisites, selector contracts, doc generation commands, and unit test patterns.

**E2E test data cleanup**: Tests that create data must clean up in `afterAll` using API calls (e.g., `page.request.delete('/api/applications/${id}')`) — not fragile UI interactions. Cleanup must run even if individual tests fail.

**Shared E2E tests run against all implementations**: Files in `tests/e2e/` are not stack-specific — every test runs against all 7 stacks. A fix for a failure on one stack can silently break another. Selectors, timing assumptions, and interaction patterns must work across React (SSR and CSR), Vue, Svelte, Angular, and Next.js. When modifying a shared E2E test, reason through how each stack will behave — e.g., React SSR apps require `waitForLoadState('networkidle')` before interacting with controlled inputs, while SPA frameworks handle `selectOption()` natively after `domcontentloaded`. After any change to a shared E2E file, run `npm run test:e2e:all` (or `bash scripts/run-e2e.sh`) to confirm nothing regressed across stacks.
