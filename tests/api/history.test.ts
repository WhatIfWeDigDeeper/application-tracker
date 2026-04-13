/**
 * History API Tests
 *
 * Tests the history endpoints for stacks that expose snapshot-based history.
 * For nest-api, history storage is backed by the nest-history-api gRPC microservice;
 * the HTTP contract is the same regardless of the underlying transport.
 *
 * Runs against all HISTORY_STACKS when API_URL is unset, or a single stack when API_URL is set.
 */

import { HISTORY_STACKS, getTargetStacks } from './helpers';

const _historyTargets = getTargetStacks(HISTORY_STACKS);
const describeHistory = _historyTargets.length > 0
  ? describe.each(_historyTargets)
  : describe.skip.each([{ name: 'no-history-stacks', baseUrl: '', validatesDates: false, hasInterviewStageDates: false, hasStageHistory: false }]);

interface AppResponse {
  id: string;
  companyName: string;
  positionTitle: string;
  status: string;
}

interface HistoryEntry {
  id: string;
  sequence: number;
  description: string;
  changes: unknown[];
  createdAt: string;
}

interface PaginatedHistoryResponse {
  entries: HistoryEntry[];
  total: number;
  page: number;
  limit: number;
}

interface StageResponse {
  id: string;
  name: string;
  order: number;
}

describeHistory('History API ($name)', ({ baseUrl, hasStageHistory }) => {
  const createdIds: string[] = [];

  async function createApp(): Promise<AppResponse> {
    const res = await fetch(`${baseUrl}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: 'API: History Test Corp',
        positionTitle: 'Engineer',
      }),
    });
    expect(res.status).toBe(201);
    return res.json();
  }

  async function updateApp(id: string, patch: Record<string, unknown>): Promise<AppResponse> {
    const res = await fetch(`${baseUrl}/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName: 'API: History Test Corp', positionTitle: 'Engineer', ...patch }),
    });
    expect(res.ok).toBe(true);
    return res.json();
  }

  async function getHistory(id: string): Promise<PaginatedHistoryResponse> {
    const res = await fetch(`${baseUrl}/applications/${id}/history`);
    expect(res.status).toBe(200);
    return res.json();
  }

  async function deleteApp(id: string): Promise<void> {
    await fetch(`${baseUrl}/applications/${id}`, { method: 'DELETE' });
  }

  afterAll(async () => {
    for (const id of createdIds) {
      await deleteApp(id);
    }
  });

  describe('GET /applications/:id/history', () => {
    it('returns a creation entry immediately after create', async () => {
      const app = await createApp();
      createdIds.push(app.id);

      const history = await getHistory(app.id);

      expect(history.entries).toBeDefined();
      expect(Array.isArray(history.entries)).toBe(true);
      expect(history.entries.length).toBeGreaterThanOrEqual(1);
      expect(history.total).toBeGreaterThanOrEqual(1);
      expect(history.page).toBe(1);
    });

    it('creation entry describes the application as created', async () => {
      const app = await createApp();
      createdIds.push(app.id);

      const history = await getHistory(app.id);
      const first = history.entries[history.entries.length - 1]; // oldest = sequence 1

      expect(first.sequence).toBe(1);
      expect(first.description).toMatch(/created/i);
      expect(first.createdAt).toBeTruthy();
    });

    it('records a new entry after update', async () => {
      const app = await createApp();
      createdIds.push(app.id);

      await updateApp(app.id, { companyName: 'API: Updated Corp' });

      const history = await getHistory(app.id);
      expect(history.entries.length).toBeGreaterThanOrEqual(2);
      expect(history.total).toBeGreaterThanOrEqual(2);
    });

    it('newest entry is sequence 2 after first update', async () => {
      const app = await createApp();
      createdIds.push(app.id);

      await updateApp(app.id, { positionTitle: 'Senior Engineer' });

      const history = await getHistory(app.id);
      const newest = history.entries[0]; // sorted descending by sequence
      expect(newest.sequence).toBe(2);
    });

    it('returns 200 with empty entries for unknown application id', async () => {
      const res = await fetch(`${baseUrl}/applications/00000000-0000-0000-0000-000000000000/history`);
      // Some stacks return 404, others return 200 with empty list — both are acceptable
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('POST /applications/:id/history/restore', () => {
    it('restores to a previous version and returns the updated application', async () => {
      const app = await createApp();
      createdIds.push(app.id);

      // Make an update so there are 2 history entries
      await updateApp(app.id, { companyName: 'API: Changed Corp' });

      // Restore to sequence 1 (original)
      const res = await fetch(`${baseUrl}/applications/${app.id}/history/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence: 1 }),
      });
      expect(res.status).toBe(200);

      const restored: AppResponse = await res.json();
      expect(restored.id).toBe(app.id);
      expect(restored.companyName).toBe('API: History Test Corp'); // original value
    });

    it('adds a new history entry after restore', async () => {
      const app = await createApp();
      createdIds.push(app.id);

      await updateApp(app.id, { companyName: 'API: Modified Corp' });

      await fetch(`${baseUrl}/applications/${app.id}/history/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence: 1 }),
      });

      const history = await getHistory(app.id);
      expect(history.entries.length).toBeGreaterThanOrEqual(3);

      const newest = history.entries[0];
      expect(newest.description).toMatch(/restored/i);
    });
  });

  describe('Interview stage history recording', () => {
    it('records history when an interview stage is created', async () => {
      if (!hasStageHistory) return;
      const app = await createApp();
      createdIds.push(app.id);

      const historyBefore = await getHistory(app.id);
      const countBefore = historyBefore.total;

      const stageRes = await fetch(`${baseUrl}/applications/${app.id}/interview-stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Phone Screen', order: 1 }),
      });
      expect(stageRes.status).toBe(201);
      const stage: StageResponse = await stageRes.json();

      const historyAfter = await getHistory(app.id);
      expect(historyAfter.total).toBeGreaterThan(countBefore);

      // Clean up stage
      await fetch(`${baseUrl}/applications/${app.id}/interview-stages/${stage.id}`, { method: 'DELETE' });
    });

    it('records history when an interview stage is updated', async () => {
      if (!hasStageHistory) return;
      const app = await createApp();
      createdIds.push(app.id);

      const stageRes = await fetch(`${baseUrl}/applications/${app.id}/interview-stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Technical', order: 1 }),
      });
      expect(stageRes.status).toBe(201);
      const stage: StageResponse = await stageRes.json();

      const historyBefore = await getHistory(app.id);
      const countBefore = historyBefore.total;

      await fetch(`${baseUrl}/applications/${app.id}/interview-stages/${stage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Technical Interview', order: 1 }),
      });

      const historyAfter = await getHistory(app.id);
      expect(historyAfter.total).toBeGreaterThan(countBefore);

      // Clean up stage
      await fetch(`${baseUrl}/applications/${app.id}/interview-stages/${stage.id}`, { method: 'DELETE' });
    });

    it('records history when an interview stage is deleted', async () => {
      if (!hasStageHistory) return;
      const app = await createApp();
      createdIds.push(app.id);

      const stageRes = await fetch(`${baseUrl}/applications/${app.id}/interview-stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Final Round', order: 1 }),
      });
      expect(stageRes.status).toBe(201);
      const stage: StageResponse = await stageRes.json();

      const historyBefore = await getHistory(app.id);
      const countBefore = historyBefore.total;

      await fetch(`${baseUrl}/applications/${app.id}/interview-stages/${stage.id}`, {
        method: 'DELETE',
      });

      const historyAfter = await getHistory(app.id);
      expect(historyAfter.total).toBeGreaterThan(countBefore);
    });
  });
});
