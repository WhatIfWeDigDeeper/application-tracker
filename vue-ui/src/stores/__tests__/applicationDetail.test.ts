import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { enablePatches } from 'immer';
import { useApplicationDetailStore } from '../applicationDetail';
import type { Application } from '@/types';

// Enable Immer patches for tests
enablePatches();

// Mock the API services
const mockUpdate = vi.fn();
const mockGet = vi.fn();
const mockDelete = vi.fn();
const mockArchive = vi.fn();
const mockRestore = vi.fn();
const mockStageCreate = vi.fn();
const mockStageUpdate = vi.fn();
const mockStageDelete = vi.fn();
const mockEventAppend = vi.fn();

vi.mock('@/services/api', () => ({
  applicationService: {
    get: (...args: unknown[]) => mockGet(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
    archive: (...args: unknown[]) => mockArchive(...args),
    restore: (...args: unknown[]) => mockRestore(...args),
  },
  interviewStageService: {
    create: (...args: unknown[]) => mockStageCreate(...args),
    update: (...args: unknown[]) => mockStageUpdate(...args),
    delete: (...args: unknown[]) => mockStageDelete(...args),
  },
  eventService: {
    append: (...args: unknown[]) => mockEventAppend(...args),
    list: vi.fn().mockResolvedValue({ events: [], total: 0, page: 1, limit: 50 }),
  },
}));

function createMockApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: 'app-1',
    companyName: 'Acme Corp',
    positionTitle: 'Software Engineer',
    dateApplied: '2025-01-15',
    status: 'applied',
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    companyUrl: null,
    jobPostingUrl: null,
    companyCareerUrl: null,
    companyCategory: null,
    skillsMatch: null,
    jobSource: null,
    coverLetterRequired: null,
    specialRequirements: null,
    salaryMin: null,
    salaryMax: null,
    notes: null,
    offerDueDate: null,
    isArchived: false,
    interviewStages: [],
    ...overrides,
  };
}

