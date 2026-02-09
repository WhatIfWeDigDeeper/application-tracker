import { test, expect } from '@playwright/test';

test.describe('Application CRUD - Inline Edit', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the list page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('h1', { timeout: 10000 });
  });

  test('should navigate to /applications/new when clicking Add Application', async ({ page }) => {
    await page.click('button:has-text("Add Application")');
    await expect(page).toHaveURL('/applications/new');
    // Should see the form with empty fields
    await expect(page.locator('input[placeholder="Company Name *"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Position Title *"]')).toBeVisible();
  });

  test('should show validation errors for required fields', async ({ page }) => {
    await page.goto('/applications/new');
    await page.waitForLoadState('domcontentloaded');

    // Click save without filling required fields
    await page.click('button:has-text("Create Application")');

    // Should show validation errors
    await expect(page.locator('text=Company name is required')).toBeVisible();
    await expect(page.locator('text=Position title is required')).toBeVisible();
  });

  test('should create an application and redirect to edit page', async ({ page }) => {
    await page.goto('/applications/new');
    await page.waitForLoadState('domcontentloaded');

    // Fill in required fields
    await page.fill('input[placeholder="Company Name *"]', 'E2E Test Company');
    await page.fill('input[placeholder="Position Title *"]', 'Senior Engineer');

    // Click save
    await page.click('button:has-text("Create Application")');

    // Should redirect to /applications/:id
    await page.waitForURL(/\/applications\/[a-f0-9-]+$/);

    // Verify data is loaded on the edit page
    const companyInput = page.locator('input[placeholder="Company Name *"]');
    await expect(companyInput).toHaveValue('E2E Test Company');

    const positionInput = page.locator('input[placeholder="Position Title *"]');
    await expect(positionInput).toHaveValue('Senior Engineer');
  });

  test('should edit an existing application', async ({ page }) => {
    // First create an application
    await page.goto('/applications/new');
    await page.waitForLoadState('domcontentloaded');
    await page.fill('input[placeholder="Company Name *"]', 'Edit Test Company');
    await page.fill('input[placeholder="Position Title *"]', 'Developer');
    await page.click('button:has-text("Create Application")');
    await page.waitForURL(/\/applications\/[a-f0-9-]+$/);

    // Now modify the company name
    const companyInput = page.locator('input[placeholder="Company Name *"]');
    await companyInput.clear();
    await companyInput.fill('Updated Company Name');

    // Save changes
    await page.click('button:has-text("Save Changes")');

    // Navigate away and back to verify persistence
    await page.click('text=Back to List');
    await page.waitForURL('/');

    // Find and click the updated application
    await page.click('text=Updated Company Name');
    await page.waitForURL(/\/applications\/[a-f0-9-]+$/);

    // Verify the change persisted
    await expect(page.locator('input[placeholder="Company Name *"]')).toHaveValue('Updated Company Name');
  });

  test('should discard changes in edit mode', async ({ page }) => {
    // First create an application
    await page.goto('/applications/new');
    await page.waitForLoadState('domcontentloaded');
    await page.fill('input[placeholder="Company Name *"]', 'Discard Test Company');
    await page.fill('input[placeholder="Position Title *"]', 'Tester');
    await page.click('button:has-text("Create Application")');
    await page.waitForURL(/\/applications\/[a-f0-9-]+$/);

    // Modify the company name
    const companyInput = page.locator('input[placeholder="Company Name *"]');
    await companyInput.clear();
    await companyInput.fill('This Should Be Discarded');

    // Click Discard
    await page.click('button:has-text("Discard")');

    // Confirm discard in the dialog
    await page.click('button:has-text("Discard"):last-of-type');

    // Should revert to original value
    await expect(page.locator('input[placeholder="Company Name *"]')).toHaveValue('Discard Test Company');
  });

  test('should create application with interview stages', async ({ page }) => {
    await page.goto('/applications/new');
    await page.waitForLoadState('domcontentloaded');

    // Fill required fields
    await page.fill('input[placeholder="Company Name *"]', 'Stages Test Company');
    await page.fill('input[placeholder="Position Title *"]', 'Engineer');

    // Add an interview stage
    await page.click('button:has-text("Add Stage")');
    await page.fill('input[placeholder="Phone Screen, Technical Interview..."]', 'Phone Screen');
    await page.click('button:has-text("Add Stage"):not(:has-text("Add Stage"))');
    // The form has an "Add Stage" submit button
    await page.locator('form button:has-text("Add Stage")').click();

    // Verify stage appears in the list
    await expect(page.locator('text=Phone Screen')).toBeVisible();

    // Save the application
    await page.click('button:has-text("Create Application")');
    await page.waitForURL(/\/applications\/[a-f0-9-]+$/);

    // Verify stages persisted
    await expect(page.locator('text=Phone Screen')).toBeVisible();
  });

  test('should delete an application', async ({ page }) => {
    // First create an application
    await page.goto('/applications/new');
    await page.waitForLoadState('domcontentloaded');
    await page.fill('input[placeholder="Company Name *"]', 'Delete Test Company');
    await page.fill('input[placeholder="Position Title *"]', 'To Be Deleted');
    await page.click('button:has-text("Create Application")');
    await page.waitForURL(/\/applications\/[a-f0-9-]+$/);

    // Click Delete
    await page.click('button:has-text("Delete")');

    // Confirm deletion
    await page.click('button:has-text("Delete"):last-of-type');

    // Should redirect to list
    await page.waitForURL('/');

    // The deleted application should not appear
    await expect(page.locator('text=Delete Test Company')).not.toBeVisible();
  });

  test('should show Back to List link and navigate correctly', async ({ page }) => {
    await page.goto('/applications/new');
    await page.waitForLoadState('domcontentloaded');

    await page.click('text=Back to List');
    await expect(page).toHaveURL('/');
  });

  test('should default to today date and Applied status on create', async ({ page }) => {
    await page.goto('/applications/new');
    await page.waitForLoadState('domcontentloaded');

    const today = new Date().toISOString().split('T')[0];
    const dateInput = page.locator('#dateApplied');
    await expect(dateInput).toHaveValue(today);

    const statusSelect = page.locator('#status');
    await expect(statusSelect).toHaveValue('applied');
  });

  test('should show Offer Due Date only when status is given offer', async ({ page }) => {
    await page.goto('/applications/new');
    await page.waitForLoadState('domcontentloaded');

    // Offer Due Date should not be visible by default
    await expect(page.locator('#offerDueDate')).not.toBeVisible();

    // Change status to "given offer"
    await page.selectOption('#status', 'given offer');

    // Now Offer Due Date should appear
    await expect(page.locator('#offerDueDate')).toBeVisible();
  });
});
