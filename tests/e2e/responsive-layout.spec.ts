import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 14', width: 393, height: 852 },
  { name: 'iPad Mini', width: 768, height: 1024 },
  { name: 'iPad Pro', width: 1024, height: 1366 },
  { name: 'Desktop', width: 1440, height: 900 },
];

const TEST_COMPANY = 'Responsive Layout Test Co';

test.describe('Responsive layout', () => {
  let createdAppId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/applications/new');
    await page.waitForLoadState('networkidle');
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

  for (const viewport of VIEWPORTS) {
    test(`action menu button is visible and not clipped at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const page = await context.newPage();

      await page.goto('/');
      await page.waitForSelector('button[aria-label="Actions"]', {
        timeout: 15000,
      });

      // Check the first action menu button is visible and within viewport
      const actionsButton = page.locator('button[aria-label="Actions"]').first();
      await expect(actionsButton).toBeVisible();

      const box = await actionsButton.boundingBox();
      expect(box).not.toBeNull();
      // Button should be fully within the viewport (not clipped off-screen)
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
      expect(box!.y).toBeGreaterThanOrEqual(0);

      await context.close();
    });
  }

  test('no horizontal scrollbar on mobile viewport', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
    });
    const page = await context.newPage();

    await page.goto('/');
    await page.waitForSelector('button[aria-label="Actions"]', {
      timeout: 15000,
    });

    // Check that the document body does not overflow horizontally
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);

    await context.close();
  });
});
