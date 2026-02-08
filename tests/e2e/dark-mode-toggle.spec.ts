import { test, expect } from '@playwright/test';

test.describe('Dark Mode Toggle', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start with default theme
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should toggle from light mode to dark mode', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: /switch to dark mode/i });
    await expect(themeToggle).toBeVisible();

    // Verify we start in light mode
    const htmlElement = page.locator('html');
    await expect(htmlElement).not.toHaveClass(/dark/);

    // Click to toggle to dark mode
    await themeToggle.click();

    // Verify dark class is now on html element
    await expect(htmlElement).toHaveClass(/dark/);

    // Verify button now shows light mode toggle
    const lightModeToggle = page.getByRole('button', { name: /switch to light mode/i });
    await expect(lightModeToggle).toBeVisible();
  });

  test('should toggle from dark mode back to light mode', async ({ page }) => {
    // First toggle to dark mode
    const themeToggle = page.getByRole('button', { name: /switch to dark mode/i });
    await expect(themeToggle).toBeVisible();
    await themeToggle.click();

    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/dark/);

    // Now toggle back to light mode
    const lightModeToggle = page.getByRole('button', { name: /switch to light mode/i });
    await expect(lightModeToggle).toBeVisible();
    await lightModeToggle.click();

    // Verify dark class is removed
    await expect(htmlElement).not.toHaveClass(/dark/);

    // Verify button is back to dark mode toggle
    const darkModeToggle = page.getByRole('button', { name: /switch to dark mode/i });
    await expect(darkModeToggle).toBeVisible();
  });

  test('should persist dark mode preference in localStorage', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: /switch to dark mode/i });
    await themeToggle.click();

    // Verify localStorage was updated
    const storedTheme = await page.evaluate(() => localStorage.getItem('app-theme'));
    expect(storedTheme).toBe('dark');

    // Reload page and verify dark mode persists
    await page.reload();

    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/dark/);

    const lightModeToggle = page.getByRole('button', { name: /switch to light mode/i });
    await expect(lightModeToggle).toBeVisible();
  });

  test('should persist light mode preference in localStorage', async ({ page }) => {
    // Toggle to dark mode first
    const themeToggle = page.getByRole('button', { name: /switch to dark mode/i });
    await themeToggle.click();

    // Toggle back to light mode
    const lightModeToggle = page.getByRole('button', { name: /switch to light mode/i });
    await lightModeToggle.click();

    // Verify localStorage was updated
    const storedTheme = await page.evaluate(() => localStorage.getItem('app-theme'));
    expect(storedTheme).toBe('light');

    // Reload page and verify light mode persists
    await page.reload();

    const htmlElement = page.locator('html');
    await expect(htmlElement).not.toHaveClass(/dark/);

    const darkModeToggle = page.getByRole('button', { name: /switch to dark mode/i });
    await expect(darkModeToggle).toBeVisible();
  });
});
