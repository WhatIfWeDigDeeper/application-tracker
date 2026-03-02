import { test, expect } from '@playwright/test';

const TEST_COMPANY = 'Action Menu Test Co';

test.describe('Action Menu - Card interactions', () => {
  let createdAppId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/applications/new');
    await page.waitForLoadState('domcontentloaded');
    await page.fill('input[placeholder="Company Name *"]', TEST_COMPANY);
    await page.fill('input[placeholder="Position Title *"]', 'Test Engineer');
    await page.selectOption('#status', 'applied');
    await page.click('button:has-text("Create Application")');
    await page.waitForURL(/\/applications\/([a-f0-9-]+)$/);
    const match = page.url().match(/\/applications\/([a-f0-9-]+)$/);
    createdAppId = match![1];
    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    if (!createdAppId) return;
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.request.delete(`/api/applications/${createdAppId}`);
    await context.close();
  });

  test('clicking actions menu button should open menu and not navigate away from list', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('h1', { timeout: 10000 });

    // Find the actions button on any card
    const actionsButton = page.locator('button[aria-label="Actions"]').first();
    await expect(actionsButton).toBeVisible({ timeout: 10000 });

    // Click the actions button
    await actionsButton.click();

    // Should still be on the list page (URL should be /)
    await expect(page).toHaveURL('/');

    // The dropdown menu should be visible with Archive and Delete buttons
    // Use button role to avoid matching the "Show archived" filter label
    const archiveBtn = page.locator('button:has-text("Archive")').first();
    const deleteBtn = page.locator('button:has-text("Delete")').first();
    await expect(archiveBtn).toBeVisible({ timeout: 3000 });
    await expect(deleteBtn).toBeVisible({ timeout: 3000 });

    // Verify we're still on the list page after the menu opened
    await expect(page).toHaveURL('/');
  });

  test('action menu dropdown should not be clipped by the table overflow container', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('h1', { timeout: 10000 });
    const actionsButton = page.locator('button[aria-label="Actions"]').first();
    await expect(actionsButton).toBeVisible({ timeout: 10000 });
    await actionsButton.click();

    const dropdown = page.locator('[data-menu-dropdown]').first();
    await expect(dropdown).toBeVisible({ timeout: 3000 });

    const box = await dropdown.boundingBox();
    expect(box).not.toBeNull();

    const viewportSize = page.viewportSize();
    expect(viewportSize).not.toBeNull();

    // Dropdown must be fully within the viewport — if clipped by overflow-x-auto
    // it would have zero or negative dimensions, or be positioned off-screen
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewportSize!.width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewportSize!.height);
  });
});
