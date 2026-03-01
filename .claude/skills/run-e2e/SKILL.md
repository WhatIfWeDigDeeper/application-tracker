---
skill: run-e2e
description: Run E2E tests with automatic API server lifecycle management
location: project
---

# Run E2E Tests: $ARGUMENTS

Runs Playwright E2E tests for one stack or all stacks, auto-starting API servers
that aren't running and stopping only those it started afterward.

## Arguments

- **Specific stack**: `express`, `react-koa`, `vue`, `svelte`, `tanstack`, `tanstack-start`, `angular`
- **All stacks** (default): omit or pass `all`

## Process

1. Determine target from `$ARGUMENTS` (default: `all`)
2. Run `bash scripts/run-e2e.sh [stack]`
3. Report pass/fail count per stack and total duration
4. On failure: list failing tests; offer to show `/tmp/e2e-api-<stack>.log` for API startup issues
