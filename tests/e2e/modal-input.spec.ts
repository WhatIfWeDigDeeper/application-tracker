import { test, expect } from '@playwright/test';

test.describe('Modal Input Fields', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  async function openAddModal(page: import('@playwright/test').Page) {
    await page.getByRole('button', { name: /Add Application/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
  }

  test('should be able to type into Company Name input field', async ({ page }) => {
    await openAddModal(page);

    const companyNameInput = page.getByLabel('Company Name');
    await expect(companyNameInput).toBeVisible();

    await companyNameInput.fill('');
    await companyNameInput.pressSequentially('Test Company');

    await expect(companyNameInput).toHaveValue('Test Company');
  });

  test('should be able to type into Position Title input field', async ({ page }) => {
    await openAddModal(page);

    const positionInput = page.getByLabel('Position Title');
    await expect(positionInput).toBeVisible();

    await positionInput.fill('Software Engineer');
    await expect(positionInput).toHaveValue('Software Engineer');
  });

  test('should be able to type into URL fields', async ({ page }) => {
    await openAddModal(page);

    const companyUrlInput = page.getByLabel('Company Website');
    await companyUrlInput.fill('https://example.com');
    await expect(companyUrlInput).toHaveValue('https://example.com');

    const jobPostingUrlInput = page.getByLabel('Job Posting URL');
    await jobPostingUrlInput.fill('https://linkedin.com/jobs/123');
    await expect(jobPostingUrlInput).toHaveValue('https://linkedin.com/jobs/123');
  });

  test('should maintain focus in input field while typing', async ({ page }) => {
    await openAddModal(page);

    const companyNameInput = page.getByLabel('Company Name');
    await companyNameInput.click();

    await page.keyboard.type('Test');

    await expect(companyNameInput).toBeFocused();
    await expect(companyNameInput).toHaveValue('Test');
  });

  test('should be able to use select dropdowns', async ({ page }) => {
    await openAddModal(page);

    const categorySelect = page.getByLabel('Company Category');
    await categorySelect.selectOption({ value: 'enterprise-software' });
    await expect(categorySelect).toHaveValue('enterprise-software');
  });

  test('should be able to toggle checkbox', async ({ page }) => {
    await openAddModal(page);

    const coverLetterCheckbox = page.getByLabel(/cover letter required/i);
    await expect(coverLetterCheckbox).not.toBeChecked();

    await coverLetterCheckbox.click();
    await expect(coverLetterCheckbox).toBeChecked();
  });

  test('should be able to type into textarea fields', async ({ page }) => {
    await openAddModal(page);

    const notesTextarea = page.getByLabel('General Notes');
    await notesTextarea.fill('These are my notes about the application.');
    await expect(notesTextarea).toHaveValue('These are my notes about the application.');
  });

  test('should be able to fill and submit the form', async ({ page }) => {
    await openAddModal(page);

    await page.getByLabel('Company Name').fill('Acme Corporation');
    await page.getByLabel('Position Title').fill('Senior Developer');

    // Click the submit button inside the dialog
    await page.getByRole('dialog').getByRole('button', { name: /Add Application/i }).click();

    // Modal should close after successful submission
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Application should appear in the list
    await expect(
      page.getByRole('heading', { name: 'Acme Corporation' }).first()
    ).toBeVisible();
  });

  test('should close modal on Escape key', async ({ page }) => {
    await openAddModal(page);

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('input fields should not lose focus unexpectedly', async ({ page }) => {
    await openAddModal(page);

    const companyNameInput = page.getByLabel('Company Name');

    await companyNameInput.click();
    await expect(companyNameInput).toBeFocused();

    await page.waitForTimeout(100);
    await expect(companyNameInput).toBeFocused();

    await page.keyboard.type('A');
    await expect(companyNameInput).toBeFocused();
    await expect(companyNameInput).toHaveValue('A');
  });

  test('numeric inputs should accept numbers', async ({ page }) => {
    await openAddModal(page);

    const salaryMinInput = page.getByLabel('Minimum Salary');
    await salaryMinInput.fill('100000');
    await expect(salaryMinInput).toHaveValue('100000');

    const salaryMaxInput = page.getByLabel('Maximum Salary');
    await salaryMaxInput.fill('150000');
    await expect(salaryMaxInput).toHaveValue('150000');
  });

  test('date input should accept date values', async ({ page }) => {
    await openAddModal(page);

    const dateInput = page.getByLabel('Date Applied');
    await dateInput.fill('2024-01-15');
    await expect(dateInput).toHaveValue('2024-01-15');
  });
});
