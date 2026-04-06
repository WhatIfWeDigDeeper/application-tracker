import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useApplicationStore } from './applicationStore';
import type { Application } from '@/types/application';

vi.mock('@/services/api', () => ({
  archiveApplication: vi.fn(),
  restoreApplication: vi.fn(),
  deleteApplication: vi.fn(),
  getApplication: vi.fn(),
}));

import * as api from '@/services/api';

function makeApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: 'app-1',
    companyName: 'Acme',
    positionTitle: 'Frontend Engineer',
    dateApplied: '2026-04-01',
    status: 'applied',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
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

describe('applicationStore archive/restore/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useApplicationStore.setState({
      applications: [makeApplication()],
      total: 1,
      page: 1,
      limit: 20,
      loading: false,
      error: null,
      selectedId: 'app-1',
      selectedApplication: makeApplication(),
      selectedLoading: false,
    });
  });

  it('archives application and refreshes selected state', async () => {
    vi.mocked(api.archiveApplication).mockResolvedValue(undefined as never);
    vi.mocked(api.getApplication).mockResolvedValue(makeApplication({ isArchived: true }) as never);

    await useApplicationStore.getState().archiveApplication('app-1');

    expect(api.archiveApplication).toHaveBeenCalledWith('app-1');
    expect(useApplicationStore.getState().selectedApplication?.isArchived).toBe(true);
  });

  it('restores application and refreshes selected state', async () => {
    vi.mocked(api.restoreApplication).mockResolvedValue(undefined as never);
    vi.mocked(api.getApplication).mockResolvedValue(makeApplication({ isArchived: false }) as never);

    await useApplicationStore.getState().restoreApplication('app-1');

    expect(api.restoreApplication).toHaveBeenCalledWith('app-1');
    expect(useApplicationStore.getState().selectedApplication?.isArchived).toBe(false);
  });

  it('deletes application from list and selection', async () => {
    vi.mocked(api.deleteApplication).mockResolvedValue(undefined as never);

    await useApplicationStore.getState().deleteApplication('app-1');

    expect(api.deleteApplication).toHaveBeenCalledWith('app-1');
    expect(useApplicationStore.getState().applications).toEqual([]);
    expect(useApplicationStore.getState().selectedApplication).toBeNull();
    expect(useApplicationStore.getState().selectedId).toBeNull();
  });

  it('sets error when selected application refresh fails', async () => {
    vi.mocked(api.archiveApplication).mockResolvedValue(undefined as never);
    vi.mocked(api.getApplication).mockRejectedValue(new Error('boom'));

    await useApplicationStore.getState().archiveApplication('app-1');

    expect(useApplicationStore.getState().error).toBe('boom');
  });
});
