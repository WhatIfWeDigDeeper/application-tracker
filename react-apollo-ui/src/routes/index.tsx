import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_APPLICATIONS } from '../graphql/queries.js';
import { DELETE_APPLICATION, ARCHIVE_APPLICATION, RESTORE_APPLICATION } from '../graphql/mutations.js';
import { FilterBar } from '../components/applications/FilterBar.js';
import { Badge } from '../components/ui/Badge.js';
import { Spinner } from '../components/ui/Spinner.js';
import { Modal } from '../components/ui/Modal.js';
import type { Application, ApplicationStatus, CompanyCategory, JobSource } from '../types/application.js';
import type { Filters } from '../components/applications/FilterBar.js';

export const Route = createFileRoute('/')({
  component: ListPage,
});

function ListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_APPLICATIONS, {
    variables: {
      status: filters.status as ApplicationStatus | undefined,
      companyCategory: filters.companyCategory as CompanyCategory | undefined,
      jobSource: filters.jobSource as JobSource | undefined,
      skillsMatchMin: filters.skillsMatchMin,
      includeArchived: filters.includeArchived,
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
      page,
      limit: 20,
    },
    fetchPolicy: 'cache-and-network',
  });

  const [archiveApp] = useMutation(ARCHIVE_APPLICATION, { onCompleted: () => refetch() });
  const [restoreApp] = useMutation(RESTORE_APPLICATION, { onCompleted: () => refetch() });
  const [deleteApp] = useMutation(DELETE_APPLICATION, { onCompleted: () => refetch() });

  const applications: Application[] = data?.applications?.items ?? [];
  const total: number = data?.applications?.total ?? 0;
  const totalPages: number = data?.applications?.totalPages ?? 1;

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteApp({ variables: { id: deleteTarget } });
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Applications</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">{total} total</span>
      </div>

      <FilterBar filters={filters} onFilterChange={handleFilterChange} />

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300">
          {error.message}
        </div>
      )}

      {loading && !data && <Spinner />}

      {!loading && applications.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No applications found.
        </div>
      )}

      <div className="space-y-3">
        {applications.map((app) => (
          <div
            key={app.id}
            onClick={() => navigate({ to: '/applications/$id', params: { id: app.id } })}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold text-gray-900 dark:text-white truncate">{app.companyName}</h2>
                  <Badge status={app.status} />
                  {app.isArchived && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                      Archived
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{app.positionTitle}</p>
                {app.dateApplied && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Applied: {app.dateApplied}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                {app.isArchived ? (
                  <button
                    type="button"
                    onClick={() => restoreApp({ variables: { id: app.id } })}
                    className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    Restore
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => archiveApp({ variables: { id: app.id } })}
                    className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    Archive
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDeleteTarget(app.id)}
                  className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Next
          </button>
        </div>
      )}

      <Modal
        isOpen={!!deleteTarget}
        title="Delete Application"
        message="Are you sure you want to delete this application? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        isDestructive
      />
    </div>
  );
}
