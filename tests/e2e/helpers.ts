import type { Page } from '@playwright/test';

/**
 * Delete an application via the API. Call from afterAll to avoid UI-based cleanup.
 */
export async function deleteApplicationViaApi(page: Page, id: string): Promise<void> {
  const response = await page.request.delete(`/api/applications/${id}`);
  if (response.ok() || response.status() === 404) return;
  throw new Error(`Failed to delete application ${id}: ${response.status()} ${response.statusText()}`);
}

/**
 * UUID-based unique company name to avoid parallel-test collisions.
 */
export function uniqueCompanyName(prefix: string): string {
  return `E2E: ${prefix} ${crypto.randomUUID()}`;
}
