# Implementation Plan: E2E Test Quality Improvements

## Approach

Work in four sequential phases. Each phase is independently verifiable. No application logic changes — only test infrastructure, test files, and minimal UI attribute additions (`data-testid`).

---

## Phase 1 — Shared helpers + collision-safe IDs (Foundation)

Before touching individual test files, establish the shared foundation so all subsequent changes can use it.

**1.1** Create `tests/e2e/helpers.ts`:
- `deleteApplicationViaApi(page, id)` — wraps `page.request.delete('/api/applications/${id}')`
- `uniqueCompanyName(prefix)` — returns `${prefix} ${crypto.randomUUID().slice(0, 8)}`

**1.2** In `csv-import-export.spec.ts`, replace `Date.now()`-based unique URL with `crypto.randomUUID()`. No other changes to this file.

**Verification**: TypeScript compiles cleanly; no test regressions.

---

## Phase 2 — Fix flaky patterns in existing test files

Apply all flaky-test fixes. Each fix is a targeted edit, not a rewrite.

### 2.1 `application-crud.spec.ts`

**F1 — API cleanup**: The `afterAll` in the "Application CRUD - Inline Edit" describe block navigates to each app URL and clicks Delete buttons. Replace with:
```typescript
test.afterAll(async ({ browser }) => {
  if (createdIds.length === 0) return;
  const context = await browser.newContext();
  const page = await context.newPage();
  for (const id of createdIds) {
    await deleteApplicationViaApi(page, id);
  }
  await context.close();
});
```
This requires capturing the application `id` alongside (or instead of) the URL when each application is created. Update the `createdUrls` variable to `createdIds` (string array), or keep both as `createdApps: { id: string; url: string }[]`.

**F2 — Dialog selector**: All occurrences of:
```typescript
await page.locator('button:has-text("Delete")').last().click();
```
replace with:
```typescript
await page.locator('[role="dialog"] button:has-text("Delete")').click();
```
Locate every occurrence with `grep -n 'last()' tests/e2e/application-crud.spec.ts` before editing.

**F3 — NetworkIdle swallow**: Remove `.catch(() => null)` from the `waitForLoadState('networkidle')` call. Replace with a specific API response wait:
```typescript
await page.waitForResponse(
  resp => resp.url().includes('/api/applications') && resp.status() === 200,
  { timeout: 15000 }
);
```

**F5 — Unique IDs**: Replace `Date.now()` with `uniqueCompanyName()` from helpers where used for collision-safe naming.

### 2.2 `history.spec.ts`

**F1 — API cleanup**: Capture the application `id` from the creation response in `beforeAll`. Replace the `afterAll` UI-click pattern with `deleteApplicationViaApi(page, applicationId)`.

**F2 — Dialog selector**: Same replacement as 2.1 — scope confirm-delete button to `[role="dialog"]`.

**F4 — CSS locators**: Replace Tailwind-coupled locators once S2 is done (Phase 3). Mark with a `TODO(020-F4)` comment in this phase as a placeholder if Phase 3 isn't complete yet.

---

## Phase 3 — Add data-testid to history UI components (S2)

Add `data-testid="history-panel"` to the panel root element and `data-testid="history-entry"` to the repeating entry element in all four history-enabled UIs. These are additive HTML attribute changes — no logic changes.

For each UI, locate the history panel component:
- `ui/` — grep for `HistoryPanel` in `ui/src/`
- `react-ui/` — grep for `HistoryPanel` in `react-ui/src/`
- `vue-ui/` — grep for `HistoryPanel` in `vue-ui/src/`
- `svelte-ui/` — grep for `HistoryPanel` in `svelte-ui/src/`

After all four are updated, update `history.spec.ts` to use the new `data-testid` selectors (resolving the `TODO(020-F4)` from Phase 2).

**Verification**: `npm run build:react-next-ui && npm run build:react-ui && npm run build:vue && npm run build:svelte` — no compilation errors.

---

## Phase 4 — New test coverage

### 4.1 Filter coverage — `filter.spec.ts`

Create `tests/e2e/filter.spec.ts` with a single describe block:

```
describe('Application list filtering')
  beforeAll: create 2 applications via API
    - app A: status "applied"
    - app B: status "interviewing"

  test: filter by "applied" — only app A visible, app B absent
  test: filter by "interviewing" — only app B visible, app A absent
  test: clear filter — both apps visible

  afterAll: delete both via API
```

The filter mechanism varies by stack. Inspect how each stack exposes filter controls (status dropdown in list header, sidebar filter, etc.) using the selector contract in `docs/TESTING_REFERENCE.md`. Use a stable selector pattern (role or label, not CSS class).

### 4.2 Stage edit and delete — extend `application-crud.spec.ts`

Add a `describe('Interview stage edit and delete')` block (serial, following the existing stage-creation test):

```
beforeAll: create application with one stage via UI form

  test: edit stage — update stage name, save, reload, verify updated name persists
  test: delete stage — click remove button, confirm, verify stage gone from list

afterAll: delete application via API
```

---

## Verification Steps

After all phases are complete, run the full validation chain:

1. **Build** — `npm run build:all` — no compilation errors
2. **Lint** — `npm run lint:all` — no lint regressions
3. **Unit tests** — `npm run test:all` — all existing tests pass
4. **E2E — all stacks** — `bash scripts/run-e2e.sh all` — all stacks green (or use `npm run test:e2e:all`)

Per-stack spot-check when servers are already running:
```bash
TEST_UI_PORT=3000 npm run test:e2e:react-next-ui
TEST_UI_PORT=3010 npm run test:e2e:react-ui
TEST_UI_PORT=3020 npm run test:e2e:vue-ui
TEST_UI_PORT=3030 npm run test:e2e:svelte-ui
TEST_UI_PORT=3040 npm run test:e2e:tanstack-start-ui
TEST_UI_PORT=3050 npm run test:e2e:tanstack-ui
TEST_UI_PORT=3060 npm run test:e2e:angular-ui
TEST_UI_PORT=3070 npm run test:e2e:angular-spring-ui
```

---

## Execution Approach

Single session, sequential by phase. Each phase is small and verifiable independently. No parallel agents needed — all changes are in the test directory and UI component attribute additions. Total estimated test files touched: 4 + 4 UI components + 1 new file.
