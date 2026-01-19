'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  JobApplication,
  InterviewStage,
  CreateApplicationInput,
  UpdateApplicationInput,
  InterviewStageInput,
  UpdateInterviewStageInput,
  ApplicationFilters,
  SortOptions,
} from '@/types/application';
import { applicationsApi, stagesApi } from '@/services/api';

/**
 * Return type for the useApplications hook
 * Implements UseApplicationsReturn from contracts/storage-service.ts
 */
export interface UseApplicationsReturn {
  // State
  applications: JobApplication[];
  isLoading: boolean;
  error: string | null;

  // CRUD Operations
  addApplication: (input: CreateApplicationInput) => Promise<JobApplication>;
  updateApplication: (id: string, input: UpdateApplicationInput) => Promise<JobApplication>;
  deleteApplication: (id: string) => Promise<void>;
  archiveApplication: (id: string) => Promise<void>;
  restoreApplication: (id: string) => Promise<void>;

  // Filtering & Sorting
  filters: ApplicationFilters;
  setFilters: (filters: ApplicationFilters) => void;
  sort: SortOptions;
  setSort: (sort: SortOptions) => void;

  // Interview Operations
  addInterviewStage: (applicationId: string, stage: InterviewStageInput) => Promise<void>;
  updateInterviewStage: (
    applicationId: string,
    stageId: string,
    input: UpdateInterviewStageInput
  ) => Promise<void>;
  removeInterviewStage: (applicationId: string, stageId: string) => Promise<void>;
  reorderInterviewStages: (applicationId: string, stageIds: string[]) => Promise<void>;
  completeInterviewStage: (
    applicationId: string,
    stageId: string,
    completedDate: string,
    notes?: string,
    rating?: number
  ) => Promise<void>;
  setInterviewStages: (applicationId: string, stages: InterviewStage[]) => Promise<void>;

  // Utility
  getApplicationById: (id: string) => JobApplication | null;
  refreshApplications: () => Promise<void>;
}

const DEFAULT_SORT: SortOptions = {
  field: 'dateApplied',
  direction: 'desc',
};

const DEFAULT_FILTERS: ApplicationFilters = {
  includeArchived: false,
};

/**
 * Custom hook for managing job applications state
 * Provides CRUD operations, filtering, sorting, and interview management via API
 */
