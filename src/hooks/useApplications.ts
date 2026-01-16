'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  JobApplication,
  CreateApplicationInput,
  UpdateApplicationInput,
  InterviewStageInput,
  ApplicationFilters,
  SortOptions,
} from '@/types/application';
import * as storageService from '@/services/storage';

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
  addApplication: (input: CreateApplicationInput) => JobApplication;
  updateApplication: (id: string, input: UpdateApplicationInput) => JobApplication;
  deleteApplication: (id: string) => void;
  archiveApplication: (id: string) => void;
  restoreApplication: (id: string) => void;

  // Filtering & Sorting
  filters: ApplicationFilters;
  setFilters: (filters: ApplicationFilters) => void;
  sort: SortOptions;
  setSort: (sort: SortOptions) => void;

  // Interview Operations
  addInterviewStage: (applicationId: string, stage: InterviewStageInput) => void;
  updateInterviewStage: (applicationId: string, stageId: string, input: InterviewStageInput) => void;
  removeInterviewStage: (applicationId: string, stageId: string) => void;
  reorderInterviewStages: (applicationId: string, stageIds: string[]) => void;
  completeInterviewStage: (
    applicationId: string,
    stageId: string,
    completedDate: string,
    notes?: string,
    rating?: number
  ) => void;

  // Utility
  getApplicationById: (id: string) => JobApplication | null;
  refreshApplications: () => void;
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
 * Provides CRUD operations, filtering, sorting, and interview management
 */
export function useApplications(): UseApplicationsReturn {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ApplicationFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOptions>(DEFAULT_SORT);

  // Load applications from localStorage on mount
  const refreshApplications = useCallback((): void => {
    setIsLoading(true);
    setError(null);

    try {
      const apps = storageService.getApplications(filters, sort);
      setApplications(apps);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load applications';
      setError(message);
      console.error('Error loading applications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, sort]);

  // Initial load and reload when filters/sort change
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    refreshApplications();
  }, [refreshApplications]);

  // CRUD Operations
  const addApplication = useCallback((input: CreateApplicationInput): JobApplication => {
    try {
      const newApp = storageService.createApplication(input);
      refreshApplications();
      return newApp;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add application';
      setError(message);
      throw err;
    }
  }, [refreshApplications]);

  const updateApplication = useCallback(
    (id: string, input: UpdateApplicationInput): JobApplication => {
      try {
        const updatedApp = storageService.updateApplication(id, input);
        refreshApplications();
        return updatedApp;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update application';
        setError(message);
        throw err;
      }
    },
    [refreshApplications]
  );

  const deleteApplication = useCallback(
    (id: string): void => {
      try {
        storageService.deleteApplication(id);
        refreshApplications();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete application';
        setError(message);
        throw err;
      }
    },
    [refreshApplications]
  );

  const archiveApplication = useCallback(
    (id: string): void => {
      try {
        storageService.archiveApplicationById(id);
        refreshApplications();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to archive application';
        setError(message);
        throw err;
      }
    },
    [refreshApplications]
  );

  const restoreApplication = useCallback(
    (id: string): void => {
      try {
        storageService.restoreApplication(id);
        refreshApplications();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to restore application';
        setError(message);
        throw err;
      }
    },
    [refreshApplications]
  );

  // Interview Operations
  const addInterviewStage = useCallback(
    (applicationId: string, stage: InterviewStageInput): void => {
      try {
        storageService.addInterviewStage(applicationId, stage);
        refreshApplications();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add interview stage';
        setError(message);
        throw err;
      }
    },
    [refreshApplications]
  );

  const updateInterviewStage = useCallback(
    (applicationId: string, stageId: string, input: InterviewStageInput): void => {
      try {
        storageService.updateInterviewStage(applicationId, stageId, input);
        refreshApplications();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update interview stage';
        setError(message);
        throw err;
      }
    },
    [refreshApplications]
  );

  const removeInterviewStage = useCallback(
    (applicationId: string, stageId: string): void => {
      try {
        storageService.removeInterviewStage(applicationId, stageId);
        refreshApplications();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove interview stage';
        setError(message);
        throw err;
      }
    },
    [refreshApplications]
  );

  const reorderInterviewStages = useCallback(
    (applicationId: string, stageIds: string[]): void => {
      try {
        storageService.reorderInterviewStages(applicationId, stageIds);
        refreshApplications();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to reorder interview stages';
        setError(message);
        throw err;
      }
    },
    [refreshApplications]
  );

  const completeInterviewStage = useCallback(
    (
      applicationId: string,
      stageId: string,
      completedDate: string,
      notes?: string,
      rating?: number
    ): void => {
      try {
        storageService.completeInterviewStage(applicationId, stageId, completedDate, notes, rating);
        refreshApplications();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to complete interview stage';
        setError(message);
        throw err;
      }
    },
    [refreshApplications]
  );

  // Utility
  const getApplicationById = useCallback((id: string): JobApplication | null => {
    return storageService.getApplicationById(id);
  }, []);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(
    () => ({
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
      getApplicationById,
      refreshApplications,
    }),
    [
      applications,
      isLoading,
      error,
      addApplication,
      updateApplication,
      deleteApplication,
      archiveApplication,
      restoreApplication,
      filters,
      sort,
      addInterviewStage,
      updateInterviewStage,
      removeInterviewStage,
      reorderInterviewStages,
      completeInterviewStage,
      getApplicationById,
      refreshApplications,
    ]
  );
}
