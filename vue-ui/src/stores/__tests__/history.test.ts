import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useHistoryStore, type Commit } from '../history';

// Mock the API services
vi.mock('@/services/api', () => ({
  applicationService: {
    update: vi.fn().mockResolvedValue({}),
  },
  eventService: {
    list: vi.fn().mockResolvedValue({ events: [], total: 0, page: 1, limit: 50 }),
  },
}));

// Mock the applicationDetail store
vi.mock('../applicationDetail', () => ({
  useApplicationDetailStore: vi.fn(() => ({
    application: null,
    isUndoRedoInProgress: false,
  })),
}));

function createCommit(overrides: Partial<Commit> = {}): Commit {
  return {
    id: crypto.randomUUID(),
    sequence: 1,
    timestamp: Date.now(),
    description: 'Test commit',
    changes: [],
    patches: [{ op: 'replace' as const, path: ['status'], value: 'interviewing' }],
    inversePatches: [{ op: 'replace' as const, path: ['status'], value: 'applied' }],
    ...overrides,
  };
}

describe('useHistoryStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('addCommit', () => {
    it('adds a commit and sets cursor to end', () => {
      const store = useHistoryStore();
      const appId = 'app-1';
      const commit = createCommit();

      store.addCommit(appId, commit);

      expect(store.getCommits(appId)).toHaveLength(1);
      expect(store.getCommits(appId)[0]).toStrictEqual(commit);
      expect(store.getCursor(appId)).toBe(0);
    });

    it('adds multiple commits sequentially', () => {
      const store = useHistoryStore();
      const appId = 'app-1';

      store.addCommit(appId, createCommit({ description: 'First' }));
      store.addCommit(appId, createCommit({ description: 'Second' }));
      store.addCommit(appId, createCommit({ description: 'Third' }));

      expect(store.getCommits(appId)).toHaveLength(3);
      expect(store.getCursor(appId)).toBe(2);
    });

    it('truncates redo stack when new commits arrive after undo', () => {
      const store = useHistoryStore();
      const appId = 'app-1';

      // Add 3 commits
      store.addCommit(appId, createCommit({ description: 'First' }));
      store.addCommit(appId, createCommit({ description: 'Second' }));
      store.addCommit(appId, createCommit({ description: 'Third' }));

      // Simulate undo by manually setting cursor back
      store.cursorByApp.set(appId, 0); // cursor at First

      // Add new commit - should truncate Second and Third
      store.addCommit(appId, createCommit({ description: 'New Second' }));

      const commits = store.getCommits(appId);
      expect(commits).toHaveLength(2);
      expect(commits[0].description).toBe('First');
      expect(commits[1].description).toBe('New Second');
      expect(store.getCursor(appId)).toBe(1);
    });
  });

  describe('canUndo / canRedo', () => {
    it('canUndo returns false when no commits', () => {
      const store = useHistoryStore();
      expect(store.canUndo('nonexistent')).toBe(false);
    });

    it('canUndo returns true when cursor >= 0', () => {
      const store = useHistoryStore();
      const appId = 'app-1';
      store.addCommit(appId, createCommit());

      expect(store.canUndo(appId)).toBe(true);
    });

    it('canUndo returns false when cursor is -1', () => {
      const store = useHistoryStore();
      const appId = 'app-1';
      store.addCommit(appId, createCommit());
      store.cursorByApp.set(appId, -1);

      expect(store.canUndo(appId)).toBe(false);
    });

    it('canRedo returns false when no commits', () => {
      const store = useHistoryStore();
      expect(store.canRedo('nonexistent')).toBe(false);
    });

    it('canRedo returns false when cursor is at end', () => {
      const store = useHistoryStore();
      const appId = 'app-1';
      store.addCommit(appId, createCommit());

      expect(store.canRedo(appId)).toBe(false);
    });

    it('canRedo returns true when cursor is before end', () => {
      const store = useHistoryStore();
      const appId = 'app-1';
      store.addCommit(appId, createCommit({ description: 'First' }));
      store.addCommit(appId, createCommit({ description: 'Second' }));
      store.cursorByApp.set(appId, 0); // cursor at first, second is available for redo

      expect(store.canRedo(appId)).toBe(true);
    });
  });

  describe('getCommits / getCursor', () => {
    it('getCommits returns empty array for unknown app', () => {
      const store = useHistoryStore();
      expect(store.getCommits('unknown')).toEqual([]);
    });

    it('getCursor returns -1 for unknown app', () => {
      const store = useHistoryStore();
      expect(store.getCursor('unknown')).toBe(-1);
    });
  });

  describe('clearHistory', () => {
    it('removes commits and cursor for an app', () => {
      const store = useHistoryStore();
      const appId = 'app-1';
      store.addCommit(appId, createCommit());

      store.clearHistory(appId);

      expect(store.getCommits(appId)).toEqual([]);
      expect(store.getCursor(appId)).toBe(-1);
    });
  });

  describe('loadHistory', () => {
    it('loads events from the API and maps to commits', async () => {
      const { eventService } = await import('@/services/api');
      vi.mocked(eventService.list).mockResolvedValueOnce({
        events: [
          {
            id: 'evt-1',
            applicationId: 'app-1',
            sequence: 1,
            description: 'Created application',
            changes: [],
            patches: [],
            inversePatches: [],
            createdAt: '2025-01-15T00:00:00Z',
          },
          {
            id: 'evt-2',
            applicationId: 'app-1',
            sequence: 2,
            description: 'Updated status',
            changes: [{ field: 'status', label: 'Status', oldValue: 'applied', newValue: 'interviewing' }],
            patches: [{ op: 'replace' as const, path: ['status'], value: 'interviewing' }],
            inversePatches: [{ op: 'replace' as const, path: ['status'], value: 'applied' }],
            createdAt: '2025-01-16T00:00:00Z',
          },
        ],
        total: 2,
        page: 1,
        limit: 200,
      });

      const store = useHistoryStore();
      await store.loadHistory('app-1');

      const commits = store.getCommits('app-1');
      expect(commits).toHaveLength(2);
      expect(commits[0].description).toBe('Created application');
      expect(commits[1].description).toBe('Updated status');
      expect(store.getCursor('app-1')).toBe(1);
    });

    it('handles API errors gracefully', async () => {
      const { eventService } = await import('@/services/api');
      vi.mocked(eventService.list).mockRejectedValueOnce(new Error('Network error'));

      const store = useHistoryStore();
      await store.loadHistory('app-1');

      expect(store.getCommits('app-1')).toEqual([]);
      expect(store.getCursor('app-1')).toBe(-1);
    });
  });
});
