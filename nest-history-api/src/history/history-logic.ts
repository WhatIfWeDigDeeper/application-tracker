import { RpcException } from '@nestjs/microservices';

// Pure helpers extracted from HistoryService so behavior can be verified without
// touching the database or mocking Knex. The service composes these with I/O.

export function parseSnapshot(snapshotBytes: Buffer): unknown {
  try {
    return JSON.parse(snapshotBytes.toString('utf-8'));
  } catch {
    throw new RpcException({ code: 3, message: 'Invalid snapshot: must be valid JSON' });
  }
}

export function clampPagination(
  page: number,
  limit: number,
): { page: number; limit: number; offset: number } {
  const effectivePage = page > 0 ? page : 1;
  const effectiveLimit = limit > 0 ? limit : 50;
  return {
    page: effectivePage,
    limit: effectiveLimit,
    offset: (effectivePage - 1) * effectiveLimit,
  };
}

export function nextSequence(currentMax: string | number | null | undefined): number {
  return Number(currentMax ?? 0) + 1;
}

export function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(String(value));
}

export function encodeSnapshot(snapshot: unknown): Buffer {
  return Buffer.from(JSON.stringify(snapshot), 'utf-8');
}

export function countFromQuery(result: { count: string | number } | undefined): number {
  return Number(result?.count ?? 0);
}
