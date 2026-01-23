import { useState, useCallback } from "react";
import type { FilterState, ApplicationStatus, CompanyCategory, JobSource } from "../types/application";

const defaultFilters: FilterState = {
  status: [],
  companyCategory: null,
  jobSource: null,
  skillsMatchMin: null,
  includeArchived: false,
};

interface UseFiltersResult {
  filters: FilterState;
  setStatusFilter: (statuses: ApplicationStatus[]) => void;
  setCategoryFilter: (category: CompanyCategory | null) => void;
  setSourceFilter: (source: JobSource | null) => void;
  setSkillsMatchMin: (min: number | null) => void;
  setIncludeArchived: (include: boolean) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
}

export function useFilters(): UseFiltersResult {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const setStatusFilter = useCallback((statuses: ApplicationStatus[]) => {
    setFilters((prev) => ({ ...prev, status: statuses }));
  }, []);

  const setCategoryFilter = useCallback((category: CompanyCategory | null) => {
    setFilters((prev) => ({ ...prev, companyCategory: category }));
  }, []);

  const setSourceFilter = useCallback((source: JobSource | null) => {
    setFilters((prev) => ({ ...prev, jobSource: source }));
  }, []);

  const setSkillsMatchMin = useCallback((min: number | null) => {
    setFilters((prev) => ({ ...prev, skillsMatchMin: min }));
  }, []);

  const setIncludeArchived = useCallback((include: boolean) => {
    setFilters((prev) => ({ ...prev, includeArchived: include }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const activeFilterCount =
    (filters.status.length > 0 ? 1 : 0) +
    (filters.companyCategory ? 1 : 0) +
    (filters.jobSource ? 1 : 0) +
    (filters.skillsMatchMin ? 1 : 0) +
    (filters.includeArchived ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  return {
    filters,
    setStatusFilter,
    setCategoryFilter,
    setSourceFilter,
    setSkillsMatchMin,
    setIncludeArchived,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
  };
}