export function useApplications(): UseApplicationsReturn {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ApplicationFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOptions>(DEFAULT_SORT);

  // Load applications from API on mount
  const refreshApplications = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Pass filters to API for server-side filtering
      const result = await applicationsApi.list({
        status: filters.status,
        companyCategory: filters.companyCategory,
        jobSource: filters.jobSource,
        includeArchived: filters.includeArchived,
      });
      let apps = Array.isArray(result) ? result : ((result as { items: JobApplication[] })?.items || []);

      // Apply client-side filters for fields not supported by API
      apps = apps.filter((app: JobApplication) => {
        // Skills match minimum filter (not supported by API)
        if (filters.skillsMatchMin !== undefined && filters.skillsMatchMin > 0) {
          if (!app.skillsMatch || app.skillsMatch < filters.skillsMatchMin) {
            return false;
          }
        }

        return true;
      });

      // Apply sorting
      apps.sort((a: JobApplication, b: JobApplication): number => {
        const aVal = a[sort.field as keyof JobApplication];
        const bVal = b[sort.field as keyof JobApplication];

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });

      setApplications(apps);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load applications';
      setError(message);
      console.error('Error loading applications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, sort]);

  // Initial load and reload when filters/sort change
  useEffect(() => {
    refreshApplications();
  }, [refreshApplications]);

  // CRUD Operations
  const addApplication = useCallback(async (input: CreateApplicationInput): Promise<JobApplication> => {
    try {
      const newApp = await applicationsApi.create(input);
      await refreshApplications();
      return newApp;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add application';
      setError(message);
      throw err;
    }
  }, [refreshApplications]);

  const updateApplication = useCallback(
    async (id: string, input: UpdateApplicationInput): Promise<JobApplication> => {
      try {
        const updatedApp = await applicationsApi.update(id, input);
        await refreshApplications();
        return updatedApp;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update application';
        setError(message);
        throw err;
      }
    },
    [refreshApplications]
  );

  const deleteApplication = useCallback(
    async (id: string): Promise<void> => {
      try {
        await applicationsApi.delete(id);
        await refreshApplications();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to delete application';
        setError(message);
        throw err;
      }
    },
    [refreshApplications]
  );

  const archiveApplication = useCallback(
    async (id: string): Promise<void> => {
      try {
        await applicationsApi.archive(id);
        await refreshApplications();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to archive application';
        setError(message);
        throw err;
      }
    },
    [refreshApplications]
  );

  const restoreApplication = useCallback(
    async (id: string): Promise<void> => {
      try {
        await applicationsApi.restore(id);
        await refreshApplications();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to restore application';
        setError(message);
        throw err;
      }
    },
    [refreshApplications]
  );

  // Interview Stage Operations
  const addInterviewStage = useCallback(
    async (applicationId: string, stage: InterviewStageInput): Promise<void> => {
      try {
        await stagesApi.create(applicationId, stage);
        await refreshApplications();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to add interview stage';
        setError(message);
        throw err;
      }
    },
    [refreshApplications]
  );

  const updateInterviewStage = useCallback(
    async (
      applicationId: string,
      stageId: string,
      input: UpdateInterviewStageInput
    ): Promise<void> => {
      try {
        await stagesApi.update(applicationId, stageId, input);
        await refreshApplications();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update interview stage';
        setError(message);
        throw err;
      }
    },
    [refreshApplications]
  );

  const removeInterviewStage = useCallback(
    async (applicationId: string, stageId: string): Promise<void> => {
      try {
        await stagesApi.delete(applicationId, stageId);
        await refreshApplications();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to remove interview stage';
        setError(message);
        throw err;
      }
    },
    [refreshApplications]
  );

  const reorderInterviewStages = useCallback(
    async (applicationId: string, stageIds: string[]): Promise<void> => {
      try {
        // Update order for each stage
        for (let i = 0; i < stageIds.length; i++) {
          const stageId = stageIds[i];
          if (stageId) {
            await stagesApi.update(applicationId, stageId, { order: i });
          }
        }
        await refreshApplications();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to reorder interview stages';
        setError(message);
        throw err;
      }
    },
    [refreshApplications]
  );

  const completeInterviewStage = useCallback(
    async (
      applicationId: string,
      stageId: string,
      completedDate: string,
      notes?: string,
      rating?: number
    ): Promise<void> => {
      try {
        await stagesApi.update(applicationId, stageId, {
          isCompleted: true,
          completedDate,
          notes,
          performanceRating: rating,
        });
        await refreshApplications();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to complete interview stage';
        setError(message);
        throw err;
      }
    },
    [refreshApplications]
  );

  const setInterviewStages = useCallback(
    async (applicationId: string, stages: InterviewStage[]): Promise<void> => {
      try {
        // Delete all existing stages
        const app = applications.find((a) => a.id === applicationId);
        if (app?.interviewStages) {
          for (const stage of app.interviewStages) {
            await stagesApi.delete(applicationId, stage.id);
          }
        }

        // Create new stages
        for (const stage of stages) {
          await stagesApi.create(applicationId, stage);
        }

        await refreshApplications();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to set interview stages';
        setError(message);
        throw err;
      }
    },
    [applications, refreshApplications]
  );

  // Utility
  const getApplicationById = useCallback(
    (id: string): JobApplication | null => {
      return applications.find((app) => app.id === id) || null;
    },
    [applications]
  );

  return {
    applications,
    isLoading,
    error,
    addApplication,
    updateApplication,
    deleteApplication,
    archiveApplication,
    restoreApplication,
    filters,
    setFilters,
    sort,
    setSort,
    addInterviewStage,
    updateInterviewStage,
    removeInterviewStage,
    reorderInterviewStages,
    completeInterviewStage,
    setInterviewStages,
    getApplicationById,
    refreshApplications,
  };
}
