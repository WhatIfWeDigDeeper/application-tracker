# Tasks: E2E Test Quality Improvements

## Status: Complete

---

## Phase 1 — Shared helpers + collision-safe IDs

| # | File | Change | Status |
|---|------|--------|--------|
| 1 | `tests/e2e/helpers.ts` *(new)* | Create with `deleteApplicationViaApi(page, id)` and `uniqueCompanyName(prefix)` helpers | ✅ |
| 2 | `tests/e2e/csv-import-export.spec.ts` | Replace `Date.now()` unique URL with `crypto.randomUUID()` (F5) | ✅ |

---

## Phase 2 — Fix flaky patterns in existing test files

### application-crud.spec.ts

| # | Change | Spec ID | Status |
|---|--------|---------|--------|
| 3 | Capture `id` (not just URL) when creating test apps; store as `createdApps: { id: string; url: string }[]` | F1 | ✅ |
| 4 | Replace `afterAll` UI-click cleanup with `deleteApplicationViaApi` loop over captured IDs | F1 | ✅ |
| 5 | Replace all `locator('button:has-text("Delete")').last()` with `locator('[role="dialog"] button:has-text("Delete")')` | F2 | ✅ |
| 6 | Replace `waitForLoadState('networkidle', ...).catch(() => null)` with `waitForResponse` scoped to `/api/applications` | F3 | ✅ |
| 7 | Replace `Date.now()` unique names with `uniqueCompanyName(prefix)` from helpers | F5 | ✅ |

### history.spec.ts

| # | Change | Spec ID | Status |
|---|--------|---------|--------|
| 8 | Capture `id` from creation response in `beforeAll`; store as `applicationId` | F1 | ✅ |
| 9 | Replace `afterAll` UI-click cleanup with `deleteApplicationViaApi(page, applicationId)` | F1 | ✅ |
| 10 | Replace `locator('button:has-text("Delete")').last()` with `locator('[role="dialog"] button:has-text("Delete")')` | F2 | ✅ |
| 11 | Replace Tailwind CSS class locators with `data-testid` selectors (`.fixed.inset-y-0.right-0` → `[data-testid="history-panel"]`, `.space-y-1 > div` → `[data-testid="history-entry"]`) | F4 | ✅ |

---

## Phase 3 — Add data-testid to history UI components

| # | File | Change | Spec ID | Status |
|---|------|--------|---------|--------|
| 12 | `ui/src/` — HistoryPanel component | Add `data-testid="history-panel"` to panel root element | S2 | ✅ |
| 13 | `ui/src/` — HistoryPanel component | Add `data-testid="history-entry"` to per-entry element | S2 | ✅ |
| 14 | `react-ui/src/` — HistoryPanel component | Add `data-testid="history-panel"` to panel root element | S2 | ✅ |
| 15 | `react-ui/src/` — HistoryPanel component | Add `data-testid="history-entry"` to per-entry element | S2 | ✅ |
| 16 | `vue-ui/src/` — HistoryPanel component | Add `data-testid="history-panel"` to panel root element | S2 | ✅ |
| 17 | `vue-ui/src/` — HistoryPanel component | Add `data-testid="history-entry"` to per-entry element | S2 | ✅ |
| 18 | `svelte-ui/src/` — HistoryPanel component | Add `data-testid="history-panel"` to panel root element | S2 | ✅ |
| 19 | `svelte-ui/src/` — HistoryPanel component | Add `data-testid="history-entry"` to per-entry element | S2 | ✅ |
| 20 | `tests/e2e/history.spec.ts` | Replace Tailwind CSS locators with `[data-testid="history-panel"]` and `[data-testid="history-entry"]` | F4 | ✅ |
| 20a | `tanstack-ui/src/` — HistoryPanel component | Add `data-testid="history-panel"` and `data-testid="history-entry"` (discovered missing during implementation) | S2 | ✅ |
| 20b | `tanstack-start-ui/src/` — HistoryPanel component | Add `data-testid="history-panel"` and `data-testid="history-entry"` (discovered missing during implementation) | S2 | ✅ |
| 20c | `angular-ui/src/` — HistoryPanel component | Add `data-testid="history-panel"` and `data-testid="history-entry"` (discovered missing during implementation) | S2 | ✅ |
| 20d | `angular-spring-ui/src/` — HistoryPanel component | Add `data-testid="history-panel"` and `data-testid="history-entry"` (discovered missing during implementation) | S2 | ✅ |

---

## Phase 4 — New test coverage

| # | File | Change | Spec ID | Status |
|---|------|--------|---------|--------|
| 21 | `tests/e2e/filter.spec.ts` *(new)* | Create describe block with beforeAll (API: create 2 apps with different statuses), 3 filter tests (filter applied, filter interviewing, clear filter), afterAll (API delete) | C1 | ✅ |
| 22 | `tests/e2e/application-crud.spec.ts` | Add `describe('Interview stage edit and delete')` block: beforeAll creates app+stage via API, test edits stage name and verifies persistence, test deletes stage and verifies removal, afterAll deletes app via API | C2 | ✅ |

---

## Validation

| # | Command | Purpose | Status |
|---|---------|---------|--------|
| 23 | `npm run build:all` | No compilation errors from data-testid changes or new test files | ✅ |
| 24 | `npm run lint:all` | No lint regressions | ✅ |
| 25 | `npm run test:all` | Unit tests unaffected | ✅ |
| 26 | `bash scripts/run-e2e.sh all` | Full cross-stack E2E suite passes green | ✅ |
