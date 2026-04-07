import { create } from 'zustand';
import { DEFAULT_INTERVIEW_STAGES } from '@/lib/constants';
import * as api from '@/services/api';
import type {
  Application,
  CreateApplicationInput,
  CreateInterviewStageInput,
  FilterState,
  SortState,
  UpdateApplicationInput,
  UpdateInterviewStageInput,
} from '@/types/application';

interface ApplicationState {
  applications: Application[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  selectedApplication: Application | null;
  selectedLoading: boolean;
  fetchApplications: (filters: FilterState, sort: SortState, page: number) => Promise<void>;
  createApplication: (data: CreateApplicationInput) => Promise<Application>;
  updateApplication: (id: string, data: UpdateApplicationInput) => Promise<Application>;
  deleteApplication: (id: string) => Promise<void>;
  archiveApplication: (id: string) => Promise<void>;
  restoreApplication: (id: string) => Promise<void>;
  selectApplication: (id: string | null) => void;
  loadSelectedApplication: (id: string) => Promise<void>;
  refreshSelected: () => Promise<void>;
  addStage: (appId: string, data: CreateInterviewStageInput) => Promise<void>;
  updateStage: (appId: string, stageId: string, data: UpdateInterviewStageInput) => Promise<void>;
  removeStage: (appId: string, stageId: string) => Promise<void>;
  addDefaultStages: (appId: string) => Promise<void>;
  restoreToVersion: (appId: string, sequence: number) => Promise<void>;
}

export const useApplicationStore = create<ApplicationState>((set, get) => ({
  applications: [],
  total: 0,
  page: 1,
  limit: 20,
  loading: false,
  error: null,
  selectedId: null,
  selectedApplication: null,
  selectedLoading: false,

  fetchApplications: async (filters, sort, page) => {
    set({ loading: true, error: null });
    try {
      const response = await api.listApplications({ ...filters, ...sort, page, limit: get().limit });
      if ('total' in response) {
        set({
          applications: response.items,
          total: response.total,
          page: response.page,
          limit: response.limit,
          loading: false,
        });
      } else {
        set({
          applications: response.items,
          total: response.items.length,
          page,
          limit: response.limit,
          loading: false,
        });
      }
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : 'Failed to load applications' });
    }
  },

  createApplication: async (data) => {
    const created = await api.createApplication(data);
    set((state) => ({ applications: [created, ...state.applications], total: state.total + 1 }));
    return created;
  },

  updateApplication: async (id, data) => {
    const updated = await api.updateApplication(id, data);
    set((state) => ({
      applications: state.applications.map((app) => (app.id === id ? updated : app)),
      selectedApplication: state.selectedApplication?.id === id ? updated : state.selectedApplication,
    }));
    return updated;
  },

  deleteApplication: async (id) => {
    await api.deleteApplication(id);
    set((state) => ({
      applications: state.applications.filter((app) => app.id !== id),
      total: Math.max(0, state.total - 1),
      selectedApplication: state.selectedApplication?.id === id ? null : state.selectedApplication,
      selectedId: state.selectedId === id ? null : state.selectedId,
    }));
  },

  archiveApplication: async (id) => {
    await api.archiveApplication(id);
    await get().refreshSelected();
  },

  restoreApplication: async (id) => {
    await api.restoreApplication(id);
    await get().refreshSelected();
  },

  selectApplication: (id) => set({ selectedId: id }),

  loadSelectedApplication: async (id) => {
    set({ selectedLoading: true, error: null, selectedId: id, selectedApplication: null });
    try {
      const application = await api.getApplication(id);
      set({ selectedApplication: application, selectedLoading: false });
    } catch (error) {
      set({ selectedLoading: false, error: error instanceof Error ? error.message : 'Failed to load application' });
    }
  },

  refreshSelected: async () => {
    const { selectedId } = get();
    if (!selectedId) return;
    await get().loadSelectedApplication(selectedId);
  },

  addStage: async (appId, data) => {
    await api.createStage(appId, data);
    await get().refreshSelected();
  },

  updateStage: async (appId, stageId, data) => {
    await api.updateStage(appId, stageId, data);
    await get().refreshSelected();
  },

  removeStage: async (appId, stageId) => {
    await api.deleteStage(appId, stageId);
    await get().refreshSelected();
  },

  addDefaultStages: async (appId) => {
    await Promise.all(
      DEFAULT_INTERVIEW_STAGES.map((name, index) => api.createStage(appId, { name, order: index }))
    );
    await get().refreshSelected();
  },

  restoreToVersion: async (appId, sequence) => {
    try {
      await api.restoreToVersion(appId, sequence);
      await get().refreshSelected();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to restore version' });
      throw error;
    }
  },
}));
