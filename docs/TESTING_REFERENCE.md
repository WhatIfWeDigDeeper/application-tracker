# Testing Reference

## E2E Test Prerequisites

Before running e2e tests, ensure the required backend services are running:

| Implementation | UI Port | API Port | Start API Command |
|---------------|---------|----------|-------------------|
| Next.js + Express | 3000 | 3001 | `cd api && npm run dev` |
| React + Koa | 3010 | 5010 | `cd koa-api && npm run dev` |
| Vue + Nuxt | 3020 | 5040 | `cd nuxt-api && npm run dev` |
| Svelte + Hono | 3030 | 5030 | `cd hono-api && npm run dev` |

## Shared Selector Contract

All implementations must match identical selectors for the shared e2e tests:

- Button text: `"Add Application"`, `"Create Application"`, `"Save Changes"`, `"Discard"`, `"Delete"`, `"Add Stage"`, `"Back to List"`
- Input placeholders: `"Company Name *"`, `"Position Title *"`, `"Phone Screen, Technical Interview..."`
- Element IDs: `#dateApplied`, `#status`, `#offerDueDate`, `#companyCategory`, `#jobSource`, `#specialRequirements`, `#notes`, `#salaryMin`, `#salaryMax`
- URL field placeholders: `"https://example.com"`, `"https://example.com/careers"`, `"https://linkedin.com/jobs/..."`
- Labels: `/cover letter required/i`

## Test Data Cleanup

E2E tests clean up after themselves via `afterAll` hooks, but interrupted runs can leave data behind. Use the cleanup script to remove leftover test applications:

```bash
# defaults: nuxt-api (port 5040)
npm run cleanup:test-data
# preview without deleting
npm run cleanup:test-data -- --dry-run
# custom port + keyword
npm run cleanup:test-data -- --port 3001 "My Keyword"
```

The script calls `GET /api/applications` then `DELETE /api/applications/:id` for each match, so it respects cascade logic. Default keywords cover common e2e test names (`Test Co`, `History Co`, `Delete Co`, etc.). Custom keywords replace the defaults.

## Unit Testing Patterns

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

## Documentation Generation

### Schema Documentation
Regenerate database ERD docs after schema changes:
```bash
npm run docs:schema    # Requires tbls (brew install tbls) and running PostgreSQL
```
Runs `scripts/generate-schema-docs.sh`, generates Mermaid ERDs under `docs/schema/` for all 4 schemas.

### Type Diagrams
Regenerate TypeScript type diagrams after type changes:
```bash
npm run docs:types         # All implementations
npm run docs:types:nuxt    # Individual implementation
```
Uses `ts-to-mermaid` via npx. Output: `docs/types/{implementation}/`.
Note: hono-api excluded (types are Zod-inferred, tool can't resolve).

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
