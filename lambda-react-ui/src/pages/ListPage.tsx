import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApplicationList } from '@/components/applications/ApplicationList';
import { FilterBar } from '@/components/applications/FilterBar';
import { PipelineSummaryBar } from '@/components/layout/PipelineSummaryBar';
import { useApplicationStore } from '@/stores/applicationStore';
import { useFilterStore } from '@/stores/filterStore';
import { useUiStore } from '@/stores/uiStore';

export default function ListPage() {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const applications = useApplicationStore((state) => state.applications);
  const loading = useApplicationStore((state) => state.loading);
  const total = useApplicationStore((state) => state.total);
  const limit = useApplicationStore((state) => state.limit);
  const selectedId = useApplicationStore((state) => state.selectedId);
  const fetchApplications = useApplicationStore((state) => state.fetchApplications);
  const archiveApplication = useApplicationStore((state) => state.archiveApplication);
  const restoreApplication = useApplicationStore((state) => state.restoreApplication);
  const deleteApplication = useApplicationStore((state) => state.deleteApplication);
  const selectApplication = useApplicationStore((state) => state.selectApplication);

  const status = useFilterStore((state) => state.status);
  const companyCategory = useFilterStore((state) => state.companyCategory);
  const jobSource = useFilterStore((state) => state.jobSource);
  const skillsMatchMin = useFilterStore((state) => state.skillsMatchMin);
  const includeArchived = useFilterStore((state) => state.includeArchived);
  const sortBy = useFilterStore((state) => state.sortBy);
  const sortDir = useFilterStore((state) => state.sortDir);

  const filterState = useMemo(
    () => ({ status, companyCategory, jobSource, skillsMatchMin, includeArchived }),
    [status, companyCategory, jobSource, skillsMatchMin, includeArchived]
  );
  const sortState = useMemo(() => ({ sortBy, sortDir }), [sortBy, sortDir]);
  const viewMode = useUiStore((state) => state.viewMode);
  const openPanel = useUiStore((state) => state.openPanel);

  const hasActiveFilters = useMemo(
    () =>
      status.length > 0 || !!companyCategory || !!jobSource || skillsMatchMin != null || includeArchived,
    [status, companyCategory, jobSource, skillsMatchMin, includeArchived]
  );

  useEffect(() => {
    setPage(1);
    void fetchApplications(filterState, sortState, 1);
  }, [fetchApplications, filterState, sortState]);

  useEffect(() => {
    if (page === 1) {
      return;
    }
    void fetchApplications(filterState, sortState, page);
  }, [fetchApplications, filterState, page, sortState]);

  const handleSelect = (id: string) => {
    selectApplication(id);
    openPanel('details');
    navigate(`/applications/${id}`);
  };

  const refreshCurrentPage = async () => {
    await fetchApplications(filterState, sortState, page);
  };

  return (
    <section className="mx-auto max-w-7xl">
      <h1 style={{ margin: 0 }}>Applications</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Track and manage your application pipeline.</p>

      <div className="mt-4">
        <PipelineSummaryBar applications={applications} />
      </div>

      <div className="mt-4">
        <FilterBar total={total} visibleCount={applications.length} onImported={refreshCurrentPage} />
      </div>

      <ApplicationList
        applications={applications}
        loading={loading}
        total={total}
        page={page}
        limit={limit}
        viewMode={viewMode}
        selectedId={selectedId}
        hasActiveFilters={hasActiveFilters}
        onSelect={handleSelect}
        onPage={setPage}
        onArchive={async (id) => {
          await archiveApplication(id);
          await refreshCurrentPage();
        }}
        onRestore={async (id) => {
          await restoreApplication(id);
          await refreshCurrentPage();
        }}
        onDelete={async (id) => {
          await deleteApplication(id);
          await refreshCurrentPage();
        }}
      />
    </section>
  );
}
