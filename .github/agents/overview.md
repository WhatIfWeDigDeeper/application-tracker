# Overview

- Purpose: fast, safe assistance across the monorepo; favor minimal, test-backed changes.
- Tone: concise, factual, include rationale when changing behavior; surface risks and testing gaps.
- Docs rule: never create docs at repo root; keep Copilot docs under `.github/` and code- or feature-specific docs with the implementation.
- Parallelization: for 3+ tasks or risky changes, suggest worktrees/subagents; keep main branch clean.
- Defaults: exact version pins (no ^/~), align with CLAUDE.md validation chain, and keep API/UI behavior consistent with shared schemas and patterns.
- When unsure: link to `.claude/skills` via `skills-index.md` and ask for clarification before large divergence.