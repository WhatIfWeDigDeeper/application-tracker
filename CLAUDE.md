# CLAUDE.md

## Repository Overview

Monorepo with multiple frontend+backend implementation pairs sharing a single PostgreSQL database. Skills in `.claude/skills/` (project-local and upstream-synced) and `.agents/skills/` (upstream-installed originals — see Agent Skills Policy), commands in `.claude/commands/`.

## Key Patterns

- **Worktree Isolation**: Complex operations use isolated worktrees at `../<name>-[timestamp]`. Always specify `origin/main` as the base when creating: `git worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME" origin/main` — omitting the start-point defaults to the current HEAD, which causes the PR to include unintended commits. After a worktree agent completes, always verify the commit landed on a feature branch — not on `main` — by checking `git log --oneline --decorate -3`. If the commit is on `main`, first create a feature branch from it and push it (`git checkout -b <branch> && git push -u origin <branch>`), then reset local main (`git checkout main && git reset --hard origin/main`).
- **Validation Chain**: `build:*` → `lint:*` → `test:*` → `test:e2e:*`
- **Script Naming**: Scripts follow `verb:package-name` (e.g., `build:react-next-ui`, `lint:angular-ui`). Use `:all` suffix for scripts that run across all packages. `test:e2e:*` uses the UI package name (e.g., `test:e2e:react-next-ui`, `test:e2e:tanstack-ui`). When adding a new implementation, add per-package scripts for every verb (`dev`, `build`, `lint`, `test`, `ci`, `audit:ci`, `validate`) and add each to its `*:all` script and to `scripts/stop-all.sh`. After adding, cross-check that sibling stacks also have `validate:*` and `ci:*` shorthands — these silently fall behind when new stacks are added. Use the same stack name across all verbs (e.g. `migrate:express-api` aliasing `migrate:express`) so generic `npm run "verb:$STACK"` invocations from `validate.sh` work for every stack. When adding a new script group (new verb pattern like `validate:*`), also update `README.md` — add a TOC entry and a usage section so the pattern is discoverable. Do not wait to be asked.
- **Parallel Execution**: 3+ items use Task tool subagents
- **Spec First**: When planning a new feature, the first implementation step should be to write the spec to `specs/<number>-<name>/spec.md`
- **Spell Checker**: When cspell flags a valid term (tool names, libraries, technical jargon), add it to `cspell.config.yaml` under `words`
- **Plan Execution**: Plans must end with a statement of how the work will be run — e.g., single session (sequential), parallel subagents, agent team, or isolated worktree — so the approach is visible before implementation begins.
- **Code Review**: Before raising PR feedback, read existing review threads and replies on the touched code. Do not restate issues that were already answered, intentionally accepted, or deferred to a linked follow-up issue unless later commits materially changed the code or invalidated the earlier resolution.
- **Persisting Learnings**: When you discover a new gotcha, stack-specific pattern, or tool quirk during a session, add it directly to the relevant `CLAUDE.md` before ending the session — so teammates and future agents benefit. Cross-cutting patterns go in the root `CLAUDE.md`; stack-specific patterns go in `<stack>/CLAUDE.md` (see Per-Stack Guidance below). For repeatable multi-step processes, create a skill in `.claude/skills/`. **NEVER write to `~/.claude/projects/.../memory/` for this project** — those files are invisible to other contributors, may be reset, and are not the persistence mechanism for this repo. `CLAUDE.md` files are the only approved place for project learnings. If any files exist in the memory directory, delete them. **After applying learnings, stop — do not commit, branch, or open a PR.** The user will review the changes and run `/ship-it` manually when ready.
- **Rule writing**: Every clause must be load-bearing (rule / non-obvious why / concrete example). Cut restatements, redundant adverbs, and self-evident "why" tails.
- **Copilot sync**: When updating cross-cutting repo rules, mirror relevant changes to `.github/copilot-instructions.md`.
- **Searching files**: Use `rg` (ripgrep) instead of `grep` or `find` for better performance and features.
- **Agent Skills Policy**: When responding to PR review feedback, do not directly apply reviewer suggestions to files in `.agents/skills/` — post a reply noting the suggestion will be addressed upstream instead. Skills sourced from `WhatIfWeDigDeeper/agent-skills` (including `pr-comments`, `ship-it`, `learn`, `playwright-cli`, etc.) are maintained upstream; deliberate version upgrades or syncs via dedicated PRs are fine. Sync: `npx skills add -y whatifwedigdeeper/agent-skills` — repo-wide, diff before committing. Only project-owned files (`scripts/`, `.vscode/`, `docs/`, `fastapi/`, application source) are in-scope for directly applying reviewer feedback.
- **Skills directory layout**: `.agent/skills/` (singular) holds symlinks into `.agents/skills/` (plural, actual files); both gitignored. `.claude/skills/` mixes tracked project-local skills and gitignored symlinks to upstream skills. Reinstall from `skills-lock.json` with `npx skills add`.
- **gitignore trailing slash doesn't match symlinks**: Patterns like `foo/` only match real directories — omit trailing slash for symlink entries.

