# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Monorepo with multiple frontend+backend implementation pairs sharing a single PostgreSQL database. Skills in `.claude/skills/`, commands in `.claude/commands/`.

## Key Patterns

- **Worktree Isolation**: Complex operations use isolated worktrees at `../<name>-[timestamp]`
- **Validation Chain**: `build` → `lint` → `test` → `test:e2e`
- **Parallel Execution**: 3+ items use Task tool subagents

## Active Technologies

- TypeScript 5.x (strict mode enabled) + React 19, Next.js 16, Tailwind CSS 4.x, Vite
- PostgreSQL 18 (single database with multiple schemas)

## Documentation Guidelines

- **NEVER create documentation at repository root** - use `/docs/` or `implementations/<name>/docs/`

## Database Architecture

Single PostgreSQL database (`app_tracker`) with schema-per-implementation isolation:
- **express_prisma** — `api/prisma/schema.prisma`
- **react_koa** — `koa-api/src/db/schema.sql`
- **svelte_hono** — `hono-api/src/db/schema.ts` (Drizzle)
- **vue_nuxt** — `nuxt-api/server/db/schema.ts` (Drizzle), shared types via `@shared` alias

Connection string: `postgresql://<user>:<password>@localhost:5432/app_tracker?schema=<schema_name>`

See [docs/DATABASE_ARCHITECTURE.md](docs/DATABASE_ARCHITECTURE.md) for per-implementation config details.

## Code Quality Requirements

**Always complete the validation chain** after making code changes:

1. **Add tests** - Create or update tests for new functionality
2. **Run tests** - Execute `npm test` to verify all tests pass
3. **Run linting** - Execute `npm run lint` to check code style
4. **Run build** - Execute `npm run build` to verify compilation

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

## Vue.js Patterns

- **Router component reuse**: `onMounted` won't re-fire on param change — use `watch(() => props.id)` to reload data
- **Nav guard bypass**: `onBeforeRouteLeave` fires on `router.push()` — use a `skipNavGuard` ref, set `true` before push

## Subagent Usage

- **Prefer blocking parallel**: Use normal parallel `Task` calls when no other work to do. Only `run_in_background: true` when continuing other work.
- **Monitor proactively**: Check background agent progress via `TaskOutput`/`Read`. Don't wait for the user to ask.

## Commit and Review Workflow

- **Interactive sessions**: Do not commit unless explicitly asked
- **Worktree/subagent sessions**: Auto-commit before returning (worktree is ephemeral)
- **PR descriptions**: When follow-up commits substantially change scope, immediately update the PR body via `gh pr edit <number> --body` — do not wait to be asked
- **Documentation**: Update `README.md` and `CLAUDE.md` as part of completing tasks that add scripts/tools/infrastructure

## Running E2E Tests

```bash
npm run test:e2e           # Next.js (port 3000)
npm run test:e2e:react-koa # React-Koa (port 3010)
npm run test:e2e:vue       # Vue-Nuxt (port 3020)
npm run test:e2e:svelte    # Svelte-Hono (port 3030)
```

Each requires its backend running separately. See [docs/TESTING_REFERENCE.md](docs/TESTING_REFERENCE.md) for prerequisites, selector contracts, doc generation commands, and unit test patterns.
