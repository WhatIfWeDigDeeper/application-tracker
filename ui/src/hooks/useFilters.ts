'use client';

import { useState, useCallback, useMemo } from 'react';
import type { ApplicationFilters, ApplicationStatus, CompanyCategory, JobSource } from '@/types/application';

export interface UseFiltersReturn {
  filters: ApplicationFilters;
  setFilters: (filters: ApplicationFilters) => void;

  // Individual filter setters
  setStatusFilter: (status: ApplicationStatus[]) => void;
  setCategoryFilter: (categories: CompanyCategory[]) => void;
  setJobSourceFilter: (sources: JobSource[]) => void;
  setSkillsMatchMin: (min: number | undefined) => void;
  setIncludeArchived: (include: boolean) => void;

  // Convenience methods
  toggleStatus: (status: ApplicationStatus) => void;
  toggleCategory: (category: CompanyCategory) => void;
  toggleJobSource: (source: JobSource) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

const DEFAULT_FILTERS: ApplicationFilters = {
  status: undefined,
  companyCategory: undefined,
  jobSource: undefined,
  skillsMatchMin: undefined,
  includeArchived: false,
};

export function useFilters(initialFilters?: ApplicationFilters): UseFiltersReturn {
  const [filters, setFiltersState] = useState<ApplicationFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const setFilters = useCallback((newFilters: ApplicationFilters): void => {
    setFiltersState(newFilters);
  }, []);

  const setStatusFilter = useCallback((status: ApplicationStatus[]): void => {
    setFiltersState((prev) => ({
      ...prev,
      status: status.length > 0 ? status : undefined,
    }));
  }, []);

  const setCategoryFilter = useCallback((categories: CompanyCategory[]): void => {
    setFiltersState((prev) => ({
      ...prev,
      companyCategory: categories.length > 0 ? categories : undefined,
    }));
  }, []);

  const setJobSourceFilter = useCallback((sources: JobSource[]): void => {
    setFiltersState((prev) => ({
      ...prev,
      jobSource: sources.length > 0 ? sources : undefined,
    }));
  }, []);

  const setSkillsMatchMin = useCallback((min: number | undefined): void => {
    setFiltersState((prev) => ({
      ...prev,
      skillsMatchMin: min,
    }));
  }, []);

  const setIncludeArchived = useCallback((include: boolean): void => {
    setFiltersState((prev) => ({
      ...prev,
      includeArchived: include,
    }));
  }, []);

  const toggleStatus = useCallback((status: ApplicationStatus): void => {
    setFiltersState((prev) => {
      const currentStatuses = prev.status ?? [];
      const newStatuses = currentStatuses.includes(status)
        ? currentStatuses.filter((s) => s !== status)
        : [...currentStatuses, status];
      return {
        ...prev,
        status: newStatuses.length > 0 ? newStatuses : undefined,
      };
    });
  }, []);

  const toggleCategory = useCallback((category: CompanyCategory): void => {
    setFiltersState((prev) => {
      const currentCategories = prev.companyCategory ?? [];
      const newCategories = currentCategories.includes(category)
        ? currentCategories.filter((c) => c !== category)
        : [...currentCategories, category];
      return {
        ...prev,
        companyCategory: newCategories.length > 0 ? newCategories : undefined,
      };
    });
  }, []);

  const toggleJobSource = useCallback((source: JobSource): void => {
    setFiltersState((prev) => {
      const currentSources = prev.jobSource ?? [];
      const newSources = currentSources.includes(source)
        ? currentSources.filter((s) => s !== source)
        : [...currentSources, source];
      return {
        ...prev,
        jobSource: newSources.length > 0 ? newSources : undefined,
      };
    });
  }, []);

  const clearFilters = useCallback((): void => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters = useMemo((): boolean => {
    return (
      (filters.status !== undefined && filters.status.length > 0) ||
      (filters.companyCategory !== undefined && filters.companyCategory.length > 0) ||
      (filters.jobSource !== undefined && filters.jobSource.length > 0) ||
      filters.skillsMatchMin !== undefined ||
      filters.includeArchived === true
    );
  }, [filters]);

  return useMemo(
    () => ({
      filters,
      setFilters,
      setStatusFilter,
      setCategoryFilter,
      setJobSourceFilter,
      setSkillsMatchMin,
      setIncludeArchived,
      toggleStatus,
      toggleCategory,
      toggleJobSource,
      clearFilters,
      hasActiveFilters,
    }),
    [
      filters,
      setFilters,
      setStatusFilter,
      setCategoryFilter,
      setJobSourceFilter,
      setSkillsMatchMin,
      setIncludeArchived,
      toggleStatus,
      toggleCategory,
      toggleJobSource,
      clearFilters,
      hasActiveFilters,
    ]
  );
}