## Per-Stack Guidance

Stack-specific patterns live in `<stack>/CLAUDE.md` and load on-demand when working in that directory:
`angular-ui`, `vue-ui`, `svelte-ui`, `spring-api`, `tanstack-ui`, `fastapi`, `go-api`, `lambda-api` (incl. CDK), `nest-history-api`, `rails-api`.
Paired dirs (`angular-spring-ui`, `nuxt-api`, `hono-api`, `nest-api`) have pointer files to their primary stack.
When adding a new implementation, create `<new-stack>/CLAUDE.md` for any stack-specific gotchas that emerge.

## Active Technologies
- TypeScript 5.x (strict mode) + React 19, Vite 7.x, Next.js 16, Tailwind CSS 4.x
- Zustand 5, React Router 7, TanStack Query v5, TanStack Router, Apollo Client
- Vitest, @testing-library/react, Playwright
- Python 3.12+ (fastapi package uses 3.14) with FastAPI, asyncpg, Pydantic v2, uv
- Ruby 3.3+ with Rails API mode, ActiveRecord, RSpec, Bundler
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
- **ruby_rails** — `rails-api/db/migrate/001_initial_schema.rb` (Rails migrations, ActiveRecord); API-only on port 5180

Connection string: `postgresql://<user>:<password>@localhost:5432/app_tracker?schema=<schema_name>`

See [docs/DATABASE_ARCHITECTURE.md](docs/DATABASE_ARCHITECTURE.md) for per-implementation config details.

## Code Quality Requirements

**Always complete the full validation chain before committing** — `tsc --noEmit` alone is not sufficient. Re-run the entire chain after every round of changes — not just the initial implementation. Fixing a bug introduced during review still requires the full chain.

**When adding or modifying tests, automatically run them after implementation** — do not wait for the user to ask. Use the most targeted test command available. Report pass/fail results immediately.

**When fixing a bug or test failure, automatically run the relevant tests after applying the fix** — do not wait for the user to ask. Use the most targeted test command available (e.g., `test:e2e:react-ui` for a react-ui failure). Report pass/fail results immediately.

**Test design — prefer pure functions and integration, not mocks** — When code has non-trivial logic, extract it into exported pure functions and unit-test those directly. Reserve mocks for *simulating failures* (e.g., a dependency throwing) — do not use them to stand in for real components when the goal is verifying logic, because asserting on mock call arguments couples tests to internal implementation. If a behavior can't be exercised without mocks (e.g. DB interaction, HTTP I/O), test it through the real API surface / integration tests instead.

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

