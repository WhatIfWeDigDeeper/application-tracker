---
command: parallel-work
description: Set up git worktrees for parallel feature development
arguments: feature names to develop in parallel
---

# Parallel Feature Development: $ARGUMENTS

Set up isolated git worktrees for developing multiple features simultaneously.

## Process

1. For each feature in `$ARGUMENTS`:
   - Create worktree at `../[project]-[feature-name]` with branch `feature/[feature-name]`
   - Set up development environment (install dependencies if needed)

2. List all created worktrees to confirm

3. Explain the isolation: each worktree is independent, changes don't affect main workspace

## Notes

- Worktrees share git history but have separate working directories
- Run `git worktree list` to see all active worktrees
- Clean up with `git worktree remove <path>` when done
