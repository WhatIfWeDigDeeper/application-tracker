# Implementation Plan: Rename "Rejected" Display Label to "Not a match"

## Approach

Update the display label constant in each UI implementation's label/constant file. No API, database, or type changes required — this is purely a string substitution in display configuration.

## Steps

1. **Shared base** — `ui/src/lib/constants.ts`: `STATUS_LABELS.rejected: 'Rejected'` → `'Not a match'`
2. **react-ui** — `react-ui/src/lib/constants.ts`: rejected entry label → `'Not a match'`
3. **tanstack-ui** — `tanstack-ui/src/lib/constants.ts`: rejected entry label → `'Not a match'`
4. **tanstack-start-ui** — `tanstack-start-ui/src/lib/constants.ts`: rejected entry label → `'Not a match'`
5. **svelte-ui** — `svelte-ui/src/lib/types/index.ts`: `STATUS_LABELS.rejected` → `'Not a match'`
6. **vue-ui** — `vue-ui/src/components/StatusBadge.vue`: rejected label in statusConfig → `'Not a match'`
7. **angular-ui** — `angular-ui/src/app/core/models/application.model.ts`: rejected label in APPLICATION_STATUSES → `'Not a match'`
8. **Spec docs** — `specs/core/domain/enums.md`: Display Name column → `'Not a match'`
9. **Spec docs** — `specs/001-job-application-tracker/spec.md`: FR-003 status list
10. **CLAUDE.md** — Add server lifecycle guidance, strengthen "Add tests" step, add Plan Execution pattern, add Docs step 6
11. **E2E regression** — Add test to `tests/e2e/application-crud.spec.ts` asserting badge shows "Not a match" for rejected status

## Verification

- `npm run build:all` — no compilation errors
- `npm run lint:all` — no lint regressions
- `npm run test:all` — all unit tests pass (no label assertions in existing tests)
- E2E per stack: `npm run test:e2e:<stack>` — new regression test passes

## Execution Approach

Single session, sequential. All tasks are simple string substitutions or spec file writes with no risk of breaking running apps and no coordination overhead.
