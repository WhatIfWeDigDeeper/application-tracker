import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_APPLICATIONS } from '../graphql/queries.js';
import { DELETE_APPLICATION, ARCHIVE_APPLICATION, RESTORE_APPLICATION } from '../graphql/mutations.js';
import { FilterBar } from '../components/applications/FilterBar.js';
import { Badge } from '../components/ui/Badge.js';
import { Spinner } from '../components/ui/Spinner.js';
import { Modal } from '../components/ui/Modal.js';
import { ImportModal } from '../components/applications/ImportModal.js';
import type { Application, ApplicationStatus, CompanyCategory, JobSource } from '../types/application.js';
import { CATEGORY_LABELS, fromApiApplication, toApiStatus, toApiCategory, toApiSource } from '../types/application.js';
import type { Filters } from '../components/applications/FilterBar.js';

export const Route = createFileRoute('/')({
  component: ListPage,
});

const STATUS_BORDER: Record<ApplicationStatus, string> = {
  unsubmitted: '#9ca3af',
  applied: '#0ea5e9',
  interviewing: '#fbbf24',
  'given offer': '#10b981',
  'accepted offer': '#059669',
  'declined offer': '#f97316',
  rejected: '#ef4444',
  'no offer': '#a855f7',
};

function SkillsDots({ score }: { score: number }) {
  return (
    <span className="inline-flex gap-0.5 text-xs" title={`Skills match: ${score}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < score ? 'var(--gql-pink)' : undefined }} className={i < score ? '' : 'text-gray-300 dark:text-gray-600'}>●</span>
      ))}
    </span>
  );
}

function GraphQLIcon({ size = 48 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" opacity="0.3">
      <polygon points="16,3 27.3,22.5 4.7,22.5" fill="none" stroke="#E10098" strokeWidth="1.5" strokeLinejoin="round"/>
      <polygon points="27.3,9.5 16,29 4.7,9.5" fill="none" stroke="#E10098" strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="16"   cy="3"    r="2" fill="#E10098"/>
      <circle cx="27.3" cy="9.5"  r="2" fill="#E10098"/>
      <circle cx="27.3" cy="22.5" r="2" fill="#E10098"/>
      <circle cx="16"   cy="29"   r="2" fill="#E10098"/>
      <circle cx="4.7"  cy="22.5" r="2" fill="#E10098"/>
      <circle cx="4.7"  cy="9.5"  r="2" fill="#E10098"/>
    </svg>
  );
}

function ActionMenu({
  app,
  onArchive,
  onRestore,
  onDelete,
}: {
  app: Application;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label="Actions"
        onClick={() => setOpen((o) => !o)}
        className="p-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
      >
        ⋮
      </button>
      {open && (
        <div
          data-menu-dropdown
          className="absolute right-0 top-8 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg min-w-[120px]"
        >
          {app.isArchived ? (
            <button type="button" onClick={() => { setOpen(false); onRestore(); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
              Restore
            </button>
          ) : (
            <button type="button" onClick={() => { setOpen(false); onArchive(); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
              Archive
            </button>
          )}
          <button type="button" onClick={() => { setOpen(false); onDelete(); }}
            className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function ListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_APPLICATIONS, {
    variables: {
      status: filters.status ? (toApiStatus(filters.status) as unknown as ApplicationStatus) : undefined,
      companyCategory: filters.companyCategory ? (toApiCategory(filters.companyCategory) as unknown as CompanyCategory) : undefined,
      jobSource: filters.jobSource ? (toApiSource(filters.jobSource) as unknown as JobSource) : undefined,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawData = data as any;
  const applications: Application[] = (rawData?.applications?.items ?? []).map(fromApiApplication);
  const total: number = rawData?.applications?.total ?? 0;
  const totalPages: number = rawData?.applications?.totalPages ?? 1;

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

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Applications</h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">{total} total</span>
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Import CSV
          </button>
          <a
            href="/api/applications/export"
            download={`applications-${today}.csv`}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Export CSV
          </a>
          <a
            href="/api/applications/sample-csv"
            download="applications-template.csv"
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Template
          </a>
        </div>
      </div>

      <FilterBar filters={filters} onFilterChange={handleFilterChange} />

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300">
          {error.message}
        </div>
      )}

      {loading && !data && <Spinner />}

      {!loading && applications.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-gray-400 dark:text-gray-500">
          <GraphQLIcon size={56} />
          <p className="text-sm">No applications found.</p>
          <button
            type="button"
            onClick={() => navigate({ to: '/applications/new' })}
            className="px-4 py-2 text-sm text-white rounded hover:opacity-90"
            style={{ background: 'var(--gql-pink)' }}
          >
            Add your first application
          </button>
        </div>
      )}

      <div className="space-y-3">
        {applications.map((app) => (
          <div
            key={app.id}
            onClick={() => navigate({ to: '/applications/$id', params: { id: app.id } })}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
            style={{ borderLeft: `3px solid ${STATUS_BORDER[app.status]}` }}
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
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{app.positionTitle}</p>
                    {app.companyCategory && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">[{CATEGORY_LABELS[app.companyCategory]}]</span>
                    )}
                    {app.skillsMatch != null && <SkillsDots score={app.skillsMatch} />}
                  </div>
                  {app.dateApplied && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Applied: {app.dateApplied}</p>
                  )}
                </div>
                <ActionMenu
                  app={app}
                  onArchive={() => archiveApp({ variables: { id: app.id } })}
                  onRestore={() => restoreApp({ variables: { id: app.id } })}
                  onDelete={() => setDeleteTarget(app.id)}
                />
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
            aria-label="Previous page"
          >
            ←
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400" style={{ fontFamily: 'var(--font-mono)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
            aria-label="Next page"
          >
            →
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

      {showImport && (
        <ImportModal
          onClose={() => { setShowImport(false); refetch(); }}
        />
      )}
    </div>
  );
}