**Fix vulnerabilities across all packages in one pass** — When a CI audit failure names a specific package (e.g. `drizzle-orm`), search for it across all `package.json` files before committing the fix: `rg --glob '!node_modules/**' --glob '**/package.json' '"drizzle-orm"'`. Multiple packages often share the same vulnerable dependency; fixing only the one CI reported causes a second CI failure on the next package in the chain. After applying all fixes, run `npm run audit:ci:all` (or the per-package loop) to confirm every package passes before committing.

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
- **Null-safe array access from external sources**: Use `(arr ?? []).map/filter/reduce(...)` whenever the array comes from an API response, proto decode, or DB query — external sources can omit array fields entirely, leaving them `undefined`.
- **Migrations**: Prefer `IF NOT EXISTS` on `CREATE SCHEMA / TABLE / INDEX` — `app_tracker` is shared; prior state may pre-exist.

## CSV Import Patterns

- **Stacks with CSV support**: nest-api, fastapi, go-api, spring-api, yoga-api — all 5 must be updated when changing the CSV format or column list.
- **Multi-line fields**: Never pre-split CSV content by newlines before parsing — quoted fields can contain embedded newlines. Process the entire file character-by-character, tracking `inQuotes` state, and only treat `\n` as a row separator when `inQuotes` is false.
- **Prisma enum `@map` values**: CSVs store `@map` display values (e.g. `"company-website"`, `"media-entertainment"`) but Prisma `create()`/`update()` requires the enum identifier name (`company_website`, `media_entertainment`). Add a lookup table (like `STATUS_DISPLAY_TO_PRISMA`) for each enum with hyphenated/spaced `@map` values and apply it during import.

## Terminal Management

- **PostgreSQL prerequisite**: Before starting any API server or running E2E tests, verify the PostgreSQL Docker container is running: `docker compose ps db`. If it's not running, `docker compose up -d db` first. A server started without the DB will hang or crash and may be unkillable without a reboot.
- **UI port conflicts can invalidate E2E runs**: If a stack's UI port is already occupied by an unrelated app (for example, port `3000` serving a different project), Playwright may pass health checks but run tests against the wrong site (symptoms: missing expected selectors, API calls returning HTML `<!DOCTYPE ...>`). Before `bash scripts/run-e2e.sh all`, clear known UI/API ports with `bash scripts/kill-ports.sh <ports...>` to ensure each stack starts its intended server.
- **Repeated test runs**: Run iterative/debugging test commands as foreground tasks in one shared terminal rather than spawning a new background terminal each iteration — background terminals accumulate and are never auto-cleaned.
- **Kill background processes promptly**: Stop background Bash tasks via `TaskStop` (by task ID) or `kill <pid>` as soon as they're no longer needed — task IDs are only available in the current session.
- **DynamoDB Local (port 8000) must be stopped via Docker, not `lsof`**: `kill $(lsof -ti :8000)` terminates the Java process inside the container, which stops the container and can bring down Docker entirely. Use `docker compose stop dynamodb-local` to stop it cleanly, or `docker compose restart dynamodb-local` to restart. If Docker becomes unavailable, restart via `colima restart`. Killing port 5090 (lambda-api Hono server) via `lsof` is fine — it's a plain Node.js process.

## Sandbox Notes

Commands that require `dangerouslyDisableSandbox: true`:
- `npm install` — network access for package downloads
- `bundle install` — network access for RubyGems downloads
- `docker compose` — `.env` file access
- `drizzle-kit` commands — filesystem access outside project
- `nuxt dev/build/prepare` — filesystem access
- `git commit` with GPG signing — `~/.gnupg/` access
- Playwright tests (WebKit/Chromium) on macOS — `bootstrap_check_in` permissions
- `./gradlew` commands — sandbox has no Java Runtime; prepend `export JAVA_HOME=$(/usr/libexec/java_home)`

