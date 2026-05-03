# tests Guidance

Shared API and E2E tests run against multiple stacks.

## API Tests

- For managed API server lifecycle, use `bash scripts/run-api-tests.sh [stack|all]` or `npm run test:api:all`. To run against one already-running API, use `npm run test:api:<stack>`.
- Shared API Jest tests mutate one schema per stack. Keep `--runInBand` in commands that run `tests/api`, including `scripts/run-api-tests.sh` and direct `test:api:<stack>` scripts.
- `run-api-tests.sh all` continues on failure and reports every failed stack.
- Go API and Spring API require all non-optional fields in PATCH requests. Include `companyName` + `positionTitle` for application PATCH, and `name` + `order` for interview stage PATCH.
- Update stack flags in `tests/api/helpers.ts` when adding a stack: `validatesDates`, `hasInterviewStageDates`, and similar contract capability flags.

## E2E Tests

- For managed API/UI lifecycle, use `bash scripts/run-e2e.sh [stack|all]`; `npm run test:e2e:all` uses it too.
- Direct `npm run test:e2e:<stack>` starts only the UI dev server via Playwright `webServer`. If the API was killed, use `bash scripts/run-e2e.sh <stack>`.
- `run-e2e.sh all` stops at the first failing stack. If a flaky test stops the run early, run remaining stacks individually.
- Clean up test-created data in `afterAll` via API calls, not UI interactions. Cleanup must run even if tests fail.
- Files in `tests/e2e/` run against all implementations. Selectors, timing, and interactions must work across SSR React, SPAs, Vue, Svelte, Angular, and Next.js.
  - React SSR stacks need `await page.waitForLoadState('networkidle')` before interacting with controlled inputs (including `beforeAll` setup); SPA frameworks handle `selectOption()` natively after `domcontentloaded`.
- After changing a shared E2E file, run `npm run test:e2e:all` or `bash scripts/run-e2e.sh` to catch cross-stack regressions.
- E2E `beforeAll` PATCHes must include required fields for Go and Spring: `{ companyName, positionTitle, status }`. Status can be set at create time too.
- Use `test.describe.serial` when tests share `beforeAll` setup data; with `fullyParallel: true`, normal describes re-evaluate module-scope variables (e.g. `const company = uniqueCompanyName(...)`) per worker, so `beforeAll`-created data is invisible to `beforeEach` in other workers.

## Playwright / WebKit Quirks

- **webkit + React 19 form submission**: `requestSubmit()`, button `.click()`, and `press('Enter')` do not fire React `onSubmit` in webkit for multi-input forms. Use a `type="button"` save button wired to the submit function and click its test id.
- **Submit button type changes**: Unit tests using `querySelector('button[type="submit"]')` will return `null` after changing to `type="button"`. Prefer `getByTestId()` or `getByRole('button', { name: /save/i })`.
- **Angular `[hidden]` vs `@if`**: `[hidden]` keeps the element in the DOM (just invisible); in webkit, `expect(locator).toBeVisible()` can pass immediately while content/state is still stale, so later assertions read the wrong value. Use `@if` when Playwright waits for an element to appear.
- **Modal re-open timing in webkit**: After closing a modal/panel, assert its heading is not visible before reopening.
- **`selectOption('')` in webkit**: Follow it with `await locator.dispatchEvent('change')` so framework change handlers fire.
- **Count assertions**: Use `/\b1(?!\d)/` instead of `/\b1\b/` when digits can touch labels, such as `1Skipped`.
- **Text assertions**: Use `toContainText(regex)` when padding/whitespace makes `toHaveText(regex)` too strict.
