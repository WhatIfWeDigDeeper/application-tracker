'use client';

import { useState, useCallback, useMemo } from 'react';
import type { SortOptions, SortField, SortDirection } from '@/types/application';

export interface UseSortingReturn {
  sort: SortOptions;
  setSort: (sort: SortOptions) => void;

  // Convenience methods
  setSortField: (field: SortField) => void;
  setSortDirection: (direction: SortDirection) => void;
  toggleDirection: () => void;

  // Preset sorts
  sortByDateNewest: () => void;
  sortByDateOldest: () => void;
  sortByCompanyAZ: () => void;
  sortByCompanyZA: () => void;
}

const DEFAULT_SORT: SortOptions = {
  field: 'dateApplied',
  direction: 'desc',
};

export function useSorting(initialSort?: SortOptions): UseSortingReturn {
  const [sort, setSortState] = useState<SortOptions>({
    ...DEFAULT_SORT,
    ...initialSort,
  });

  const setSort = useCallback((newSort: SortOptions): void => {
    setSortState(newSort);
  }, []);

  const setSortField = useCallback((field: SortField): void => {
    setSortState((prev) => ({
      ...prev,
      field,
    }));
  }, []);

  const setSortDirection = useCallback((direction: SortDirection): void => {
    setSortState((prev) => ({
      ...prev,
      direction,
    }));
  }, []);

  const toggleDirection = useCallback((): void => {
    setSortState((prev) => ({
      ...prev,
      direction: prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const sortByDateNewest = useCallback((): void => {
    setSortState({ field: 'dateApplied', direction: 'desc' });
  }, []);

  const sortByDateOldest = useCallback((): void => {
    setSortState({ field: 'dateApplied', direction: 'asc' });
  }, []);

  const sortByCompanyAZ = useCallback((): void => {
    setSortState({ field: 'companyName', direction: 'asc' });
  }, []);

  const sortByCompanyZA = useCallback((): void => {
    setSortState({ field: 'companyName', direction: 'desc' });
  }, []);

  return useMemo(
    () => ({
      sort,
      setSort,
      setSortField,
      setSortDirection,
      toggleDirection,
      sortByDateNewest,
      sortByDateOldest,
      sortByCompanyAZ,
      sortByCompanyZA,
    }),
    [
      sort,
      setSort,
      setSortField,
      setSortDirection,
      toggleDirection,
      sortByDateNewest,
      sortByDateOldest,
      sortByCompanyAZ,
      sortByCompanyZA,
    ]
  );
}
