import { test, expect } from '@playwright/test';

test.describe('Modal Input Fields', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should be able to type into Company Name input field', async ({ page }) => {
    // Click the Add Application button
    await page.click('button:has-text("Add Application")');

    // Wait for modal to be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Find the Company Name input and try to type
    const companyNameInput = page.locator('input[name="companyName"]');
    await expect(companyNameInput).toBeVisible();

    // Clear any existing value and type
    await companyNameInput.fill('');
    await companyNameInput.type('Test Company');

    // Verify the value was entered
    await expect(companyNameInput).toHaveValue('Test Company');
  });

  test('should be able to type into Position Title input field', async ({ page }) => {
    await page.click('button:has-text("Add Application")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const positionInput = page.locator('input[name="positionTitle"]');
    await expect(positionInput).toBeVisible();

    await positionInput.fill('Software Engineer');
    await expect(positionInput).toHaveValue('Software Engineer');
  });

  test('should be able to type into URL fields', async ({ page }) => {
    await page.click('button:has-text("Add Application")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const companyUrlInput = page.locator('input[name="companyUrl"]');
    await companyUrlInput.fill('https://example.com');
    await expect(companyUrlInput).toHaveValue('https://example.com');

    const jobPostingUrlInput = page.locator('input[name="jobPostingUrl"]');
    await jobPostingUrlInput.fill('https://linkedin.com/jobs/123');
    await expect(jobPostingUrlInput).toHaveValue('https://linkedin.com/jobs/123');
  });

  test('should maintain focus in input field while typing', async ({ page }) => {
    await page.click('button:has-text("Add Application")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const companyNameInput = page.locator('input[name="companyName"]');
    await companyNameInput.click();

    // Type character by character to test if focus is maintained
    await page.keyboard.type('Test');

    // Verify focus is still on the input
    await expect(companyNameInput).toBeFocused();
    await expect(companyNameInput).toHaveValue('Test');
  });

  test('should be able to use select dropdowns', async ({ page }) => {
    await page.click('button:has-text("Add Application")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const categorySelect = page.locator('select[name="companyCategory"]');
    await categorySelect.selectOption({ value: 'enterprise-software' });
    await expect(categorySelect).toHaveValue('enterprise-software');
  });

  test('should be able to toggle checkbox', async ({ page }) => {
    await page.click('button:has-text("Add Application")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const coverLetterCheckbox = page.locator('input[name="coverLetterRequired"]');
    await expect(coverLetterCheckbox).not.toBeChecked();

    await coverLetterCheckbox.click();
    await expect(coverLetterCheckbox).toBeChecked();
  });

  test('should be able to type into textarea fields', async ({ page }) => {
    await page.click('button:has-text("Add Application")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const notesTextarea = page.locator('textarea[name="notes"]');
    await notesTextarea.fill('These are my notes about the application.');
    await expect(notesTextarea).toHaveValue('These are my notes about the application.');
  });

  test('should be able to fill and submit the form', async ({ page }) => {
    await page.click('button:has-text("Add Application")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Fill required fields
    await page.locator('input[name="companyName"]').fill('Acme Corporation');
    await page.locator('input[name="positionTitle"]').fill('Senior Developer');

    // Submit the form
    await page.click('button:has-text("Add Application"):visible >> nth=-1');

    // Modal should close after successful submission
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Application should appear in the list
    await expect(page.getByText('Acme Corporation')).toBeVisible();
  });

  test('should close modal on Escape key', async ({ page }) => {
    await page.click('button:has-text("Add Application")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should close modal on backdrop click', async ({ page }) => {
    await page.click('button:has-text("Add Application")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Click the backdrop (the fixed overlay behind the modal content)
    // The backdrop is the first fixed div with bg-black/bg-opacity-50
    await page.locator('.fixed.inset-0.bg-black.bg-opacity-50').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('input fields should not lose focus unexpectedly', async ({ page }) => {
    await page.click('button:has-text("Add Application")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const companyNameInput = page.locator('input[name="companyName"]');

    // Click to focus
    await companyNameInput.click();
    await expect(companyNameInput).toBeFocused();

    // Wait a moment and verify focus is maintained
    await page.waitForTimeout(100);
    await expect(companyNameInput).toBeFocused();

    // Type and verify focus is still maintained
    await page.keyboard.type('A');
    await expect(companyNameInput).toBeFocused();
    await expect(companyNameInput).toHaveValue('A');
  });

  test('should trap focus within modal with Tab key', async ({ page }) => {
    await page.click('button:has-text("Add Application")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Get all focusable elements count
    const focusableCount = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]')?.closest('.relative');
      if (!modal) return 0;
      return modal.querySelectorAll(
        'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'
      ).length;
    });

    // Tab through all elements multiple times to test focus trap
    for (let i = 0; i < focusableCount + 2; i++) {
      await page.keyboard.press('Tab');
    }

    // Focus should still be within the modal
    const isFocusInModal = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]');
      return modal?.contains(document.activeElement);
    });

    expect(isFocusInModal).toBe(true);
  });

  test('numeric inputs should accept numbers', async ({ page }) => {
    await page.click('button:has-text("Add Application")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const salaryMinInput = page.locator('input[name="salaryMin"]');
    await salaryMinInput.fill('100000');
    await expect(salaryMinInput).toHaveValue('100000');

    const salaryMaxInput = page.locator('input[name="salaryMax"]');
    await salaryMaxInput.fill('150000');
    await expect(salaryMaxInput).toHaveValue('150000');
  });

  test('date input should accept date values', async ({ page }) => {
    await page.click('button:has-text("Add Application")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const dateInput = page.locator('input[name="dateApplied"]');
    await dateInput.fill('2024-01-15');
    await expect(dateInput).toHaveValue('2024-01-15');
  });
});
