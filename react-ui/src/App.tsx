import { useState, useEffect } from "react";
import { Header } from "./components/common";
import {
  ApplicationList,
  ApplicationDetail,
  ApplicationForm,
  FilterBar,
} from "./components/applications";
import { Modal } from "./components/ui";
import { useApplications } from "./hooks/useApplications";
import { useFilters } from "./hooks/useFilters";
import { useSorting } from "./hooks/useSorting";
import type {
  CreateApplicationInput,
  UpdateApplicationInput,
  CreateInterviewStageInput,
  UpdateInterviewStageInput,
} from "./types/application";

function App() {
  const {
    applications,
    total,
    page,
    limit,
    loading,
    error,
    selectedApplication,
    fetchApplications,
    createApplication,
    updateApplication,
    deleteApplication,
    archiveApplication,
    restoreApplication,
    selectApplication,
    createStage,
    updateStage,
    deleteStage,
  } = useApplications();

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

  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch applications when filters, sorting, or page changes
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

  // Handlers
  const handleAddApplication = async (
    data: CreateApplicationInput | UpdateApplicationInput
  ) => {
    setIsSubmitting(true);
    try {
      await createApplication(data as CreateApplicationInput);
      setShowAddForm(false);
    } catch (err) {
      console.error("Failed to create application:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateApplication = async (data: UpdateApplicationInput) => {
    if (!selectedApplication) return;
    setIsSubmitting(true);
    try {
      await updateApplication(selectedApplication.id, data);
    } catch (err) {
      console.error("Failed to update application:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteApplication = async () => {
    if (!selectedApplication) return;
    setIsSubmitting(true);
    try {
      await deleteApplication(selectedApplication.id);
      await selectApplication(null);
    } catch (err) {
      console.error("Failed to delete application:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveApplication = async () => {
    if (!selectedApplication) return;
    setIsSubmitting(true);
    try {
      await archiveApplication(selectedApplication.id);
    } catch (err) {
      console.error("Failed to archive application:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestoreApplication = async () => {
    if (!selectedApplication) return;
    setIsSubmitting(true);
    try {
      await restoreApplication(selectedApplication.id);
    } catch (err) {
      console.error("Failed to restore application:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddStage = async (input: CreateInterviewStageInput) => {
    if (!selectedApplication) return;
    await createStage(selectedApplication.id, input);
  };

  const handleUpdateStage = async (
    stageId: string,
    input: UpdateInterviewStageInput
  ) => {
    if (!selectedApplication) return;
    await updateStage(selectedApplication.id, stageId, input);
  };

  const handleDeleteStage = async (stageId: string) => {
    if (!selectedApplication) return;
    await deleteStage(selectedApplication.id, stageId);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleClearFilters = () => {
    clearFilters();
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header onAddApplication={() => setShowAddForm(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
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
              onSelect={(id) => selectApplication(id)}
              onArchive={(id) => archiveApplication(id)}
              onRestore={(id) => restoreApplication(id)}
              onDelete={(id) => deleteApplication(id)}
              onAddNew={() => setShowAddForm(true)}
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              hasFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* Detail Panel */}
          {selectedApplication && (
            <div className="hidden lg:block w-[450px] flex-shrink-0">
              <div className="sticky top-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden max-h-[calc(100vh-6rem)]">
                <ApplicationDetail
                  application={selectedApplication}
                  onUpdate={handleUpdateApplication}
                  onArchive={handleArchiveApplication}
                  onRestore={handleRestoreApplication}
                  onDelete={handleDeleteApplication}
                  onClose={() => selectApplication(null)}
                  onAddStage={handleAddStage}
                  onUpdateStage={handleUpdateStage}
                  onDeleteStage={handleDeleteStage}
                  isLoading={isSubmitting}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Application Modal */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Add Application"
        size="xl"
      >
        <ApplicationForm
          onSubmit={handleAddApplication}
          onCancel={() => setShowAddForm(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Mobile Detail Modal */}
      {selectedApplication && (
        <div className="lg:hidden">
          <Modal
            isOpen={true}
            onClose={() => selectApplication(null)}
            size="xl"
          >
            <ApplicationDetail
              application={selectedApplication}
              onUpdate={handleUpdateApplication}
              onArchive={handleArchiveApplication}
              onRestore={handleRestoreApplication}
              onDelete={handleDeleteApplication}
              onClose={() => selectApplication(null)}
              onAddStage={handleAddStage}
              onUpdateStage={handleUpdateStage}
              onDeleteStage={handleDeleteStage}
              isLoading={isSubmitting}
            />
          </Modal>
        </div>
      )}
    </div>
  );
}

export default App;