describe('useApplicationDetailStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockEventAppend.mockResolvedValue({ id: 'evt-1', sequence: 1 });
  });

  describe('fetchApplication', () => {
    it('fetches and sets application', async () => {
      const app = createMockApplication();
      mockGet.mockResolvedValueOnce(app);

      const store = useApplicationDetailStore();
      await store.fetchApplication('app-1');

      expect(store.application).toEqual(app);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('sets error on failure', async () => {
      mockGet.mockRejectedValueOnce(new Error('Not found'));

      const store = useApplicationDetailStore();
      await store.fetchApplication('app-1');

      expect(store.application).toBeNull();
      expect(store.error).toBe('Not found');
    });
  });

  describe('updateApplication', () => {
    it('generates correct patches and updates state', async () => {
      const original = createMockApplication({ status: 'applied' });
      const updated = createMockApplication({ status: 'interviewing', updatedAt: '2025-01-16T00:00:00Z' });
      mockUpdate.mockResolvedValueOnce(updated);

      const store = useApplicationDetailStore();
      store.application = original;

      await store.updateApplication({ status: 'interviewing' });

      expect(store.application).toBeTruthy();
      expect(store.application!.status).toBe('interviewing');
      expect(mockUpdate).toHaveBeenCalledWith('app-1', { status: 'interviewing' });
    });

    it('records event after successful update', async () => {
      const original = createMockApplication({ status: 'applied' });
      const updated = createMockApplication({ status: 'interviewing' });
      mockUpdate.mockResolvedValueOnce(updated);

      const store = useApplicationDetailStore();
      store.application = original;

      await store.updateApplication({ status: 'interviewing' });

      expect(mockEventAppend).toHaveBeenCalledWith(
        'app-1',
        expect.objectContaining({
          description: expect.any(String),
          patches: expect.any(Array),
          inversePatches: expect.any(Array),
        })
      );
    });

    it('does not record event when isUndoRedoInProgress is true', async () => {
      const original = createMockApplication({ status: 'applied' });
      const updated = createMockApplication({ status: 'interviewing' });
      mockUpdate.mockResolvedValueOnce(updated);

      const store = useApplicationDetailStore();
      store.application = original;
      store.isUndoRedoInProgress = true;

      await store.updateApplication({ status: 'interviewing' });

      expect(mockEventAppend).not.toHaveBeenCalled();
    });

    it('preserves state and sets error on API failure', async () => {
      const original = createMockApplication({ status: 'applied' });
      mockUpdate.mockRejectedValueOnce(new Error('Update failed'));

      const store = useApplicationDetailStore();
      store.application = original;

      await expect(store.updateApplication({ status: 'interviewing' })).rejects.toThrow('Update failed');
      expect(store.error).toBe('Update failed');
    });

    it('does nothing when application is null', async () => {
      const store = useApplicationDetailStore();
      store.application = null;

      await store.updateApplication({ status: 'interviewing' });

      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('archiveApplication', () => {
    it('archives and generates patches', async () => {
      const original = createMockApplication({ isArchived: false });
      const archived = createMockApplication({ isArchived: true });
      mockArchive.mockResolvedValueOnce(archived);

      const store = useApplicationDetailStore();
      store.application = original;

      await store.archiveApplication();

      expect(store.application!.isArchived).toBe(true);
      expect(mockEventAppend).toHaveBeenCalled();
    });
  });

  describe('restoreApplication', () => {
    it('restores and generates patches', async () => {
      const original = createMockApplication({ isArchived: true });
      const restored = createMockApplication({ isArchived: false });
      mockRestore.mockResolvedValueOnce(restored);

      const store = useApplicationDetailStore();
      store.application = original;

      await store.restoreApplication();

      expect(store.application!.isArchived).toBe(false);
      expect(mockEventAppend).toHaveBeenCalled();
    });
  });

  describe('deleteApplication', () => {
    it('deletes application and clears state', async () => {
      const original = createMockApplication();
      mockDelete.mockResolvedValueOnce(undefined);

      const store = useApplicationDetailStore();
      store.application = original;

      await store.deleteApplication();

      expect(store.application).toBeNull();
      expect(mockDelete).toHaveBeenCalledWith('app-1');
    });
  });

  describe('interview stage operations', () => {
    it('adds an interview stage and records event', async () => {
      const original = createMockApplication({ interviewStages: [] });
      const newStage = {
        id: 'stage-1',
        name: 'Phone Screen',
        order: 0,
        isCompleted: false,
        completedDate: null,
        notes: null,
        performanceRating: null,
      };
      const refreshed = createMockApplication({
        interviewStages: [newStage],
      });

      mockStageCreate.mockResolvedValueOnce(newStage);
      mockGet.mockResolvedValueOnce(refreshed);

      const store = useApplicationDetailStore();
      store.application = original;

      await store.addInterviewStage({ name: 'Phone Screen', order: 0 });

      expect(store.application!.interviewStages).toHaveLength(1);
      expect(mockEventAppend).toHaveBeenCalled();
    });

    it('updates an interview stage and records event', async () => {
      const stage = {
        id: 'stage-1',
        name: 'Phone Screen',
        order: 0,
        isCompleted: false,
        completedDate: null,
        notes: null,
        performanceRating: null,
      };
      const original = createMockApplication({ interviewStages: [stage] });
      const updatedStage = { ...stage, name: 'Video Call' };

      mockStageUpdate.mockResolvedValueOnce(updatedStage);

      const store = useApplicationDetailStore();
      store.application = original;

      await store.updateInterviewStage('stage-1', { name: 'Video Call' });

      expect(store.application!.interviewStages[0].name).toBe('Video Call');
      expect(mockEventAppend).toHaveBeenCalled();
    });

    it('deletes an interview stage and records event', async () => {
      const stage = {
        id: 'stage-1',
        name: 'Phone Screen',
        order: 0,
        isCompleted: false,
        completedDate: null,
        notes: null,
        performanceRating: null,
      };
      const original = createMockApplication({ interviewStages: [stage] });

      mockStageDelete.mockResolvedValueOnce(undefined);

      const store = useApplicationDetailStore();
      store.application = original;

      await store.deleteInterviewStage('stage-1');

      expect(store.application!.interviewStages).toHaveLength(0);
      expect(mockEventAppend).toHaveBeenCalled();
    });
  });

  describe('$reset', () => {
    it('resets all state to defaults', () => {
      const store = useApplicationDetailStore();
      store.application = createMockApplication();
      store.loading = true;
      store.error = 'some error';
      store.isUndoRedoInProgress = true;

      store.$reset();

      expect(store.application).toBeNull();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.isUndoRedoInProgress).toBe(false);
    });
  });
});
