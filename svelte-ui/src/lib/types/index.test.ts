import { describe, it, expect } from 'vitest';
import { ALL_STATUSES, STATUS_LABELS, STATUS_COLORS } from './index';
import type { ApplicationStatus } from './index';

describe('ApplicationStatus - unsubmitted', () => {
  it('should have "unsubmitted" as the first status in ALL_STATUSES', () => {
    expect(ALL_STATUSES[0]).toBe('unsubmitted');
  });

  it('should include "unsubmitted" in STATUS_LABELS', () => {
    expect(STATUS_LABELS['unsubmitted' as ApplicationStatus]).toBe('Unsubmitted');
  });

  it('should include "unsubmitted" in STATUS_COLORS with gray styling', () => {
    expect(STATUS_COLORS['unsubmitted' as ApplicationStatus]).toContain('bg-gray-200');
    expect(STATUS_COLORS['unsubmitted' as ApplicationStatus]).toContain('text-gray-700');
  });

  it('should have STATUS_LABELS entries for all statuses', () => {
    for (const status of ALL_STATUSES) {
      expect(STATUS_LABELS[status]).toBeDefined();
    }
  });

  it('should have STATUS_COLORS entries for all statuses', () => {
    for (const status of ALL_STATUSES) {
      expect(STATUS_COLORS[status]).toBeDefined();
    }
  });
});
