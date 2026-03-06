# Feature Specification: E2E Test Quality Improvements

**Feature Branch**: `020-e2e-test-quality`
**Created**: 2026-03-05
**Status**: In Progress

## Problem Statement

A review of `tests/e2e/` identified recurring flaky-test risks, structural inconsistencies, and meaningful coverage gaps. The suite runs against 8 stacks; a single fragile selector or brittle cleanup can cause spurious failures across all of them. Fixing these issues before they manifest as flakiness in CI is cheaper than diagnosing them under time pressure.

## Scope

### Flaky-Test Fixes (test-file changes only)

| ID | Issue | Location | Risk |
|----|-------|----------|------|
| F1 | UI-based cleanup in `afterAll` | `application-crud.spec.ts`, `history.spec.ts` | High |
| F2 | `.last()` selector to dismiss confirm-delete dialog | `application-crud.spec.ts` (multiple), `history.spec.ts` | High |
| F3 | `waitForLoadState('networkidle')` swallowed with `.catch(() => null)` | `application-crud.spec.ts` | High |
| F4 | Tailwind CSS class selectors in history locators | `history.spec.ts` | Medium |
| F5 | Timestamp-only unique IDs risk parallel collision | `application-crud.spec.ts`, `csv-import-export.spec.ts` | Medium |

### Structural Improvements

| ID | Change | Benefit |
|----|--------|---------|
| S1 | Shared `tests/e2e/helpers.ts` with `deleteApplicationViaApi` | Consistent teardown across all files |
| S2 | `data-testid` on history panel and entry elements in each history-enabled UI | Decouples selector from Tailwind implementation |

### Coverage Additions

| ID | Feature | Gap |
|----|---------|-----|
| C1 | List filtering by status | Zero filter tests today |
| C2 | Interview stage edit and delete | Only stage creation is tested |

### Out of Scope

- Cross-browser testing (Chromium, Firefox) — separate effort
- Accessibility / keyboard navigation — separate effort
- API error scenario tests (500, 404, timeout) — separate effort
- Batch operations, search — not yet implemented in all stacks

## Affected Files

### Test files (all changes)
- `tests/e2e/helpers.ts` — new shared helper module
- `tests/e2e/application-crud.spec.ts` — F1, F2, F3, F5, C1, C2
- `tests/e2e/history.spec.ts` — F1, F2, F4
- `tests/e2e/csv-import-export.spec.ts` — F5 (parallel collision fix)

### UI components (data-testid additions — S2)
Each history-enabled UI needs `data-testid="history-panel"` on the panel root and `data-testid="history-entry"` on per-entry elements:

| UI | History component location |
|----|---------------------------|
| `ui/` (Next.js + Express) | `ui/src/components/HistoryPanel.tsx` (or equivalent) |
| `react-ui/` (React + Koa) | `react-ui/src/components/HistoryPanel.tsx` |
| `vue-ui/` (Vue + Nuxt) | `vue-ui/src/components/HistoryPanel.vue` |
| `svelte-ui/` (Svelte + Hono) | `svelte-ui/src/lib/components/HistoryPanel.svelte` |

## Detailed Requirements

### F1 — API-based cleanup
`afterAll` blocks in `application-crud.spec.ts` and `history.spec.ts` must delete test data via `page.request.delete('/api/applications/:id')` rather than navigating to the application and clicking through the UI. The ID(s) must be captured during creation and stored in a suite-scoped variable.

### F2 — Dialog-scoped delete selector
The confirm-delete button click must be scoped to the dialog element:
```typescript
// Before (fragile — depends on exactly two "Delete" buttons on the page)
await page.locator('button:has-text("Delete")').last().click();

// After (explicit — scoped to dialog)
await page.locator('[role="dialog"] button:has-text("Delete")').click();
```

### F3 — Remove swallowed networkidle
Replace:
```typescript
await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);
```
With a specific API response wait scoped to the relevant request:
```typescript
await page.waitForResponse(resp => resp.url().includes('/api/applications') && resp.status() === 200);
```

### F4 — Semantic history locators
Replace:
```typescript
page.locator('.fixed.inset-y-0.right-0')   // Tailwind panel
page.locator('.space-y-1 > div')            // Entries container
```
With:
```typescript
page.locator('[data-testid="history-panel"]')
page.locator('[data-testid="history-entry"]')
```
This requires S2 (adding `data-testid` attributes to each history component).

### F5 — Collision-safe unique IDs
Replace `Date.now()` with `crypto.randomUUID()` (or `test.info().workerIndex + '-' + Date.now()`) for test data unique identifiers.

### S1 — Shared helpers
`tests/e2e/helpers.ts` exports:
```typescript
export async function deleteApplicationViaApi(page: Page, id: string): Promise<void>
export function uniqueCompanyName(prefix: string): string  // UUID-based
```

### C1 — Filter coverage
New `tests/e2e/filter.spec.ts` (or added block in `application-crud.spec.ts`) covering:
- Create 2 applications with different statuses
- Filter to one status — only matching application visible
- Clear filter — both visible again
- Cleanup via API after suite

### C2 — Stage edit and delete
Extend the existing "Create application with interview stages" test or add a sibling describe block:
- Create application with a stage
- Edit the stage name/notes and verify the update persists
- Delete the stage and verify it disappears from the list

## Success Criteria

1. All existing E2E tests pass with zero test-code changes beyond this spec — no regressions introduced
2. `afterAll` blocks in `application-crud.spec.ts` and `history.spec.ts` use API deletion, not UI navigation
3. No `.last()` selector used for dialog confirmation
4. No `.catch(() => null)` on `waitForLoadState` calls
5. `history.spec.ts` locators use `data-testid` attributes, not Tailwind class names
6. New filter test passes across all stacks that support filtering
7. New stage edit/delete test passes across all stacks
8. `npm run test:e2e:all` (via `bash scripts/run-e2e.sh all`) passes green
