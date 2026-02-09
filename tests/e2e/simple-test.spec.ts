import { test, expect } from '@playwright/test';

test('should load the home page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Application Tracker/i);
});

test('should display the main heading and add button', async ({ page }) => {
  await page.goto('/');

  // The add application button should be visible
  await expect(
    page.getByRole('button', { name: /Add Application/i })
  ).toBeVisible();
});