Additional notes:
- **Heredoc in sandbox**: `$(cat <<'EOF'...EOF)` in commit messages fails in sandbox — use plain quoted strings or write to `$TMPDIR/commit-msg.txt` and use `git commit -F`
- **`uv sync`**: Requires sandbox override for network; `uv run python -m src` works in sandbox after initial sync
- **`permissions.allow` vs `sandbox.network.allowedHosts`**: `WebFetch(*)` in permissions controls whether the tool can be called without prompting — it does NOT bypass sandbox network restrictions. External hosts also need `sandbox.network.allowedHosts` in `.claude/settings.json`; `github.com` and `registry.npmjs.org` are already added
- **`permissions.allow` bare names**: Always use explicit `"Read(*)"` form — bare `"Read"` no longer implies `"Read(*)"` in current Claude Code versions and will prompt for every call.
- **npm cache permission error (EPERM)**: If `npm` fails with `Your cache folder contains root-owned files` (can recur after `sudo npm install -g`), pass `--cache /tmp/npm-cache-$$` to redirect to a writable temp dir (e.g. `npm outdated --cache /tmp/npm-cache-$$`). Permanent fix: `sudo chown -R 501:20 ~/.npm`
- **Subagent `cd` does not persist across Bash calls**: Shell working directory resets between Bash tool calls. Never instruct a subagent to `cd <dir>` in one call and `npm install` in the next — npm will run in the wrong directory (typically the main repo root), silently modifying the wrong `package.json`. Always use `npm install --prefix <absolute-path>` so no `cd` is needed. **`npm run` `--prefix` syntax**: the flag must come before the script name — `npm --prefix /path run <script>`, NOT `npm run <script> --prefix /path` (the latter is silently ignored).
- **Edit and Write tools both blocked on GitHub Actions workflow files**: A security hook blocks both the Edit and Write tools on `.github/workflows/*.yml` and `.github/workflows/*.yaml` files. The only reliable workaround is `cat > "$TMPDIR/workflow.yml" << 'EOF' ... EOF && mv "$TMPDIR/workflow.yml" .github/workflows/...` — do not use `sed` for multi-block YAML rewrites, it silently duplicates content into the wrong sections.
- **`.claude/settings.json` edits need explicit per-edit auth**: Harness blocks Edit/Write to it even from an active skill. Auth must name the file AND the specific change (e.g., `Yes, edit .claude/settings.json to change X to Y`); `y`/`auto` is rejected. Surface the diff first; don't retry blindly.
- **`GH_TOKEN` env var overrides keyring for `gh` CLI**: If `GH_TOKEN` is set (e.g., a fine-grained PAT without PR write permissions), it takes precedence over the keyring token, causing `gh api` write calls to fail with 403. Run `unset GH_TOKEN` before any `gh pr create`, `gh pr edit`, or `gh api` calls that require write access.
- **GitHub CLI pager fallback in VS Code**: If `gh` opens the alternate buffer or exits 130 despite `GH_PAGER=cat PAGER=cat`, redirect output to a temp file and inspect it in the editor or with CLI tools like `cat`, `sed`, or `rg` (for example, `TMP=$(mktemp ...); gh pr view ... > "$TMP"`).

## Subagent Usage

- **Prefer blocking parallel**: Use normal parallel `Task` calls when no other work to do. Only `run_in_background: true` when continuing other work.
- **Monitor proactively**: Check background agent progress via `TaskOutput`/`Read`. Don't wait for the user to ask.
- **npm outdated without fresh install**: Run `npm outdated` against the main repo (which already has `node_modules`) to discover what needs updating, then apply version changes in a worktree. Avoids the cost of `npm install` in every worktree directory just to get an outdated report.

## Commit and Review Workflow

