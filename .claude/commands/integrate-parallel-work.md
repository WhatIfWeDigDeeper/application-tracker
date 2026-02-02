---
command: integrate-parallel-work
description: Merge parallel feature branches into integration branch
arguments: feature names to integrate
---

# Integrate Parallel Features: $ARGUMENTS

Merge features developed in parallel worktrees into a single integration branch.

## Process

1. **Check and commit worktree changes**:
   - For each feature in `$ARGUMENTS`:
     - Check if the worktree exists and has uncommitted changes
     - If uncommitted changes exist:
       - Stage all changes (`git add -A`)
       - Create a commit with a descriptive message based on the implementation
       - Use format: `feat: Add [Implementation Name]` with bullet points for key changes
       - Include `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`

2. Create integration branch `integration/parallel-features` from main

3. For each feature in `$ARGUMENTS`:
   - Merge `feature/[feature-name]` into integration branch
   - Resolve any merge conflicts
   - For root README.md conflicts: create comprehensive overview linking to all implementations

4. Run validation suite:
   - Build
   - Lint
   - Tests

5. On success: offer to merge integration branch to main and clean up

6. Clean up feature branches and worktrees after successful merge
