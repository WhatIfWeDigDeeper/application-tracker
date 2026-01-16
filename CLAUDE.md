# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Template repository with Claude Code skills, commands, and configuration for Node.js and React applications.

## Structure

```
.claude/
├── commands/     # User-initiated slash commands
├── skills/       # Proactive automations Claude can suggest
├── scripts/      # Automation scripts
└── settings.json # Plugins and permissions
```

## Commands (User-Initiated)

**Git workflow:**
- `/commit` - Stage changes and create commit with generated message
- `/pr` - Create pull request with generated description
- `/review` - Review code changes before committing

**Parallel development:**
- `/parallel-work [features...]` - Set up git worktrees for parallel feature development
- `/integrate-parallel-work [features...]` - Merge parallel features into integration branch
- `/parallel-agents [features...]` - Spawn subagents for parallel work

## Skills (Claude Can Suggest)

**Building & Fixing:**
- `fix-build` - Diagnose and fix build/type errors
- `debug <issue>` - Investigate and fix a bug systematically

**Code Generation:**
- `add-feature <name>` - Add feature with full validation in worktree
- `add-component <name>` - Create React component with TypeScript
- `add-hook <name>` - Create custom React hook with tests
- `add-api-route <route>` - Create Next.js API route with validation
- `add-test <component>` - Add Jest/React Testing Library tests

**Maintenance:**
- `refactor <target>` - Refactor code while preserving tests
- `update-deps <packages>` - Update dependencies with validation (supports globs, '.' for all)
- `audit-and-fix <packages>` - Security audit and fix vulnerabilities
- `perf-audit` - Profile and optimize performance

**Documentation:**
- `e2e-test <feature>` - Create Playwright e2e tests
- `document-feature <name>` - Generate technical and user documentation

## Scripts

- `bash .claude/scripts/validate-markdown.sh` - Check markdown formatting

## Key Patterns

- **Worktree Isolation**: Complex operations use isolated worktrees at `../<name>-[timestamp]`
- **Validation Chain**: `build` → `lint` → `test` → `test:e2e`
- **Parallel Execution**: 3+ items use Task tool subagents
