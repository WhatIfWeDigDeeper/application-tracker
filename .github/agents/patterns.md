# Patterns (API, UI, Testing)

- Nested resources: prefer individual CRUD (add/update/remove) over batch replace to avoid unintended deletes.
- UI callbacks: expose `onAdd/onUpdate/onRemove` instead of a single `onChange` with full state diffs.
- Validation: use zod where present (api/hono/koa); keep shared schemas consistent with DB schema.
- Testing: use MSW for UI API mocking (handlers in `ui/src/test-utils/mocks/handlers.ts`, server in `ui/src/test-utils/mocks/server.ts`).
- Portals/modals: cleanup after each test, use fresh mocks per test, and `waitFor` when interacting with modals.
- File organization: keep tests colocated by concern (components, hooks, services) and follow existing naming patterns.
- Performance: use `perf-audit` skill when investigating regressions; avoid premature optimization without measurements.