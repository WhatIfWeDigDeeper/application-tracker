'use client';

import { useState, useMemo } from 'react';
import type {
  JobApplication,
  InterviewStage,
  CreateApplicationInput,
  UpdateApplicationInput,
  UpdateInterviewStageInput,
} from '@/types/application';
import { useApplications } from '@/hooks/useApplications';
import { useFilters } from '@/hooks/useFilters';
import { useSorting } from '@/hooks/useSorting';
import { Header } from '@/components/common/Header';
import { ApplicationList } from '@/components/applications/ApplicationList';
import { ApplicationForm } from '@/components/applications/ApplicationForm';
import { ApplicationDetail } from '@/components/applications/ApplicationDetail';
import { FilterBar } from '@/components/applications/FilterBar';
import { SortControls } from '@/components/applications/SortControls';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { PlusIcon } from '@/assets/icons/PlusIcon';

export default function Home(): React.ReactElement {
  const {
    applications,
    isLoading,
    error,
    addApplication,
    updateApplication,
    deleteApplication,
    archiveApplication,
    restoreApplication,
    setFilters: setHookFilters,
    setSort: setHookSort,
    addInterviewStage,
    updateInterviewStage,
    removeInterviewStage,
    getApplicationById,
  } = useApplications();

  const { filters, setFilters, clearFilters, hasActiveFilters } = useFilters();
  const { sort, setSort } = useSorting();

  // Sync local filter/sort state with useApplications hook
  useMemo(() => {
    setHookFilters(filters);
  }, [filters, setHookFilters]);

  useMemo(() => {
    setHookSort(sort);
  }, [sort, setHookSort]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);

  // Get the currently selected application (refreshed from storage)
  const selectedApplication = selectedApplicationId ? getApplicationById(selectedApplicationId) : null;

  const handleAddNew = (): void => {
    setEditingApplication(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: CreateApplicationInput | UpdateApplicationInput): void => {
    if (editingApplication) {
      updateApplication(editingApplication.id, data as UpdateApplicationInput);
    } else {
      addApplication(data as CreateApplicationInput);
    }
    setIsFormOpen(false);
    setEditingApplication(null);
  };

  const handleFormCancel = (): void => {
    setIsFormOpen(false);
    setEditingApplication(null);
  };

  const handleSelectApplication = (application: JobApplication): void => {
    setSelectedApplicationId(application.id);
  };

  const handleCloseDetail = (): void => {
    setSelectedApplicationId(null);
  };

  const handleDetailUpdate = (id: string, data: UpdateApplicationInput): void => {
    updateApplication(id, data);
  };

  const handleAddStage = async (stage: InterviewStage): Promise<void> => {
    if (selectedApplication) {
      await addInterviewStage(selectedApplication.id, stage);
      // Auto-transition to 'interviewing' status if adding stages while 'applied'
      if (selectedApplication.status === 'applied') {
        updateApplication(selectedApplication.id, { status: 'interviewing' });
      }
    }
  };

  const handleUpdateStage = async (
    stageId: string,
    stage: UpdateInterviewStageInput
  ): Promise<void> => {
    if (selectedApplication) {
      await updateInterviewStage(selectedApplication.id, stageId, stage);
    }
  };

  const handleRemoveStage = async (stageId: string): Promise<void> => {
    if (selectedApplication) {
      await removeInterviewStage(selectedApplication.id, stageId);
    }
  };

  const handleEditFromDetail = (): void => {
    if (selectedApplication) {
      setEditingApplication(selectedApplication);
      setIsFormOpen(true);
      setSelectedApplicationId(null);
    }
  };

  const handleEditApplication = (application: JobApplication): void => {
    setEditingApplication(application);
    setIsFormOpen(true);
  };

  const handleArchiveApplication = (id: string): void => {
    archiveApplication(id);
  };

  const handleDeleteApplication = (id: string): void => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = (): void => {
    if (deleteConfirmId) {
      deleteApplication(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleRestoreApplication = (id: string): void => {
    restoreApplication(id);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <Header>
        <Button onClick={handleAddNew}>
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Application
        </Button>
      </Header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Filter and Sort Controls */}
        <div className="mb-6">
          <FilterBar
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {applications.length} application{applications.length !== 1 ? 's' : ''}
            </p>
            <SortControls sort={sort} onSortChange={setSort} />
          </div>
        </div>

        <ApplicationList
          applications={applications}
          isLoading={isLoading}
          onAddNew={handleAddNew}
          onSelectApplication={handleSelectApplication}
          onEditApplication={handleEditApplication}
          onArchiveApplication={handleArchiveApplication}
          onDeleteApplication={handleDeleteApplication}
          onRestoreApplication={handleRestoreApplication}
        />
      </main>

      {/* Add/Edit Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={handleFormCancel}
        title={editingApplication ? 'Edit Application' : 'Add New Application'}
        size="xl"
      >
        <ApplicationForm
          initialData={editingApplication ?? undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          mode={editingApplication ? 'edit' : 'create'}
        />
      </Modal>

      {/* Application Detail Modal */}
      <Modal
        isOpen={selectedApplication !== null}
        onClose={handleCloseDetail}
        title="Application Details"
        size="xl"
      >
        {selectedApplication && (
          <ApplicationDetail
            application={selectedApplication}
            onUpdate={handleDetailUpdate}
            onAddStage={handleAddStage}
            onUpdateStage={handleUpdateStage}
            onRemoveStage={handleRemoveStage}
            onEdit={handleEditFromDetail}
            onClose={handleCloseDetail}
          />
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Application"
        message="Are you sure you want to permanently delete this application? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
