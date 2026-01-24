# Copilot Instructions

**Scope:** Repo-wide guardrails and navigation for GitHub Copilot Chat. Keep changes within this monorepo; respect existing workflows and Claude skills.

## How to Use This Guide
- Start here, then jump to the focused partials in `.github/agents/` for on-demand detail.
- For automation recipes, see `.github/agents/skills-index.md` to leverage existing `.claude/skills` instead of duplicating them.
- Honor CLAUDE.md rules: no new docs at repo root; prefer exact version pins; use worktrees for complex work.

## Quick Rules
- Run the validation chain after meaningful code changes: `build → lint → test → test:e2e`; skip only for trivial/docs-only edits.
- Prefer individual CRUD operations over batch replace for nested resources; UI components expose `onAdd/onUpdate/onRemove` instead of `onChange` full-state diffs.
- Use exact dependency versions (no ^ or ~); run audit checks before shipping.
- Keep APIs/UI aligned with the shared schema and port mappings; see env/ports partial.
- Use worktrees or subagents for 3+ parallel items.

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

## When in Doubt
- Mirror existing implementations; prefer incremental changes with tests.
- Link to `.claude/skills` via the skills index instead of rewriting guidance.
- Ask for clarification if a requirement conflicts; document any deviations in PR descriptions.