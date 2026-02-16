import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useFilters } from "../hooks/useFilters";
import { useSorting } from "../hooks/useSorting";
import type { ListApplicationsParams } from "../types/application";
import { useApplications } from "../queries/applicationQueries";
import {
  useArchiveApplication,
  useRestoreApplication,
  useDeleteApplication,
} from "../queries/applicationMutations";
import { ApplicationList, FilterBar } from "../components/applications";

export const Route = createFileRoute("/")({
  component: ListPage,
});

function ListPage() {
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
  const [currentPage, setCurrentPage] = useState(1);

  const params: ListApplicationsParams = {
    status: filters.status.length > 0 ? filters.status.join(",") : undefined,
    companyCategory: filters.companyCategory || undefined,
    jobSource: filters.jobSource || undefined,
    skillsMatchMin: filters.skillsMatchMin || undefined,
    includeArchived: filters.includeArchived,
    sortBy: sorting.sortBy,
    sortDir: sorting.sortDir,
    page: currentPage,
    limit: 20,
  };

  const { data, isLoading: loading, error } = useApplications(params);
  const archiveMutation = useArchiveApplication();
  const restoreMutation = useRestoreApplication();
  const deleteMutation = useDeleteApplication();

  const applications = data?.items ?? [];
  const total = data?.total ?? 0;
  const page = data?.page ?? 1;
  const limit = data?.limit ?? 20;
  const totalPages = Math.ceil(total / limit);

  const handleArchiveApplication = async (id: string) => {
    try {
      await archiveMutation.mutateAsync(id);
    } catch {
      // handled by mutation state
    }
  };

  const handleRestoreApplication = async (id: string) => {
    try {
      await restoreMutation.mutateAsync(id);
    } catch {
      // handled by mutation state
    }
  };

  const handleDeleteApplication = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      // handled by mutation state
    }
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
          {error instanceof Error ? error.message : "Failed to fetch applications"}
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
        onPageChange={setCurrentPage}
        hasFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      />
    </main>
  );
}
