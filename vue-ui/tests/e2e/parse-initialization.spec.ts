import { test, expect } from '@playwright/test';

test.describe('Application Initialization', () => {
  test('should load without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      consoleErrors.push(`Page error: ${error.message}`);
    });

    // Navigate to the app
    await page.goto('/');

    // Wait for the app to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('h1', { timeout: 10000 });

    // Print diagnostic information
    if (consoleErrors.length > 0) {
      console.log('\nAll console errors:');
      consoleErrors.forEach(error => console.log('  -', error));
    }

    // Filter out expected errors (e.g., API not running during tests)
    const unexpectedErrors = consoleErrors.filter(error =>
      !error.includes('Failed to fetch') && !error.includes('NetworkError')
    );

    expect(unexpectedErrors, 'Should have no unexpected console errors').toHaveLength(0);
  });

  test('should load the application list page', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('h1', { timeout: 10000 });

    // Check if the page title is correct
    await expect(page).toHaveTitle(/Job Application Tracker/);
  });
});
