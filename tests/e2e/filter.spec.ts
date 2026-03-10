import { test, expect } from '@playwright/test';
import { deleteApplicationViaApi, uniqueCompanyName } from './helpers';

// Filter tests run against all stacks that expose a status filter select.
// Stacks without a filter UI will skip gracefully via the isVisible check.

test.describe.serial('List filter by status', () => {
  let appliedAppId: string;
  let interviewingAppId: string;
  const appliedCompany = uniqueCompanyName('Filter Applied Co');
  const interviewingCompany = uniqueCompanyName('Filter Interviewing Co');

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    const res1 = await page.request.post('/api/applications', {
      data: { companyName: appliedCompany, positionTitle: 'Engineer' },
    });
    const app1 = await res1.json();
    appliedAppId = app1.id;
    // Include all required fields in PATCH so backends that require full body (e.g. Go, Spring) also work.
    await page.request.patch(`/api/applications/${appliedAppId}`, {
      data: { companyName: appliedCompany, positionTitle: 'Engineer', status: 'applied' },
    });

    const res2 = await page.request.post('/api/applications', {
      data: { companyName: interviewingCompany, positionTitle: 'Engineer' },
    });
    const app2 = await res2.json();
    interviewingAppId = app2.id;
    await page.request.patch(`/api/applications/${interviewingAppId}`, {
      data: { companyName: interviewingCompany, positionTitle: 'Engineer', status: 'interviewing' },
    });

    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    if (appliedAppId) await deleteApplicationViaApi(page, appliedAppId);
    if (interviewingAppId) await deleteApplicationViaApi(page, interviewingAppId);
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('h1', { timeout: 10000 });
    // Wait for both test companies to appear in the unfiltered list.
    // This confirms the initial data-load API call has completed before each
    // test starts, so subsequent filter actions don't race with the page-load response.
    await page.waitForSelector(`text=${appliedCompany}`, { timeout: 10000 });
    await page.waitForSelector(`text=${interviewingCompany}`, { timeout: 10000 });
  });

  test('filter applied — only applied apps visible', async ({ page }) => {
    const statusSelect = page.locator('select:has(option[value="applied"])').first();
    const filterPresent = await statusSelect.isVisible({ timeout: 2000 }).catch(() => false);
    test.skip(!filterPresent, 'Status filter not available on this stack');

    await statusSelect.selectOption('applied');

    // Check the company that should DISAPPEAR first (longer timeout confirms filter applied).
    // Only then verify the remaining company is still present.
    await expect(page.locator(`text=${interviewingCompany}`)).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${appliedCompany}`).first()).toBeVisible({ timeout: 5000 });
  });

  test('filter interviewing — only interviewing apps visible', async ({ page }) => {
    const statusSelect = page.locator('select:has(option[value="interviewing"])').first();
    const filterPresent = await statusSelect.isVisible({ timeout: 2000 }).catch(() => false);
    test.skip(!filterPresent, 'Status filter not available on this stack');

    await statusSelect.selectOption('interviewing');

    await expect(page.locator(`text=${appliedCompany}`)).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${interviewingCompany}`).first()).toBeVisible({ timeout: 5000 });
  });

  test('clear filter — both apps visible', async ({ page }) => {
    const statusSelect = page.locator('select:has(option[value="applied"])').first();
    const filterPresent = await statusSelect.isVisible({ timeout: 2000 }).catch(() => false);
    test.skip(!filterPresent, 'Status filter not available on this stack');

    // Apply a filter first, wait for the list to update
    await statusSelect.selectOption('applied');
    await expect(page.locator(`text=${interviewingCompany}`)).not.toBeVisible({ timeout: 10000 });

    // Clear the filter (first option "" = all), wait for both to appear.
    // Explicitly dispatch 'change' after selectOption('') because webkit does not
    // fire a change event when returning to the blank default option, which means
    // Angular's (ngModelChange) handler never runs without this extra dispatch.
    await statusSelect.selectOption('');
    await statusSelect.dispatchEvent('change');
    await expect(page.locator(`text=${appliedCompany}`).first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${interviewingCompany}`).first()).toBeVisible({ timeout: 10000 });
  });
});
