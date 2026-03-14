/**
 * Application CRUD API Tests
 *
 * Tests basic CRUD operations across all 9 API implementations.
 *
 * Runs against all 9 stacks when API_URL is unset, or a single stack when API_URL is set.
 */

import { ALL_STACKS, getTargetStacks } from './helpers';

interface AppResponse {
  id: string;
  companyName: string;
  positionTitle: string;
  status: string;
  dateApplied: string | null;
}

interface ListResponse {
  items: AppResponse[];
  total?: number;
}

describe.each(getTargetStacks(ALL_STACKS))('Application CRUD ($name)', ({ baseUrl }) => {
  const createdIds: string[] = [];

  async function createApp(body: Record<string, unknown>): Promise<AppResponse> {
    const res = await fetch(`${baseUrl}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(res.status).toBe(201);
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

  it('POST /applications → 201 with correct fields', async () => {
    const app = await createApp({
      companyName: 'CRUD Test Corp',
      positionTitle: 'Software Engineer',
    });
    createdIds.push(app.id);

    expect(app.id).toBeTruthy();
    expect(app.companyName).toBe('CRUD Test Corp');
    expect(app.positionTitle).toBe('Software Engineer');
    expect(app.status).toBe('unsubmitted');
    expect(app.dateApplied).toBeNull();
  });

  it('GET /applications → 200 with items array', async () => {
    const res = await fetch(`${baseUrl}/applications`);
    expect(res.status).toBe(200);
    const data: ListResponse = await res.json();
    expect(Array.isArray(data.items)).toBe(true);
  });

  it('GET /applications/:id → 200 with correct data', async () => {
    const created = await createApp({
      companyName: 'Get By ID Corp',
      positionTitle: 'Developer',
    });
    createdIds.push(created.id);

    const res = await fetch(`${baseUrl}/applications/${created.id}`);
    expect(res.status).toBe(200);
    const app: AppResponse = await res.json();
    expect(app.id).toBe(created.id);
    expect(app.companyName).toBe('Get By ID Corp');
  });

  it('PATCH /applications/:id → 200 with updated data', async () => {
    const created = await createApp({
      companyName: 'Patch Corp',
      positionTitle: 'Engineer',
    });
    createdIds.push(created.id);

    const res = await fetch(`${baseUrl}/applications/${created.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: 'Patch Corp Updated',
        positionTitle: 'Senior Engineer',
        status: 'applied',
        dateApplied: '2026-02-01',
      }),
    });
    expect(res.status).toBe(200);
    const app: AppResponse = await res.json();
    expect(app.companyName).toBe('Patch Corp Updated');
    expect(app.positionTitle).toBe('Senior Engineer');
    expect(app.status).toBe('applied');
    expect(app.dateApplied).toContain('2026-02-01');
  });

  it('DELETE /applications/:id → 204', async () => {
    const created = await createApp({
      companyName: 'Delete Corp',
      positionTitle: 'Temp Role',
    });

    const res = await fetch(`${baseUrl}/applications/${created.id}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(204);
  });

  it('GET /applications?status=applied → filters by status', async () => {
    const app = await createApp({
      companyName: 'Status Filter Corp',
      positionTitle: 'Filter Role',
    });
    createdIds.push(app.id);

    await fetch(`${baseUrl}/applications/${app.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: 'Status Filter Corp',
        positionTitle: 'Filter Role',
        status: 'applied',
        dateApplied: '2026-01-01',
      }),
    });

    const res = await fetch(`${baseUrl}/applications?status=applied`);
    expect(res.status).toBe(200);
    const data: ListResponse = await res.json();
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.every((a) => a.status === 'applied')).toBe(true);
  });

  it('GET /applications?limit=2 → returns at most 2 items', async () => {
    // Create 3 apps to ensure we have enough data
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) {
      const app = await createApp({
        companyName: `Pagination Corp ${i}`,
        positionTitle: 'Paginate Role',
      });
      ids.push(app.id);
      createdIds.push(app.id);
    }

    const res = await fetch(`${baseUrl}/applications?limit=2`);
    expect(res.status).toBe(200);
    const data: ListResponse = await res.json();
    expect(data.items.length).toBeLessThanOrEqual(2);
  });
});
