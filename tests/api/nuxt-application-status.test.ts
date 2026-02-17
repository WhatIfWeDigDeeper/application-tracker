/**
 * Application Status + Date Constraint API Tests
 *
 * Tests the date↔status enforcement via HTTP endpoints:
 * - New applications default to 'unsubmitted' with null dateApplied
 * - Setting status to 'unsubmitted' forces dateApplied to null
 *
 * Requires the nuxt-api server running on port 5040.
 */

const BASE_URL = process.env.API_URL ?? 'http://localhost:5040/api';

interface AppResponse {
  id: string;
  status: string;
  dateApplied: string | null;
}

async function createApp(body: Record<string, unknown>): Promise<AppResponse> {
  const res = await fetch(`${BASE_URL}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  expect(res.status).toBe(201);
  return res.json();
}

async function updateApp(id: string, body: Record<string, unknown>): Promise<AppResponse> {
  const res = await fetch(`${BASE_URL}/applications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  expect(res.ok).toBe(true);
  return res.json();
}

async function deleteApp(id: string): Promise<void> {
  await fetch(`${BASE_URL}/applications/${id}`, { method: 'DELETE' });
}

describe('Application Status + Date Constraint (API)', () => {
  const createdIds: string[] = [];

  afterEach(async () => {
    for (const id of createdIds) {
      await deleteApp(id);
    }
    createdIds.length = 0;
  });

  describe('create', () => {
    it('should default to unsubmitted status with null dateApplied', async () => {
      const app = await createApp({
        companyName: 'Test Company',
        positionTitle: 'Software Engineer',
      });
      createdIds.push(app.id);

      expect(app.status).toBe('unsubmitted');
      expect(app.dateApplied).toBeNull();
    });
  });

  describe('update', () => {
    it('should force dateApplied to null when status is set to unsubmitted', async () => {
      const app = await createApp({
        companyName: 'Test Company',
        positionTitle: 'Software Engineer',
      });
      createdIds.push(app.id);

      // Set to applied with a date first
      await updateApp(app.id, { status: 'applied', dateApplied: '2026-01-15' });

      // Now set back to unsubmitted
      const updated = await updateApp(app.id, { status: 'unsubmitted' });

      expect(updated.status).toBe('unsubmitted');
      expect(updated.dateApplied).toBeNull();
    });

    it('should force dateApplied to null even if dateApplied is also provided', async () => {
      const app = await createApp({
        companyName: 'Test Company',
        positionTitle: 'Software Engineer',
      });
      createdIds.push(app.id);

      const updated = await updateApp(app.id, {
        status: 'unsubmitted',
        dateApplied: '2026-02-01',
      });

      expect(updated.status).toBe('unsubmitted');
      expect(updated.dateApplied).toBeNull();
    });

    it('should allow dateApplied when status is not unsubmitted', async () => {
      const app = await createApp({
        companyName: 'Test Company',
        positionTitle: 'Software Engineer',
      });
      createdIds.push(app.id);

      const updated = await updateApp(app.id, {
        status: 'applied',
        dateApplied: '2026-01-20',
      });

      expect(updated.status).toBe('applied');
      expect(updated.dateApplied).toBe('2026-01-20');
    });
  });
});