- **Never push directly to main**: `main` is branch-protected — always create a feature branch, push there, and open a PR. Direct pushes will be rejected.
- **Interactive sessions**: Do not commit unless explicitly asked
- **Worktree/subagent sessions**: Auto-commit before returning (worktree is ephemeral)
- **After every push to a PR branch**: Update the PR body via `gh pr edit <pr> --body-file` to reflect all commits. Fetch the current body and modify in place — never rewrite from scratch — so HTML-comment marker blocks (e.g. `<!-- pr-human-guide -->`) survive.
- **Spec status**: When a feature has a spec file in `specs/`, update its `Status` to `Complete` before merging the PR
- **Wait for CI before merging**: Always check `gh pr checks <number>` and wait for all checks to pass before squash merging. Do not use `--admin` to bypass branch protection unless explicitly asked.
- **Post-merge cleanup**: After squash merging a PR, immediately switch to main, pull, and delete the local branch (`git checkout main && git pull && git branch -d <branch>`). Never commit cleanup work (e.g. spec status updates) directly to local main — branch protection will reject the push, and the resulting squash PR will diverge from the local commit, causing a merge commit on the next pull instead of a fast-forward. Then ask the user: "Would you like me to review if there are any learnings from this session that I should persist going forward?"
- **Resolving PR review threads**: `gh` CLI has no resolve command. Use `gh api graphql` — fetch thread IDs via `pullRequest.reviewThreads`, resolve with `resolveReviewThread` mutation. Reply to each thread before resolving.
- **CI toolchain parity**: When adding a new language/toolchain to the monorepo (e.g., Python/uv), update `.github/workflows/verify-pr.yaml` in the same PR to install the required tools
- **Cross-stack cleanup discovered mid-PR**: If the PR exposes a problem it doesn't own (other stacks, shared tooling), file a cross-linked follow-up issue instead of expanding the diff. List filed issues with URLs in the session summary.
- **`claude-review` action fails on PRs that modify the workflow file**: The action requires the workflow file to match `main` before it can authenticate — PRs that change `.github/workflows/claude-code-review.yml` will always get a "Workflow validation failed" error on the `claude-review` check. This is expected and resolves automatically once the PR is merged
- **Documentation**: When adding a new implementation, update: `README.md` (TOC, implementations table, running instructions, test commands, **schema docs table link**, and **Type Diagrams list**), root `CLAUDE.md` as needed, and create `<new-stack>/CLAUDE.md` for any stack-specific gotchas. Every new implementation adds a new DB schema — always update `docs/DATABASE_ARCHITECTURE.md` and `scripts/generate-schema-docs.sh` (add the new `schema_name:dir-name` entry to the SCHEMAS array), then run `npm run docs:schema`. **When a table moves between schemas**: manually delete the old table `.md`, remove it from the old schema's `README.md` and `schema.json`, and create the new schema dir with `README.md`, table `.md`, and `schema.json` — `npm run docs:schema` only works if the DB is live with the migrated schema. **`docs:types` after microservice extraction**: HTTP API response types stay in the consuming service — `docs:types:<stack>` doesn't need updating when only the implementation moves. When adding a TypeScript implementation, add a `docs:types:<stack>` script to `package.json` pointing to the main types/service file, add it to the `docs:types` all-script, **run it** (`npm run docs:types:<stack>`), and **add the generated file link to the Type Diagrams list in `README.md`**. Also add a debug configuration to `.vscode/launch.json` for the new API backend (use the appropriate debug type: `node` for TS/Node APIs, `debugpy` for Python, `go` for Go). For Java/Spring, use `type: java, request: attach` on port 5005 and add a `dev:<stack>:debug` npm script that runs `./gradlew bootRun --debug-jvm` — do not use `request: launch` as it requires full Java extension project resolution which is fragile. Do not wait to be asked — include docs in the implementation plan.

## Running API Integration Tests

See `tests/CLAUDE.md` for shared API contract test lifecycle, `--runInBand`, cross-stack PATCH, and helper flag rules.

## Running E2E Tests

See `tests/CLAUDE.md` for shared E2E lifecycle, cleanup, cross-stack behavior, and Playwright/WebKit quirks. See [docs/TESTING_REFERENCE.md](docs/TESTING_REFERENCE.md) for prerequisites, selector contracts, doc generation commands, and unit test patterns.
