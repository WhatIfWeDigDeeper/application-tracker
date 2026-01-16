---
command: integrate-parallel-work
description: Merge parallel feature branches into integration branch
arguments: feature names to integrate
---

# Integrate Parallel Features: $ARGUMENTS

Merge features developed in parallel worktrees into a single integration branch.

## Process

1. Create integration branch `integration/parallel-features` from main

2. For each feature in `$ARGUMENTS`:
   - Merge `feature/[feature-name]` into integration branch
   - Resolve any merge conflicts

3. Run validation suite:
   - Build
   - Lint
   - Tests

4. On success: offer to merge integration branch to main and clean up

5. Clean up feature branches and worktrees after successful merge
