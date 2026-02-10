import { useState, useEffect, useCallback } from "react";
import { useFilters } from "../hooks/useFilters";
import { useSorting } from "../hooks/useSorting";
import type { ListApplicationsParams, Application } from "../types/application";
import * as api from "../services/api";
import {
  ApplicationList,
  FilterBar,
} from "../components/applications";

export function ListPage() {
  const {
    filters,
    setStatusFilter,
    setCategoryFilter,
    setSourceFilter,
    setSkillsMatchMin,
    setIncludeArchived,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
  } = useFilters();

  const { sorting, setSortBy, toggleSortDir } = useSorting();

  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchApplications = useCallback(
    async (params: ListApplicationsParams = {}) => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.listApplications(params);
        setApplications(result.items);
        setTotal(result.total);
        setPage(result.page);
        setLimit(result.limit);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch applications"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchApplications({
      status: filters.status.length > 0 ? filters.status.join(",") : undefined,
      companyCategory: filters.companyCategory || undefined,
      jobSource: filters.jobSource || undefined,
      skillsMatchMin: filters.skillsMatchMin || undefined,
      includeArchived: filters.includeArchived,
      sortBy: sorting.sortBy,
      sortDir: sorting.sortDir,
      page: currentPage,
      limit: 20,
    });
  }, [fetchApplications, filters, sorting, currentPage]);

  const totalPages = Math.ceil(total / limit);

  const handleArchiveApplication = async (id: string) => {
    try {
      await api.archiveApplication(id);
      await fetchApplications({
        status:
          filters.status.length > 0 ? filters.status.join(",") : undefined,
        companyCategory: filters.companyCategory || undefined,
        jobSource: filters.jobSource || undefined,
        skillsMatchMin: filters.skillsMatchMin || undefined,
        includeArchived: filters.includeArchived,
        sortBy: sorting.sortBy,
        sortDir: sorting.sortDir,
        page: currentPage,
        limit: 20,
      });
    } catch (err) {
      console.error("Failed to archive application:", err);
    }
  };

  const handleRestoreApplication = async (id: string) => {
    try {
      await api.restoreApplication(id);
      await fetchApplications({
        status:
          filters.status.length > 0 ? filters.status.join(",") : undefined,
        companyCategory: filters.companyCategory || undefined,
        jobSource: filters.jobSource || undefined,
        skillsMatchMin: filters.skillsMatchMin || undefined,
        includeArchived: filters.includeArchived,
        sortBy: sorting.sortBy,
        sortDir: sorting.sortDir,
        page: currentPage,
        limit: 20,
      });
    } catch (err) {
      console.error("Failed to restore application:", err);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    try {
      await api.deleteApplication(id);
      setApplications((prev) => prev.filter((a) => a.id !== id));
      setTotal((prev) => prev - 1);
    } catch (err) {
      console.error("Failed to delete application:", err);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleClearFilters = () => {
    clearFilters();
    setCurrentPage(1);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <FilterBar
          filters={filters}
          sorting={sorting}
          resultCount={applications.length}
          totalCount={total}
          onStatusChange={setStatusFilter}
          onCategoryChange={setCategoryFilter}
          onSourceChange={setSourceFilter}
          onSkillsMatchChange={setSkillsMatchMin}
          onIncludeArchivedChange={setIncludeArchived}
          onSortByChange={setSortBy}
          onSortDirToggle={toggleSortDir}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
        />
      </div>

      {/* Application List */}
      <ApplicationList
        applications={applications}
        loading={loading}
        onArchive={handleArchiveApplication}
        onRestore={handleRestoreApplication}
        onDelete={handleDeleteApplication}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        hasFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      />
    </main>
  );
}
