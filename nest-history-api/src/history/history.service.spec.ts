import { describe, it, expect } from 'vitest';
import { RpcException } from '@nestjs/microservices';
import {
  parseSnapshot,
  clampPagination,
  nextSequence,
  toDate,
  encodeSnapshot,
  countFromQuery,
} from './history-logic';

// Pure-function tests for HistoryService's extracted helpers. Proto contract regression
// protection lives in the repo-level proto lint/breaking checks.

describe('parseSnapshot', () => {
  it('returns the parsed JSON value for valid bytes', () => {
    const bytes = Buffer.from(JSON.stringify({ companyName: 'Acme', n: 1 }), 'utf-8');
    expect(parseSnapshot(bytes)).toEqual({ companyName: 'Acme', n: 1 });
  });

  it('supports arbitrary JSON scalars and arrays', () => {
    expect(parseSnapshot(Buffer.from('null'))).toBeNull();
    expect(parseSnapshot(Buffer.from('[1,2,3]'))).toEqual([1, 2, 3]);
    expect(parseSnapshot(Buffer.from('"hi"'))).toBe('hi');
  });

  it('throws RpcException with INVALID_ARGUMENT when bytes are not JSON', () => {
    const err = (() => {
      try {
        parseSnapshot(Buffer.from('not-json'));
      } catch (e) {
        return e;
      }
    })();
    expect(err).toBeInstanceOf(RpcException);
    expect((err as RpcException).getError()).toEqual({
      code: 3,
      message: 'Invalid snapshot: must be valid JSON',
    });
  });

  it('throws on empty bytes', () => {
    expect(() => parseSnapshot(Buffer.alloc(0))).toThrow(RpcException);
  });
});

describe('clampPagination', () => {
  it('returns page/limit unchanged when both positive', () => {
    expect(clampPagination(3, 10)).toEqual({ page: 3, limit: 10, offset: 20 });
  });

  it('defaults page to 1 when non-positive', () => {
    expect(clampPagination(0, 5)).toMatchObject({ page: 1, offset: 0 });
    expect(clampPagination(-7, 5)).toMatchObject({ page: 1, offset: 0 });
  });

  it('defaults limit to 50 when non-positive', () => {
    expect(clampPagination(2, 0)).toEqual({ page: 2, limit: 50, offset: 50 });
    expect(clampPagination(1, -1)).toEqual({ page: 1, limit: 50, offset: 0 });
  });

  it('computes offset = (page - 1) * limit', () => {
    expect(clampPagination(5, 20).offset).toBe(80);
  });
});

describe('nextSequence', () => {
  it('returns 1 when no prior rows exist (null/undefined)', () => {
    expect(nextSequence(null)).toBe(1);
    expect(nextSequence(undefined)).toBe(1);
  });

  it('returns MAX + 1 for numeric input', () => {
    expect(nextSequence(7)).toBe(8);
  });

  it('coerces string values from pg count-like results', () => {
    expect(nextSequence('41')).toBe(42);
  });
});

describe('toDate', () => {
  it('returns Date instances unchanged', () => {
    const d = new Date('2026-04-14T12:00:00.000Z');
    expect(toDate(d)).toBe(d);
  });

  it('parses ISO strings into Date', () => {
    const d = toDate('2026-04-14T12:00:00.000Z');
    expect(d).toBeInstanceOf(Date);
    expect(d.toISOString()).toBe('2026-04-14T12:00:00.000Z');
  });
});

describe('encodeSnapshot', () => {
  it('produces Buffer bytes that round-trip through JSON.parse', () => {
    const snapshot = { companyName: 'Acme', stages: [{ name: 'phone' }] };
    const bytes = encodeSnapshot(snapshot);
    expect(bytes).toBeInstanceOf(Buffer);
    expect(JSON.parse(bytes.toString('utf-8'))).toEqual(snapshot);
  });
});

describe('countFromQuery', () => {
  it('returns 0 for undefined result', () => {
    expect(countFromQuery(undefined)).toBe(0);
  });

  it('coerces string counts from pg to numbers', () => {
    expect(countFromQuery({ count: '12' })).toBe(12);
  });

  it('passes through numeric counts', () => {
    expect(countFromQuery({ count: 3 })).toBe(3);
  });
});
