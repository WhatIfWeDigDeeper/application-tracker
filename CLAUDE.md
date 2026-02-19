# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Monorepo with multiple frontend+backend implementation pairs sharing a single PostgreSQL database. Skills in `.claude/skills/`, commands in `.claude/commands/`.

## Key Patterns

- **Worktree Isolation**: Complex operations use isolated worktrees at `../<name>-[timestamp]`
- **Validation Chain**: `build` → `lint` → `test` → `test:e2e`
- **Parallel Execution**: 3+ items use Task tool subagents
- **Spec First**: When planning a new feature, the first implementation step should be to write the spec to `specs/<number>-<name>/spec.md`

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
- **python_fastapi** — `fastapi/migrations/001_initial.sql` (asyncpg, raw SQL)

Connection string: `postgresql://<user>:<password>@localhost:5432/app_tracker?schema=<schema_name>`

See [docs/DATABASE_ARCHITECTURE.md](docs/DATABASE_ARCHITECTURE.md) for per-implementation config details.

## Code Quality Requirements

**Always complete the full validation chain before committing** — `tsc --noEmit` alone is not sufficient. Re-run the entire chain after every round of changes — not just the initial implementation. Fixing a bug introduced during review still requires the full chain.

1. **Add tests** - Create or update tests for new functionality
2. **Build** - `npm run build` (runs per-package build; catches compilation errors)
3. **Lint** - `npm run lint` (ESLint across all packages)
4. **Test** - `npm test` (unit/integration tests — catches logic errors `tsc` misses)
5. **E2E** *(when UI/API behavior changed)* - `npm run test:e2e` (or stack-specific variant)

**Skip when:** trivial changes (all steps), test-only changes (step 1), docs-only changes (all steps).

## Dependency Management

When installing **new packages**: use latest stable version, exact versions (no ^ or ~), install `@types/*` if needed.

When **updating**: use the `update-deps` skill, then run the full validation chain.

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

## Vue.js Patterns

- **Router component reuse**: `onMounted` won't re-fire on param change — use `watch(() => props.id)` to reload data
- **Nav guard bypass**: `onBeforeRouteLeave` fires on `router.push()` — use a `skipNavGuard` ref, set `true` before push

## Subagent Usage

- **Prefer blocking parallel**: Use normal parallel `Task` calls when no other work to do. Only `run_in_background: true` when continuing other work.
- **Monitor proactively**: Check background agent progress via `TaskOutput`/`Read`. Don't wait for the user to ask.

## Commit and Review Workflow

- **Interactive sessions**: Do not commit unless explicitly asked
- **Worktree/subagent sessions**: Auto-commit before returning (worktree is ephemeral)
- **After every push to a PR branch**: Check whether the new commit(s) change the PR's scope. If so, immediately update the PR body via `gh pr edit <number> --body` — do not wait to be asked
- **Spec status**: When a feature has a spec file in `specs/`, update its `Status` to `Complete` before merging the PR
- **Wait for CI before merging**: Always check `gh pr checks <number>` and wait for all checks to pass before squash merging. Do not use `--admin` to bypass branch protection unless explicitly asked.
- **Post-merge cleanup**: After squash merging a PR, immediately switch to main, pull, and delete the local branch (`git checkout main && git pull && git branch -d <branch>`)
- **Documentation**: When adding a new implementation update: `README.md` (TOC, implementations, running instructions, test commands), and as needed `CLAUDE.md`. When DB schema changes are involved, update `docs/DATABASE_ARCHITECTURE.md`, `scripts/generate-schema-docs.sh`, and run `npm run docs:schema`. If Typescript changes run `npm run docs:types` or new ts implementations add script. Do not wait to be asked — include docs in the implementation plan.

## Running E2E Tests

```bash
npm run test:e2e           # Next.js (port 3000)
npm run test:e2e:react-koa # React-Koa (port 3010)
npm run test:e2e:vue       # Vue-Nuxt (port 3020)
npm run test:e2e:svelte    # Svelte-Hono (port 3030)
npm run test:e2e:tanstack  # React+TanStack-NestJS (port 3050)
```

Each requires its backend running separately. See [docs/TESTING_REFERENCE.md](docs/TESTING_REFERENCE.md) for prerequisites, selector contracts, doc generation commands, and unit test patterns.

**E2E test data cleanup**: Tests that create data must clean up in `afterAll` using API calls (e.g., `page.request.delete('/api/applications/${id}')`) — not fragile UI interactions. Cleanup must run even if individual tests fail.
