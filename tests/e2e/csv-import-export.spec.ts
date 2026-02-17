import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

// CSV import/export tests only run for tanstack-ui (port 3050)
const port = Number(process.env.TEST_UI_PORT || 3000);
const isTargetUI = port === 3050;

test.describe('CSV Import/Export', () => {
  test.skip(!isTargetUI, 'CSV import/export only available on tanstack-ui (port 3050)');

  const tmpDir = '/tmp/claude/e2e-csv-tests';

  test.beforeAll(() => {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('h1', { timeout: 10000 });
  });

  test('should show Import CSV, Export CSV, and Template buttons', async ({ page }) => {
    await expect(page.locator('button:has-text("Import CSV")')).toBeVisible();
    await expect(page.locator('a:has-text("Export CSV")')).toBeVisible();
    await expect(page.locator('a:has-text("Template")')).toBeVisible();
  });

  test('should download sample template CSV', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('a:has-text("Template")').click(),
    ]);

    expect(download.suggestedFilename()).toBe('applications-template.csv');
    const filePath = path.join(tmpDir, 'template.csv');
    await download.saveAs(filePath);

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    expect(lines.length).toBeGreaterThanOrEqual(2);

    const headers = lines[0].split(',');
    expect(headers.length).toBe(16);
    expect(headers[0]).toBe('companyName');
    expect(headers[1]).toBe('positionTitle');
  });

  test('should open import modal and show file input', async ({ page }) => {
    await page.click('button:has-text("Import CSV")');
    await expect(page.getByRole('heading', { name: 'Import Applications' })).toBeVisible();
    await expect(page.locator('input[type="file"]')).toBeVisible();
    await expect(page.locator('a:has-text("Download template")')).toBeVisible();
  });

  test('should import a valid CSV file and show results', async ({ page }) => {
    const csv = [
      'companyName,positionTitle,dateApplied,status,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,coverLetterRequired,specialRequirements,salaryMin,salaryMax,notes,offerDueDate',
      'E2E Import Corp,E2E Developer,2026-02-10,applied,,,,,,,,,,,,'
    ].join('\n');

    const csvPath = path.join(tmpDir, 'import-test.csv');
    fs.writeFileSync(csvPath, csv);

    await page.click('button:has-text("Import CSV")');
    await expect(page.getByRole('heading', { name: 'Import Applications' })).toBeVisible();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvPath);

    await page.click('button:has-text("Import"):not(:has-text("CSV"))');

    // Wait for results to appear
    await expect(page.locator('text=Imported')).toBeVisible({ timeout: 10000 });

    // Check result counts
    const importedCount = page.locator('text=Imported').locator('..');
    await expect(importedCount).toContainText('1');

    // Close the modal
    await page.click('button:has-text("Close")');

    // Verify the imported application appears in the list
    await expect(page.locator('text=E2E Import Corp').first()).toBeVisible({ timeout: 5000 });
  });

  test('should export CSV with current applications', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('a:has-text("Export CSV")').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^applications-\d{4}-\d{2}-\d{2}\.csv$/);
    const filePath = path.join(tmpDir, 'export.csv');
    await download.saveAs(filePath);

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    expect(lines.length).toBeGreaterThanOrEqual(1); // At least headers

    const headers = lines[0].split(',');
    expect(headers.length).toBe(16);
  });

  test('should show errors for invalid CSV rows', async ({ page }) => {
    const csv = [
      'companyName,positionTitle,dateApplied,status,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,coverLetterRequired,specialRequirements,salaryMin,salaryMax,notes,offerDueDate',
      ',Missing Company,,,,,,,,,,,,,,',
      'Valid E2E Corp,Valid Role,,,,,,,,,,,,,,'
    ].join('\n');

    const csvPath = path.join(tmpDir, 'errors-test.csv');
    fs.writeFileSync(csvPath, csv);

    await page.click('button:has-text("Import CSV")');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvPath);
    await page.click('button:has-text("Import"):not(:has-text("CSV"))');

    await expect(page.locator('text=Imported')).toBeVisible({ timeout: 10000 });

    // Should show 1 imported, 1 error
    const importedSection = page.locator('text=Imported').locator('..');
    await expect(importedSection).toContainText('1');

    const errorsSection = page.locator('text=Errors').locator('..');
    await expect(errorsSection).toContainText('1');

    // Should show error row details
    await expect(page.locator('text=Row 2')).toBeVisible();

    await page.click('button:has-text("Close")');
  });

  test('should show skipped count for duplicate URLs', async ({ page }) => {
    // Import a CSV with a unique URL
    const csv1 = [
      'companyName,positionTitle,dateApplied,status,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,coverLetterRequired,specialRequirements,salaryMin,salaryMax,notes,offerDueDate',
      'Dedup E2E Corp,Dedup Role,,,,https://e2e-dedup-test-unique.com/jobs/1,,,,,,,,,,'
    ].join('\n');

    const csvPath1 = path.join(tmpDir, 'dedup-test1.csv');
    fs.writeFileSync(csvPath1, csv1);

    // First import
    await page.click('button:has-text("Import CSV")');
    const fileInput1 = page.locator('input[type="file"]');
    await fileInput1.setInputFiles(csvPath1);
    await page.click('button:has-text("Import"):not(:has-text("CSV"))');
    await expect(page.locator('text=Imported')).toBeVisible({ timeout: 10000 });
    await page.click('button:has-text("Close")');

    // Second import with same URL — should be skipped
    await page.click('button:has-text("Import CSV")');
    const fileInput2 = page.locator('input[type="file"]');
    await fileInput2.setInputFiles(csvPath1);
    await page.click('button:has-text("Import"):not(:has-text("CSV"))');
    await expect(page.locator('text=Skipped')).toBeVisible({ timeout: 10000 });

    const skippedSection = page.locator('text=Skipped').locator('..');
    await expect(skippedSection).toContainText('1');

    await page.click('button:has-text("Close")');
  });

  // Clean up all E2E-created applications via the API
  const e2eCompanyNames = ['E2E Import Corp', 'Valid E2E Corp', 'Dedup E2E Corp'];

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Fetch all applications and find the ones created by these tests
    const response = await page.request.get('/api/applications?limit=100');
    if (!response.ok()) {
      await context.close();
      return;
    }

    const body = await response.json();
    const applications = Array.isArray(body) ? body : body.items ?? [];
    for (const app of applications) {
      if (e2eCompanyNames.includes(app.companyName)) {
        await page.request.delete(`/api/applications/${app.id}`);
      }
    }

    await context.close();
  });
});
