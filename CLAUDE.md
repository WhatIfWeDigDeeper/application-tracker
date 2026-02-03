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

**Learning:**
- `/learn` - Extract lessons from conversation and persist to CLAUDE.md, skills, or commands

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

## Documentation Guidelines

- **NEVER create documentation at repository root** - use `/docs/` or `implementations/<name>/docs/`

## Key Patterns

- **Worktree Isolation**: Complex operations use isolated worktrees at `../<name>-[timestamp]`
- **Validation Chain**: `build` → `lint` → `test` → `test:e2e`
- **Parallel Execution**: 3+ items use Task tool subagents

## Active Technologies
- TypeScript 5.x (strict mode enabled) + React 19, Next.js 16, Tailwind CSS 4.x, Vite (for dev tooling) (001-job-application-tracker)
- localStorage (browser-based, no server-side persistence) (001-job-application-tracker)
- PostgreSQL 18 (single database with multiple schemas for different implementations)

## Database Architecture

### Multi-Schema Organization
All implementations share a single PostgreSQL database (`app_tracker`) but use separate schemas for isolation:

- **express_prisma** - Root Express + Prisma implementation
- **react_koa** - React + Koa + PostgreSQL (raw SQL) implementation
- **svelte_hono** - Svelte + Hono + Drizzle ORM implementation
- **vue_parse** - Vue + Parse Server implementation

### Connection Strings
Each implementation uses schema-aware connection strings:
```
postgresql://postgres:postgres@localhost:5432/app_tracker?schema=<schema_name>
```

### Schema Configuration by Implementation

**Root (Express + Prisma):**
- Schema defined in: `api/prisma/schema.prisma`
- Uses `@@schema("express_prisma")` directive

**React-Koa-PG:**
- Schema defined in: `koa-api/src/db/schema.sql`
- Creates `react_koa` schema at the top of the file
- Uses `SET search_path TO react_koa;`

**Svelte-Hono-Drizzle:**
- Schema defined in: `hono-api/src/db/schema.ts`
- Uses Drizzle's `pgSchema('svelte_hono')`
- Config in: `drizzle.config.ts` with `schemaFilter: ['svelte_hono']`

**Vue-Parse-Server:**
- Parse Server manages schema automatically in `vue_parse` schema
- Connection configured in: `parse-server-api/src/config/index.ts`
- **Vite Compatibility**: Parse SDK has a known issue with Vite due to LiveQuery's use of Node.js `events` module. The solution is a wrapper at `vue-ui/src/lib/parse.ts` that imports `parse/dist/parse.min.js` (which assigns Parse to `window.Parse`)

### Benefits
- **Resource efficiency**: Single PostgreSQL instance
- **Data isolation**: Each implementation has its own namespace
- **Easy comparison**: All data accessible from one database
- **Independent operation**: Schemas don't interfere with each other

## Code Quality Requirements

### After Adding or Modifying Code
**Always complete the validation chain** after making code changes:

1. **Add tests** - Create or update tests for new functionality
2. **Run tests** - Execute `npm test` to verify all tests pass
3. **Run linting** - Execute `npm run lint` to check code style
4. **Run build** - Execute `npm run build` to verify compilation

**When to skip steps:**
- Trivial changes (typo fixes, comment updates) - skip all
- Test-only changes - skip step 1, run steps 2-4
- Documentation-only changes - skip all

**Note:** Skills like `add-component`, `add-api-route`, and `add-hook` already include these steps.

## Dependency Management

### Package Version Selection
When installing **new packages**:
- Always use the **latest stable version** unless there are breaking changes with existing dependencies
- Check for compatibility issues with the project's Node.js version and other installed packages
- Document any version constraints in comments if pinning is necessary
- Use exact versions in package.json (no ^ or ~) for reproducibility
- If the package does not contain Typescript types, check if there is an @types/{package name} and install if so

When **updating existing packages**:
- Use the `update-deps` skill for systematic updates with validation
- Test the validation chain (`build` → `lint` → `test` → `test:e2e`) after updates

## API Design Patterns

### Individual Operations Over Batch Replace
When managing nested resources (e.g., interview stages within applications):
- **Prefer individual CRUD operations** (`addStage`, `updateStage`, `removeStage`) over batch replace operations (`setStages`)
- Batch replace typically deletes all existing items before creating new ones, causing unexpected DELETE calls
- Individual operations are more predictable and efficient (only the intended HTTP method is called)

### Callback Patterns for Components
When components manage child resources:
- Pass individual callbacks (`onAdd`, `onUpdate`, `onRemove`) instead of a single `onChange` with full state
- This allows parent components to make targeted API calls without needing to diff arrays

## Running E2E Tests

### Prerequisites
Before running e2e tests, ensure the required backend services are running:

| Implementation | UI Port | API Port | Start API Command |
|---------------|---------|----------|-------------------|
| Next.js + Express | 3000 | 3001 | `cd api && npm run dev` |
| React + Koa | 3010 | 5010 | `cd koa-api && npm run dev` |
| Vue + Parse | 3020 | 5001 | `cd parse-server-api && npm run dev` |
| Svelte + Hono | 3030 | 5030 | `cd hono-api && npm run dev` |

### Running Tests
```bash
# For vue-ui (requires parse-server-api running on port 5001)
cd vue-ui && npm run test:e2e

# For other implementations, start their respective API first
```

## Testing Patterns

### MSW for API Mocking
- MSW handlers are in `ui/src/test-utils/mocks/handlers.ts`
- Server setup in `ui/src/test-utils/mocks/server.ts`
- Requires fetch polyfills (TextEncoder, Response, etc.) in Jest environment

### Component Tests with Modals
- Use `cleanup()` after each test when testing components with portals/modals
- Create fresh mock functions per test using factory pattern (`createMockProps()`)
- Use `waitFor()` when interacting with modals to ensure they're rendered

### Test File Organization
- Hook tests: `src/hooks/*.test.ts`
- Component tests: `src/components/**/*.test.tsx`
- Service tests: `src/__tests__/services/*.test.ts`

## Version Documentation Files

When updating packages with major version changes, update version references in these files:

**Always update:**
- `CLAUDE.md` - Active Technologies section
- `README.md` - Stack descriptions
- `docs/IMPLEMENTATION_READY.md` - Technology stack section
- `docs/API_IMPLEMENTATION_SUMMARY.md` - Technology stack section
- `specs/001-job-application-tracker/plan.md` - Technical Context section

**Never update (historical records):**
- `specs/*/research.md` - Original research notes
- `specs/*/tasks.md` - Completed task records

## Recent Changes
- 001-job-application-tracker: Added TypeScript 5.x (strict mode enabled) + React 19, Next.js 16, Tailwind CSS 4.x, Vite (for dev tooling)
