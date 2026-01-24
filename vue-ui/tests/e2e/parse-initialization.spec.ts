import { test, expect } from '@playwright/test';

test.describe('Parse SDK Initialization', () => {
  test('should initialize Parse SDK without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    // Capture console errors and warnings
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      consoleErrors.push(`Page error: ${error.message}`);
    });

    // Navigate to the app
    await page.goto('/');

    // Wait for the app to load (use domcontentloaded instead of networkidle to avoid hanging)
    await page.waitForLoadState('domcontentloaded');
    // Wait for Vue app to mount by checking for a visible element
    await page.waitForSelector('h1', { timeout: 10000 });

    // Check for Parse initialization errors
    const parseInitErrors = consoleErrors.filter(error =>
      error.includes('Parse') || error.includes('initialize')
    );

    if (parseInitErrors.length > 0) {
      console.log('\n❌ Parse initialization errors found:');
      parseInitErrors.forEach(error => console.log('  -', error));
    }

    // Check if Parse is available in the global scope
    const parseAvailable = await page.evaluate(() => {
      return typeof window !== 'undefined' && typeof (window as any).Parse !== 'undefined';
    });

    // Print diagnostic information
    console.log('\n📊 Diagnostic Information:');
    console.log('Parse available globally:', parseAvailable);
    console.log('Total console errors:', consoleErrors.length);
    console.log('Total console warnings:', consoleWarnings.length);

    if (consoleErrors.length > 0) {
      console.log('\n🔴 All console errors:');
      consoleErrors.forEach(error => console.log('  -', error));
    }

    // The test should pass if there are no Parse-related errors and Parse is available
    expect(parseInitErrors, 'Parse SDK should initialize without errors').toHaveLength(0);
    expect(parseAvailable, 'Parse should be available in the global scope').toBe(true);
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
