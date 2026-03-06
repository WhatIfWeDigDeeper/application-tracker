import type { Page } from '@playwright/test';

/**
 * Delete an application via the API. Call from afterAll to avoid UI-based cleanup.
 */
export async function deleteApplicationViaApi(page: Page, id: string): Promise<void> {
  await page.request.delete(`/api/applications/${id}`);
}

/**
 * UUID-based unique company name to avoid parallel-test collisions.
 */
export function uniqueCompanyName(prefix: string): string {
  return `${prefix} ${crypto.randomUUID()}`;
}
