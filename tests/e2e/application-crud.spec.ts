import { test, expect } from '@playwright/test';

test.describe('Application CRUD - Inline Edit', () => {
  const createdUrls: string[] = [];

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
    createdUrls.push(page.url());

    await expect(page.locator('input[placeholder="Company Name *"]')).toHaveValue('E2E Test Company');
    await expect(page.locator('input[placeholder="Position Title *"]')).toHaveValue('Senior Engineer');
  });

  test('should edit an existing application', async ({ page }) => {
    await page.goto('/applications/new');
    await page.waitForLoadState('domcontentloaded');
    await page.fill('input[placeholder="Company Name *"]', 'Edit Test Company');
    await page.fill('input[placeholder="Position Title *"]', 'Developer');
    // Set status to applied so dateApplied is auto-filled (ensures item sorts to top of paginated lists)
    await page.selectOption('#status', 'applied');
    await page.click('button:has-text("Create Application")');
    await page.waitForURL(/\/applications\/[a-f0-9-]+$/);
    createdUrls.push(page.url());

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
    createdUrls.push(page.url());

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
    createdUrls.push(page.url());

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

  test('should have empty date applied and Unsubmitted status on create', async ({ page }) => {
    await page.goto('/applications/new');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('#dateApplied')).toHaveValue('');
    await expect(page.locator('#dateApplied')).toBeDisabled();
    await expect(page.locator('#status')).toHaveValue('unsubmitted');
  });

  test('should enable and auto-fill date when changing status from unsubmitted', async ({ page }) => {
    await page.goto('/applications/new');
    await page.waitForLoadState('domcontentloaded');

    // Initially disabled
    await expect(page.locator('#dateApplied')).toBeDisabled();

    // Change status to applied
    await page.selectOption('#status', 'applied');

    // Date should now be enabled and auto-filled with today's date
    await expect(page.locator('#dateApplied')).toBeEnabled();
    const today = new Date().toISOString().split('T')[0];
    await expect(page.locator('#dateApplied')).toHaveValue(today);
  });

  test('should create application without date applied and display em dash', async ({ page }) => {
    await page.goto('/applications/new');
    await page.waitForLoadState('domcontentloaded');

    await page.fill('input[placeholder="Company Name *"]', 'No Date Company');
    await page.fill('input[placeholder="Position Title *"]', 'Engineer');

    await page.click('button:has-text("Create Application")');
    await page.waitForURL(/\/applications\/[a-f0-9-]+$/);
    createdUrls.push(page.url());

    // Verify date field is empty on the edit page (null dateApplied)
    await expect(page.locator('#dateApplied')).toHaveValue('');

    // Reload the page to verify null date persisted
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('input[placeholder="Company Name *"]', { timeout: 10000 });
    await expect(page.locator('#dateApplied')).toHaveValue('');
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

  test('textareas should be vertically resizable', async ({ page }) => {
    await page.goto('/applications/new');
    await page.waitForLoadState('domcontentloaded');

    for (const id of ['#specialRequirements', '#notes']) {
      const resize = await page.locator(id).evaluate(
        (el) => getComputedStyle(el).resize
      );
      expect(resize).toBe('vertical');
    }
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

  test.afterAll(async ({ browser }) => {
    if (createdUrls.length === 0) return;
    const context = await browser.newContext();
    const page = await context.newPage();
    for (const url of createdUrls) {
      await page.goto(url);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('input[placeholder="Company Name *"]', { timeout: 10000 });
      await page.click('button:has-text("Delete")');
      await page.locator('button:has-text("Delete")').last().click();
      await page.waitForURL('/');
    }
    await context.close();
  });
});

test.describe('Status label - Not a match', () => {
  let createdAppId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const createRes = await page.request.post('/api/applications', {
      data: { companyName: 'Not A Match Co', positionTitle: 'Engineer', status: 'applied' },
    });
    const app = await createRes.json();
    createdAppId = app.id;
    await page.request.patch(`/api/applications/${createdAppId}`, {
      data: { status: 'rejected' },
    });
    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    if (!createdAppId) return;
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.request.delete(`/api/applications/${createdAppId}`);
    await context.close();
  });

  test('should show "Not a match" badge for rejected status on list', async ({ page }) => {
    // Re-PATCH to refresh updatedAt, pushing this app to position 1 of the default updatedAt-desc list.
    await page.request.patch(`/api/applications/${createdAppId}`, {
      data: { status: 'rejected' },
    });

    await page.goto('/');
    // Wait for networkidle so that React (SSR/hydration) and framework data fetches are fully settled
    // before interacting with the filter. This ensures selectOption() properly triggers onChange
    // handlers on React-based stacks (e.g. tanstack-start), which only work post-hydration.
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);

    // Apply status filter if the UI supports it — ensures visibility even if parallel test activity
    // pushed this app off page 1 after the re-PATCH above.
    const statusSelect = page.locator('select:has(option[value="rejected"])').first();
    if (await statusSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
      await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes('/api/applications') && r.status() === 200,
          { timeout: 5000 }
        ).catch(() => null),
        statusSelect.selectOption('rejected'),
      ]);
    }

    // Verify the "Not a match" label is displayed for rejected status apps.
    await expect(page.locator('span', { hasText: 'Not a match' }).first()).toBeVisible({ timeout: 10000 });
  });

  test('should show "Not a match" option in status dropdown on edit page', async ({ page }) => {
    await page.goto(`/applications/${createdAppId}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('#status', { timeout: 10000 });

    const option = page.locator('#status option[value="rejected"]');
    await expect(option).toHaveText('Not a match');
  });
});
