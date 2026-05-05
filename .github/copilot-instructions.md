# Copilot Instructions

**Scope:** Repo-wide guardrails and navigation for GitHub Copilot Chat. Keep changes within this monorepo; respect existing workflows and Claude skills.

## How to Use This Guide
- Start here, then jump to the focused partials in `.github/agents/` for on-demand detail.
- For automation recipes, see `.github/agents/skills-index.md` to leverage existing `.claude/skills` instead of duplicating them.
- Honor CLAUDE.md rules: no new docs at repo root; prefer exact version pins; use worktrees for complex work.
- Keep `CLAUDE.md` and `.github/copilot-instructions.md` in sync for cross-cutting rule changes.

## Quick Rules
- Run the validation chain after meaningful code changes: `build → lint → test → test:e2e`; skip only for trivial/docs-only edits.
- Prefer individual CRUD operations over batch replace for nested resources; UI components expose `onAdd/onUpdate/onRemove` instead of `onChange` full-state diffs.
- Use exact dependency versions (no ^ or ~); run audit checks before shipping.
- Keep APIs/UI aligned with the shared schema and port mappings; see env/ports partial.
- Rails API work lives in `rails-api/` and uses Ruby 3.3+ with ActiveRecord against PostgreSQL schema `ruby_rails` on port 5180.
- Use worktrees or subagents for 3+ parallel items.

## Code Review
- Before raising PR feedback, read existing review threads and replies on the touched code. Do not restate issues that were already answered, intentionally accepted, or deferred to a linked follow-up issue unless later commits materially changed the code or invalidated the earlier resolution.

## Jump To Partials
- Overview and tone: `.github/agents/overview.md`
- Validation chain details: `.github/agents/validation.md`
- Running and testing commands: `.github/agents/running-and-testing.md`
- Env and ports: `.github/agents/env-and-ports.md`
- E2E guidance: `.github/agents/e2e.md`
- Dependencies and security: `.github/agents/dependencies-security.md`
- Patterns (API/UI/testing): `.github/agents/patterns.md`
- Workflows/CI expectations: `.github/agents/workflows.md`
- Troubleshooting: `.github/agents/troubleshooting.md`
- Skills index (reuse Claude skills): `.github/agents/skills-index.md`
- Agent operating guide: `.github/agents/AGENT.md`

## Agent Skills Policy

When responding to PR review feedback, do not directly apply reviewer suggestions to files in `.agents/skills/` — post a reply noting the suggestion will be addressed upstream instead. Skills sourced from `WhatIfWeDigDeeper/agent-skills` (e.g., `pr-comments`, `ship-it`, `learn`, `playwright-cli`) are maintained upstream; deliberate version upgrades or syncs via dedicated PRs are fine. Only project-owned files (`scripts/`, `.vscode/`, `docs/`, `fastapi/`, application source) are in-scope for directly applying reviewer feedback.

## Cross-Cutting Patterns
- **README TOC**: When adding a section or subsection to `README.md`, add a matching TOC entry. Anchor format: lowercase, spaces → `-`, drop special characters except hyphens. Subsections indent two spaces under their parent.
- **Validation limit changes**: When updating max lengths in constants/schemas, grep for hardcoded boundary values in tests (e.g., `repeat(1001)`) — tests may silently pass with stale limits
- **GitHub CLI pager fallback in VS Code**: If `gh` opens the alternate buffer or exits 130 despite `GH_PAGER=cat PAGER=cat`, redirect output to a temp file and inspect it in the editor or with CLI tools like `cat`, `sed`, or `rg` (for example, `TMP=$(mktemp ...); gh pr view ... > "$TMP"`).
- **Shared tests**: See `tests/CLAUDE.md` for API/E2E lifecycle, `--runInBand`, cleanup, and Playwright/WebKit quirks.
- **Migrations**: Prefer `IF NOT EXISTS` on `CREATE SCHEMA / TABLE / INDEX` — `app_tracker` is shared; prior state may pre-exist.
- **Cross-stack cleanup discovered mid-PR**: If the PR exposes a problem it doesn't own (other stacks, shared tooling), file a cross-linked follow-up issue instead of expanding the diff. List filed issues with URLs in the session summary.
- **Rule writing**: Every clause must be load-bearing (rule / non-obvious why / concrete example). Cut restatements, redundant adverbs, and self-evident "why" tails.
- **PR body updates after push**: Fetch the current body and modify in place via `gh pr edit <pr> --body-file` — never rewrite from scratch — so HTML-comment marker blocks (e.g. `<!-- pr-human-guide -->`) survive.

## When in Doubt
- Mirror existing implementations; prefer incremental changes with tests.
- Link to `.claude/skills` via the skills index instead of rewriting guidance.
- Ask for clarification if a requirement conflicts; document any deviations in PR descriptions.

- **Corrupted npm lockfile signatures**: If `package-lock.json` contains absolute temp paths (for example `../../../../private/tmp/.../node_modules/*`) and many `"extraneous": true` entries, `npm ci` may fail with platform errors (e.g. `@esbuild/*` `EBADPLATFORM`) even for optional deps. Fix by deleting `node_modules` and `package-lock.json` in that package, then running `npm install` to regenerate a clean lockfile.
