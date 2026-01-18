import { test, expect } from '@playwright/test';

test.describe('Modal Input Debug', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('debug: check if inputs receive keypresses', async ({ page }) => {
    // Open modal
    await page.click('button:has-text("Add Application")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Wait a bit for any effects to settle
    await page.waitForTimeout(500);

    const companyNameInput = page.locator('input[name="companyName"]');

    // Log focus state before clicking
    const focusBefore = await page.evaluate(() => document.activeElement?.tagName);
    console.log('Active element before click:', focusBefore);

    // Click on the input
    await companyNameInput.click();

    // Log focus state after clicking
    const focusAfter = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tagName: el?.tagName,
        name: (el as HTMLInputElement)?.name,
        id: el?.id,
      };
    });
    console.log('Active element after click:', focusAfter);

    // Try pressing keys one at a time
    await page.keyboard.press('T');
    const valueAfterT = await companyNameInput.inputValue();
    console.log('Value after T:', valueAfterT);

    await page.keyboard.press('e');
    const valueAfterE = await companyNameInput.inputValue();
    console.log('Value after e:', valueAfterE);

    await page.keyboard.press('s');
    const valueAfterS = await companyNameInput.inputValue();
    console.log('Value after s:', valueAfterS);

    await page.keyboard.press('t');
    const valueAfterFinalT = await companyNameInput.inputValue();
    console.log('Value after final t:', valueAfterFinalT);

    // Verify
    expect(valueAfterFinalT).toBe('Test');
  });

  test('debug: test focus after useEffect runs', async ({ page }) => {
    await page.click('button:has-text("Add Application")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Wait for any useEffect to complete
    await page.waitForTimeout(200);

    // Check what element has focus
    const activeElementInfo = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tagName: el?.tagName,
        className: el?.className,
        name: (el as HTMLInputElement)?.name,
      };
    });
    console.log('Initially focused element:', activeElementInfo);

    // Click on company name input
    const companyNameInput = page.locator('input[name="companyName"]');
    await companyNameInput.click();

    // Verify it has focus
    await expect(companyNameInput).toBeFocused();

    // Wait and check if focus was stolen
    await page.waitForTimeout(500);
    const afterWaitInfo = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tagName: el?.tagName,
        name: (el as HTMLInputElement)?.name,
      };
    });
    console.log('Active element after 500ms wait:', afterWaitInfo);

    // It should still be focused on the input
    await expect(companyNameInput).toBeFocused();
  });

  test('debug: check if form change handlers work', async ({ page }) => {
    await page.click('button:has-text("Add Application")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const companyNameInput = page.locator('input[name="companyName"]');

    // Use fill which is more reliable
    await companyNameInput.fill('Test Company');

    const value = await companyNameInput.inputValue();
    console.log('Final value:', value);

    expect(value).toBe('Test Company');
  });

  test('debug: simulate real user typing with delays', async ({ page }) => {
    await page.click('button:has-text("Add Application")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const companyNameInput = page.locator('input[name="companyName"]');
    await companyNameInput.click();

    // Type slowly like a real user
    await companyNameInput.pressSequentially('Test', { delay: 100 });

    const value = await companyNameInput.inputValue();
    console.log('Value after slow typing:', value);

    expect(value).toBe('Test');
  });
});
