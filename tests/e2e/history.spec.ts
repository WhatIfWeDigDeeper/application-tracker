import { test, expect, type Page } from '@playwright/test';

// Shared history tests for all stacks with history support:
// Next.js+Express (port 3000), React+Koa (port 3010), Vue+Nuxt (port 3020), Svelte+Hono (port 3030).

test.describe.serial('History Panel', () => {
  let applicationUrl: string;
  const uniqueCompany = `History Co ${Date.now()}`;
  const uniquePosition = `Engineer ${Date.now()}`;

  const panel = (page: Page): ReturnType<Page['locator']> => page.locator('.fixed.inset-y-0.right-0');
  const entries = (page: Page): ReturnType<Page['locator']> => panel(page).locator('.space-y-1 > div');

  async function createApplication(page: Page, company: string, position: string): Promise<string> {
    await page.goto('/applications/new');
    await page.waitForLoadState('domcontentloaded');
    await page.fill('input[placeholder="Company Name *"]', company);
    await page.fill('input[placeholder="Position Title *"]', position);
    await page.click('button:has-text("Create Application")');
    await page.waitForURL(/\/applications\/[a-f0-9-]+$/);
    return page.url();
  }

  async function editAndSave(page: Page, selector: string, newValue: string): Promise<void> {
    const input = page.locator(selector);
    await input.clear();
    await input.fill(newValue);
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator('button:has-text("Save Changes")')).toBeDisabled({ timeout: 10000 });
  }

  async function openHistory(page: Page): Promise<void> {
    await page.click('button:has-text("History")');
    await expect(panel(page).locator('h2:has-text("History")')).toBeVisible({ timeout: 5000 });
  }

  async function closeHistory(page: Page): Promise<void> {
    // Close button is the first button in the panel header (XMarkIcon / SVG)
    await panel(page).locator('button').first().click();
    await expect(panel(page)).not.toBeVisible({ timeout: 5000 });
  }

  test('should show creation event in history for a new app', async ({ page }) => {
    applicationUrl = await createApplication(page, uniqueCompany, uniquePosition);

    await openHistory(page);

    await expect(panel(page).locator('text=Created application')).toBeVisible({ timeout: 5000 });
    await expect(panel(page).locator('text=(current)')).toBeVisible();

    await closeHistory(page);
  });

  test('should show new history entry after edit and save', async ({ page }) => {
    await page.goto(applicationUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('input[placeholder="Company Name *"]', { timeout: 10000 });

    await editAndSave(page, 'input[placeholder="Company Name *"]', `${uniqueCompany} Updated`);

    await openHistory(page);

    // The newest entry should contain "Updated" and be marked (current)
    const newestEntry = entries(page).first();
    await expect(newestEntry).toContainText(/Updated/, { timeout: 5000 });
    await expect(newestEntry).toContainText('(current)');

    // The creation event should still be visible
    await expect(panel(page).locator('text=Created application')).toBeVisible();

    // Should have 2 entries total
    await expect(entries(page)).toHaveCount(2);

    await closeHistory(page);
  });

  test('should expand an entry to show field change diff', async ({ page }) => {
    await page.goto(applicationUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('input[placeholder="Company Name *"]', { timeout: 10000 });

    await openHistory(page);

    // Click the newest entry (the edit) to expand it
    const newestEntry = entries(page).first();
    await newestEntry.locator('button').first().click();

    // Both Vue EventDiff and Svelte FieldDiff render "Company Name:" with a colon
    await expect(panel(page).locator('text=Company Name:')).toBeVisible({ timeout: 3000 });
    // Old value shown with strikethrough
    await expect(panel(page).locator('.line-through')).toBeVisible();
    // New value shown in green
    await expect(panel(page).locator('.text-green-600')).toBeVisible();

    await closeHistory(page);
  });

  test('should restore to a previous version and update the form', async ({ page }) => {
    await page.goto(applicationUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('input[placeholder="Company Name *"]', { timeout: 10000 });

    // Make a second edit (position title) so we have something to restore past
    await editAndSave(page, 'input[placeholder="Position Title *"]', `${uniquePosition} Senior`);
    await expect(page.locator('input[placeholder="Position Title *"]')).toHaveValue(`${uniquePosition} Senior`);

    await openHistory(page);

    // Should have 3 entries: 2nd edit (current), 1st edit, creation
    await expect(entries(page)).toHaveCount(3, { timeout: 5000 });

    // Expand the second entry (the first edit, not current)
    const secondEntry = entries(page).nth(1);
    await secondEntry.locator('button').first().click();

    // Click "Restore to this point"
    const restoreButton = panel(page).locator('button:has-text("Restore to this point")');
    await expect(restoreButton).toBeVisible({ timeout: 3000 });
    await restoreButton.click();

    // After restore, position title should revert (the 2nd edit was after the restore point)
    await expect(page.locator('input[placeholder="Position Title *"]')).toHaveValue(uniquePosition, { timeout: 10000 });
    // Company name should still be the updated value (the restore point is AFTER the 1st edit)
    await expect(page.locator('input[placeholder="Company Name *"]')).toHaveValue(`${uniqueCompany} Updated`);
  });

  test('should show "Restored to version" after restore', async ({ page }) => {
    await page.goto(applicationUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('input[placeholder="Company Name *"]', { timeout: 10000 });

    await openHistory(page);

    const newestEntry = entries(page).first();
    await expect(newestEntry).toContainText('Restored to version', { timeout: 5000 });
    await expect(newestEntry).toContainText('(current)');

    await closeHistory(page);
  });

  test('should open and close the history panel', async ({ page }) => {
    await page.goto(applicationUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('input[placeholder="Company Name *"]', { timeout: 10000 });

    // Panel should not be visible initially
    await expect(panel(page)).not.toBeVisible();

    await openHistory(page);
    await expect(panel(page)).toBeVisible();

    await closeHistory(page);
    await expect(panel(page)).not.toBeVisible();
  });

  test.afterAll(async ({ browser }) => {
    if (!applicationUrl) return;
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(applicationUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('input[placeholder="Company Name *"]', { timeout: 10000 });
    await page.click('button:has-text("Delete")');
    await page.locator('button:has-text("Delete")').last().click();
    await page.waitForURL('/');
    await context.close();
  });
});
