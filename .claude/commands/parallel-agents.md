---
command: parallel-agents
description: Spawn subagents to develop features in parallel worktrees
arguments: feature names to develop
---

# Parallel Agent Development: $ARGUMENTS

Use Task tool subagents to develop multiple features simultaneously in isolated worktrees.

## Process

### Phase 1: Setup Worktrees

For each feature in `$ARGUMENTS`:
- Create worktree at `../[project]-[feature-name]` with branch `feature/[feature-name]`
- Install dependencies if needed

### Phase 2: Spawn Subagents

For each feature, launch a Task subagent with instructions to:
- Work in the isolated worktree directory
- Implement the feature with tests
- Run build and tests (don't start dev server)
- Write summary to `[feature-name].work.txt` in project root

### Phase 3: Collect Results

After all agents complete:
- Read all `.work.txt` summary files
- Provide comprehensive summary of what was accomplished
- List next steps for integration

## Notes

- Each subagent works independently in isolation
- Use `run_in_background: true` for parallel execution
- Monitor with TaskOutput tool
