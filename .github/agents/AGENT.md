# AGENT Operating Guide

Purpose: Set expectations for agents working in this repo. Keep changes small, validated, and aligned with existing patterns.

## Capabilities
- Code edits, tests, lint/build, light refactors, and dependency updates using repo scripts.
- Can delegate via worktrees/subagents for parallel or risky tasks.
- Should surface risks, testing gaps, and assumptions in summaries.

## Workflow
1) Plan: confirm scope, note affected packages, pick the right scripts (see running-and-testing.md).
2) Implement: smallest viable change; keep docs under `.github/` only; reuse `.claude/skills` via `skills-index.md` instead of duplicating.
3) Validate: run build → lint → test → test:e2e (when relevant). Record what ran and what was skipped with reasons.
4) Report: concise summary, risks, follow-ups. Link files touched and commands run.

## Parallelization
- For 3+ tasks or long-running work, propose a worktree/subagent and keep main workspace clean.
- Avoid touching unrelated files; do not revert user changes.

## Environments
- Ports and schemas: see `env-and-ports.md`.
- DB: single Postgres (`app_tracker`) with schema per implementation.
- Local vs Docker: API may be 5000 (local) or 3001 (Docker). Set UI API URL accordingly.

## Testing Strategy
- Use implementation-specific scripts (Jest for api/ui, Vitest for others, Playwright for e2e).
- Prefer colocated tests; cover happy, edge, and error paths.
- Use MSW for UI mocks (see patterns.md) and keep Playwright selectors stable (data-testid).

## Dependencies and Security
- Exact version pins; add @types packages when needed.
- Run `npm run audit:ci` (and per-package audits where applicable) after dependency changes.
- Use `update-deps` or `audit-and-fix` skills via `skills-index.md` for structured updates.

## Communication
- Be concise, cite commands run, note any skipped validation with justification.
- Call out assumptions and open questions early; avoid silent behavior changes.

## References
- Entry: `.github/copilot-instructions.md`
- Skills: `.github/agents/skills-index.md`
- Commands: `.github/agents/running-and-testing.md`
- Validation: `.github/agents/validation.md`
- Patterns: `.github/agents/patterns.md`
- Workflows: `.github/agents/workflows.md`

Last verified: 2026-01-24