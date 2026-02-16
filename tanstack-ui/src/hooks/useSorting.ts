import { useState, useCallback } from "react";
import type { SortState } from "../types/application";

const defaultSort: SortState = {
  sortBy: "dateApplied",
  sortDir: "desc",
};

interface UseSortingResult {
  sorting: SortState;
  setSortBy: (sortBy: SortState["sortBy"]) => void;
  setSortDir: (sortDir: SortState["sortDir"]) => void;
  toggleSortDir: () => void;
}

export function useSorting(): UseSortingResult {
  const [sorting, setSorting] = useState<SortState>(defaultSort);

  const setSortBy = useCallback((sortBy: SortState["sortBy"]) => {
    setSorting((prev) => ({ ...prev, sortBy }));
  }, []);

  const setSortDir = useCallback((sortDir: SortState["sortDir"]) => {
    setSorting((prev) => ({ ...prev, sortDir }));
  }, []);

  const toggleSortDir = useCallback(() => {
    setSorting((prev) => ({
      ...prev,
      sortDir: prev.sortDir === "asc" ? "desc" : "asc",
    }));
  }, []);

  return {
    sorting,
    setSortBy,
    setSortDir,
    toggleSortDir,
  };
}
