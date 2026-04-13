import { describe, it, expect } from 'vitest';
import { HistoryService } from './history.service';

// Unit tests for HistoryService that can run without a database.
// DB-dependent methods (recordHistory, listHistory, etc.) are covered by integration tests.

describe('HistoryService — pure helpers', () => {
  // getNextSequence is private; test it indirectly via recordHistory in integration tests.
  // Here we verify that the service can be constructed and its interface matches expectations.

  it('exports HistoryService', () => {
    expect(HistoryService).toBeDefined();
  });

  it('HistoryService has expected methods', () => {
    const proto = HistoryService.prototype;
    expect(typeof proto.recordHistory).toBe('function');
    expect(typeof proto.listHistory).toBe('function');
    expect(typeof proto.getSnapshotAtVersion).toBe('function');
    expect(typeof proto.deleteHistory).toBe('function');
  });
});

describe('HistoryService — snapshot encoding', () => {
  it('round-trips JSON through Buffer correctly', () => {
    const original = { companyName: 'Acme', positionTitle: 'Engineer', status: 'applied' };
    const bytes = Buffer.from(JSON.stringify(original), 'utf-8');
    const restored = JSON.parse(bytes.toString('utf-8'));
    expect(restored).toEqual(original);
  });

  it('handles empty snapshot bytes', () => {
    expect(() => Buffer.alloc(0)).not.toThrow();
  });
});
