import { describe, expect, it } from 'vitest';
import { formatDate, formatSalaryRange, getDaysUntil, isOverdue } from './utils';

describe('formatDate', () => {
  it('formats a valid date', () => {
    expect(formatDate('2024-01-15')).toBe('Jan 15, 2024');
  });

  it('returns fallback when null', () => {
    expect(formatDate(null)).toBe('—');
  });
});

describe('formatSalaryRange', () => {
  it('formats min and max', () => {
    expect(formatSalaryRange(80000, 120000)).toBe('$80K-$120K');
  });

  it('formats min only', () => {
    expect(formatSalaryRange(90000, null)).toBe('$90K+');
  });

  it('returns fallback when both null', () => {
    expect(formatSalaryRange(null, null)).toBe('—');
  });
});

describe('getDaysUntil and isOverdue', () => {
  it('returns positive days for future dates', () => {
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    expect(getDaysUntil(future)).toBeGreaterThanOrEqual(2);
  });

  it('returns negative days for past dates', () => {
    const past = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    expect(getDaysUntil(past)).toBeLessThan(0);
  });

  it('returns zero for today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(getDaysUntil(today)).toBe(0);
  });

  it('identifies overdue date', () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    expect(isOverdue(past)).toBe(true);
  });
});
