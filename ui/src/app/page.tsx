'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { JobApplication } from '@/types/application';
import { useApplications } from '@/hooks/useApplications';
import { useFilters } from '@/hooks/useFilters';
import { useSorting } from '@/hooks/useSorting';
import { Header } from '@/components/common/Header';
import { ApplicationList } from '@/components/applications/ApplicationList';
import { FilterBar } from '@/components/applications/FilterBar';
import { SortControls } from '@/components/applications/SortControls';
import { Button } from '@/components/ui/Button';
import { PlusIcon } from '@/assets/icons/PlusIcon';

export default function Home(): React.ReactElement {
  const router = useRouter();

  const {
    applications,
    isLoading,
    error,
    archiveApplication,
    restoreApplication,
    setFilters: setHookFilters,
    setSort: setHookSort,
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

  const handleAddNew = (): void => {
    router.push('/applications/new');
  };

  const handleSelectApplication = (application: JobApplication): void => {
    router.push(`/applications/${application.id}`);
  };

  const handleArchiveApplication = (id: string): void => {
    archiveApplication(id);
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
          onArchiveApplication={handleArchiveApplication}
          onRestoreApplication={handleRestoreApplication}
        />
      </main>
    </div>
  );
}
