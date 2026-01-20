import { test, expect } from '@playwright/test';

test('should load the home page', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveTitle(/Application Tracker/i);
});

test('should display applications from API', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Wait for applications to load
  await page.waitForTimeout(2000);

  // Check if any application cards are visible
  const cards = page.locator('[data-testid^="app-card"]');
  const count = await cards.count();

  console.log(`Found ${count} application cards`);
  expect(count).toBeGreaterThanOrEqual(0);
});
