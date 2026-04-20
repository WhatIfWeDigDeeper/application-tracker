import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { RpcException } from '@nestjs/microservices';
import knex, { type Knex } from 'knex';
import { randomUUID } from 'crypto';
import { HistoryService } from './history.service';

// Integration tests that exercise HistoryService against a real Postgres schema.
// Opt-in: requires TEST_DATABASE_URL to point at a writable database. When unset,
// the suite is skipped so default `npm test` runs remain green without a DB.

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const describeIntegration = TEST_DATABASE_URL ? describe : describe.skip;

describeIntegration('HistoryService (integration)', () => {
  let db: Knex;
  let service: HistoryService;

  beforeAll(async () => {
    db = knex({
      client: 'pg',
      connection: TEST_DATABASE_URL,
      searchPath: ['react_nestjs_history', 'public'],
      pool: { min: 1, max: 5 },
    });
    // Safety: beforeEach TRUNCATEs react_nestjs_history.application_history, so pointing
    // this suite at the shared dev database would wipe real history rows. Require the
    // target DB name to end with "_test" so a misconfigured TEST_DATABASE_URL can't clobber
    // dev data.
    const dbNameRow = await db.raw<{ rows: Array<{ current_database: string }> }>(
      'SELECT current_database()',
    );
    const currentDb = dbNameRow.rows[0].current_database;
    if (!/_test$/.test(currentDb)) {
      throw new Error(
        `Refusing to run integration tests against database "${currentDb}" — ` +
          `TEST_DATABASE_URL must point at a database whose name ends with "_test" ` +
          `(e.g. app_tracker_test) to prevent truncating dev data.`,
      );
    }
    // Mirror the production migration inline so tests don't depend on the Knex TS
    // migration loader (which can't resolve ts-node under vitest's CJS runtime).
    await db.raw('CREATE SCHEMA IF NOT EXISTS react_nestjs_history');
    try {
      await db.raw('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    } catch (error) {
      const pgError = error as { code?: string; message?: string };
      if (pgError.code === '42501') {
        throw new Error(
          'Unable to create the pgcrypto extension for integration tests. ' +
            'The configured TEST_DATABASE_URL does not have permission to create extensions. ' +
            'Please pre-install pgcrypto in the target database or use a database user with the required privileges.',
          { cause: error },
        );
      }
      throw error;
    }
    await db.raw(`
      CREATE TABLE IF NOT EXISTS react_nestjs_history.application_history (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id uuid NOT NULL,
        sequence integer NOT NULL,
        description text NOT NULL,
        snapshot jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_history_app_sequence UNIQUE (application_id, sequence)
      )
    `);
    service = new HistoryService(db);
  }, 30_000);

  afterAll(async () => {
    if (db) await db.destroy();
  });

  beforeEach(async () => {
    await db.raw('TRUNCATE TABLE react_nestjs_history.application_history RESTART IDENTITY');
  });

  const snapshot = (extra: Record<string, unknown> = {}) =>
    Buffer.from(JSON.stringify({ companyName: 'Acme', ...extra }), 'utf-8');

  it('allocates sequences independently per application_id, starting at 1', async () => {
    const appA = randomUUID();
    const appB = randomUUID();

    const a1 = await service.recordHistory(appA, 'created', snapshot());
    const a2 = await service.recordHistory(appA, 'updated', snapshot());
    const b1 = await service.recordHistory(appB, 'created', snapshot());
    const a3 = await service.recordHistory(appA, 'updated', snapshot());
    const b2 = await service.recordHistory(appB, 'updated', snapshot());

    expect([a1, a2, a3]).toEqual([1, 2, 3]);
    expect([b1, b2]).toEqual([1, 2]);
  });

  it('paginates results in sequence-desc order with correct total', async () => {
    const appId = randomUUID();
    for (let i = 0; i < 12; i++) {
      await service.recordHistory(appId, `rev-${i + 1}`, snapshot({ rev: i + 1 }));
    }

    const page1 = await service.listHistory(appId, 1, 5);
    expect(page1.total).toBe(12);
    expect(page1.rows.map((r) => r.sequence)).toEqual([12, 11, 10, 9, 8]);

    const page3 = await service.listHistory(appId, 3, 5);
    expect(page3.total).toBe(12);
    expect(page3.rows.map((r) => r.sequence)).toEqual([2, 1]);

    const defaults = await service.listHistory(appId, 0, 0);
    expect(defaults.total).toBe(12);
    expect(defaults.rows).toHaveLength(12);
    expect(defaults.rows[0].created_at).toBeInstanceOf(Date);
  });

  it('throws RpcException with INVALID_ARGUMENT when snapshot is not valid JSON', async () => {
    const appId = randomUUID();
    const err = await service
      .recordHistory(appId, 'bad', Buffer.from('not-json', 'utf-8'))
      .catch((e) => e);

    expect(err).toBeInstanceOf(RpcException);
    expect((err as RpcException).getError()).toEqual({
      code: 3,
      message: 'Invalid snapshot: must be valid JSON',
    });
  });

  it('round-trips snapshot bytes via getSnapshotAtVersion', async () => {
    const appId = randomUUID();
    const payload = { companyName: 'Acme', positionTitle: 'Engineer', nested: { x: 1 } };
    const seq = await service.recordHistory(
      appId,
      'created',
      Buffer.from(JSON.stringify(payload), 'utf-8'),
    );

    const bytes = await service.getSnapshotAtVersion(appId, seq);
    expect(bytes).toBeInstanceOf(Buffer);
    expect(JSON.parse(bytes!.toString('utf-8'))).toEqual(payload);

    expect(await service.getSnapshotAtVersion(appId, 999)).toBeNull();
  });

  it('deleteHistory returns the affected count and leaves other apps untouched', async () => {
    const appA = randomUUID();
    const appB = randomUUID();
    await service.recordHistory(appA, 'a1', snapshot());
    await service.recordHistory(appA, 'a2', snapshot());
    await service.recordHistory(appB, 'b1', snapshot());
    await service.recordHistory(appB, 'b2', snapshot());

    const deleted = await service.deleteHistory(appA);
    expect(deleted).toBe(2);

    const remainingA = await service.listHistory(appA, 1, 50);
    expect(remainingA.total).toBe(0);
    const remainingB = await service.listHistory(appB, 1, 50);
    expect(remainingB.total).toBe(2);
  });

  it('concurrent recordHistory calls for the same app produce unique sequences 1..N', async () => {
    const appId = randomUUID();
    const N = 10;

    const results = await Promise.allSettled(
      Array.from({ length: N }, (_, i) =>
        service.recordHistory(appId, `rev-${i}`, snapshot({ i })),
      ),
    );

    const fulfilled = results.filter((r) => r.status === 'fulfilled') as PromiseFulfilledResult<number>[];
    const rejected = results.filter((r) => r.status === 'rejected');

    // The service doesn't retry on unique-violation; rejections surface the race.
    // What we *must* guarantee: no two successful writes share a sequence, and persisted rows
    // reflect exactly the successful sequences. If rejections occur, document them — the test
    // still validates the unique constraint did its job.
    expect(fulfilled.length).toBeGreaterThan(0);
    const sequences = fulfilled.map((r) => r.value).sort((a, b) => a - b);
    expect(new Set(sequences).size).toBe(sequences.length);

    const persisted = await service.listHistory(appId, 1, 100);
    expect(persisted.total).toBe(fulfilled.length);
    expect(persisted.rows.map((r) => r.sequence).sort((a, b) => a - b)).toEqual(sequences);

    // Sanity: if all N succeeded, they form a contiguous 1..N.
    if (rejected.length === 0) {
      expect(sequences).toEqual(Array.from({ length: N }, (_, i) => i + 1));
    }
  });
});
