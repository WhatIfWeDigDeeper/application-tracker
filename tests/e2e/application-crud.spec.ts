import { test, expect } from '@playwright/test';

test.describe('Application CRUD - Inline Edit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('h1', { timeout: 10000 });
  });

  test('should navigate to /applications/new when clicking Add Application', async ({ page }) => {
    await page.click('button:has-text("Add Application")');
    await expect(page).toHaveURL('/applications/new');
    await expect(page.locator('input[placeholder="Company Name *"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Position Title *"]')).toBeVisible();
  });

  test('should show validation errors for required fields', async ({ page }) => {
    await page.goto('/applications/new');
    await page.waitForLoadState('domcontentloaded');

    await page.click('button:has-text("Create Application")');

    await expect(page.locator('text=Company name is required')).toBeVisible();
    await expect(page.locator('text=Position title is required')).toBeVisible();
  });

  test('should create an application and redirect to edit page', async ({ page }) => {
    await page.goto('/applications/new');
    await page.waitForLoadState('domcontentloaded');

    await page.fill('input[placeholder="Company Name *"]', 'E2E Test Company');
    await page.fill('input[placeholder="Position Title *"]', 'Senior Engineer');

    await page.click('button:has-text("Create Application")');
    await page.waitForURL(/\/applications\/[a-f0-9-]+$/);

    await expect(page.locator('input[placeholder="Company Name *"]')).toHaveValue('E2E Test Company');
    await expect(page.locator('input[placeholder="Position Title *"]')).toHaveValue('Senior Engineer');
  });

  test('should edit an existing application', async ({ page }) => {
    await page.goto('/applications/new');
    await page.waitForLoadState('domcontentloaded');
    await page.fill('input[placeholder="Company Name *"]', 'Edit Test Company');
    await page.fill('input[placeholder="Position Title *"]', 'Developer');
    await page.click('button:has-text("Create Application")');
    await page.waitForURL(/\/applications\/[a-f0-9-]+$/);

    const companyInput = page.locator('input[placeholder="Company Name *"]');
    await companyInput.clear();
    await companyInput.fill('Updated Company Name');

    await page.click('button:has-text("Save Changes")');
    // Wait for save to complete (button becomes disabled when form is clean)
    await expect(page.locator('button:has-text("Save Changes")')).toBeDisabled({ timeout: 10000 });

    await page.click('text=Back to List');
    await page.waitForURL('/');

    await page.click('text=Updated Company Name');
    await page.waitForURL(/\/applications\/[a-f0-9-]+$/);

    await expect(page.locator('input[placeholder="Company Name *"]')).toHaveValue('Updated Company Name');
  });

  test('should discard changes in edit mode', async ({ page }) => {
    await page.goto('/applications/new');
    await page.waitForLoadState('domcontentloaded');
    await page.fill('input[placeholder="Company Name *"]', 'Discard Test Company');
    await page.fill('input[placeholder="Position Title *"]', 'Tester');
    await page.click('button:has-text("Create Application")');
    await page.waitForURL(/\/applications\/[a-f0-9-]+$/);

    const companyInput = page.locator('input[placeholder="Company Name *"]');
    await companyInput.clear();
    await companyInput.fill('This Should Be Discarded');

    await page.click('button:has-text("Discard")');

    // Confirm discard in the dialog (use .last() to target the dialog's button)
    await page.locator('button:has-text("Discard")').last().click();

    await expect(page.locator('input[placeholder="Company Name *"]')).toHaveValue('Discard Test Company');
  });

  test('should create application with interview stages', async ({ page }) => {
    await page.goto('/applications/new');
    await page.waitForLoadState('domcontentloaded');

    await page.fill('input[placeholder="Company Name *"]', 'Stages Test Company');
    await page.fill('input[placeholder="Position Title *"]', 'Engineer');

    // Open the stage form
    await page.click('button:has-text("Add Stage")');
    await page.fill('input[placeholder="Phone Screen, Technical Interview..."]', 'Phone Screen');
    // Submit the stage form
    await page.locator('form button:has-text("Add Stage")').click();

    await expect(page.locator('text=Phone Screen')).toBeVisible();

    await page.click('button:has-text("Create Application")');
    await page.waitForURL(/\/applications\/[a-f0-9-]+$/);

    await expect(page.locator('text=Phone Screen')).toBeVisible();
  });

  test('should delete an application', async ({ page }) => {
    const uniqueName = `Delete Co ${Date.now()}`;
    await page.goto('/applications/new');
    await page.waitForLoadState('domcontentloaded');
    await page.fill('input[placeholder="Company Name *"]', uniqueName);
    await page.fill('input[placeholder="Position Title *"]', 'To Be Deleted');
    await page.click('button:has-text("Create Application")');
    await page.waitForURL(/\/applications\/[a-f0-9-]+$/);

    await page.click('button:has-text("Delete")');

    // Confirm deletion in the dialog (use .last() to target the dialog's button, not the header's)
    await page.locator('button:has-text("Delete")').last().click();

    await page.waitForURL('/');

    await expect(page.locator(`text=${uniqueName}`)).not.toBeVisible();
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
    await expect(page.locator('#dateApplied')).toHaveValue(today);
    await expect(page.locator('#status')).toHaveValue('applied');
  });

  test('should show Offer Due Date only when status is given offer', async ({ page }) => {
    await page.goto('/applications/new');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('#offerDueDate')).not.toBeVisible();

    await page.selectOption('#status', 'given offer');

    await expect(page.locator('#offerDueDate')).toBeVisible();
  });

  test('should accept input in URL fields', async ({ page }) => {
    await page.goto('/applications/new');
    await page.waitForLoadState('domcontentloaded');

    const companyWebsite = page.locator('input[placeholder="https://example.com"]');
    await companyWebsite.fill('https://testcompany.com');
    await expect(companyWebsite).toHaveValue('https://testcompany.com');

    const careerPage = page.locator('input[placeholder="https://example.com/careers"]');
    await careerPage.fill('https://testcompany.com/careers');
    await expect(careerPage).toHaveValue('https://testcompany.com/careers');

    const jobPosting = page.locator('input[placeholder="https://linkedin.com/jobs/..."]');
    await jobPosting.fill('https://linkedin.com/jobs/123');
    await expect(jobPosting).toHaveValue('https://linkedin.com/jobs/123');
  });

  test('should accept input in select dropdowns, checkbox, textarea, and numeric fields', async ({ page }) => {
    await page.goto('/applications/new');
    await page.waitForLoadState('domcontentloaded');

    // Select dropdowns
    await page.selectOption('#companyCategory', 'enterprise-software');
    await expect(page.locator('#companyCategory')).toHaveValue('enterprise-software');

    await page.selectOption('#jobSource', 'linkedin');
    await expect(page.locator('#jobSource')).toHaveValue('linkedin');

    // Checkbox
    const checkbox = page.getByLabel(/cover letter required/i);
    await expect(checkbox).not.toBeChecked();
    await checkbox.click();
    await expect(checkbox).toBeChecked();

    // Textareas
    await page.fill('#specialRequirements', 'Portfolio required');
    await expect(page.locator('#specialRequirements')).toHaveValue('Portfolio required');

    await page.fill('#notes', 'Test notes about the application');
    await expect(page.locator('#notes')).toHaveValue('Test notes about the application');

    // Salary numeric inputs
    await page.fill('#salaryMin', '100000');
    await expect(page.locator('#salaryMin')).toHaveValue('100000');

    await page.fill('#salaryMax', '150000');
    await expect(page.locator('#salaryMax')).toHaveValue('150000');
  });

  test('should show error when salary min exceeds max', async ({ page }) => {
    await page.goto('/applications/new');
    await page.waitForLoadState('domcontentloaded');

    await page.fill('input[placeholder="Company Name *"]', 'Salary Test Company');
    await page.fill('input[placeholder="Position Title *"]', 'Engineer');
    await page.fill('#salaryMin', '200000');
    await page.fill('#salaryMax', '100000');

    await page.click('button:has-text("Create Application")');

    await expect(page.locator('text=Minimum salary must not exceed maximum')).toBeVisible();
  });
});
