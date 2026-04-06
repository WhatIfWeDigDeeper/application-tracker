import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { ApplicationCard } from './ApplicationCard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import type { Application } from '@/types/application';

interface ApplicationListProps {
  applications: Application[];
  loading: boolean;
  total: number;
  page: number;
  limit: number;
  viewMode: 'grid' | 'list';
  selectedId: string | null;
  hasActiveFilters: boolean;
  onSelect: (id: string) => void;
  onPage: (page: number) => void;
  onArchive: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ApplicationList({
  applications,
  loading,
  total,
  page,
  limit,
  viewMode,
  selectedId,
  hasActiveFilters,
  onSelect,
  onPage,
  onArchive,
  onRestore,
  onDelete,
}: ApplicationListProps) {
  const [openMenuForId, setOpenMenuForId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    { type: 'archive' | 'restore' | 'delete'; id: string } | null
  >(null);

  const handleToggleMenu = (id: string, event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setOpenMenuForId((current) => (current === id ? null : id));
  };

  useEffect(() => {
    const onWindowClick = () => setOpenMenuForId(null);
    window.addEventListener('click', onWindowClick);
    return () => window.removeEventListener('click', onWindowClick);
  }, []);

  const pendingApplication = useMemo(
    () => applications.find((application) => application.id === pendingAction?.id) ?? null,
    [applications, pendingAction]
  );

  const handleConfirm = async () => {
    if (!pendingAction) {
      return;
    }

    if (pendingAction.type === 'archive') {
      await onArchive(pendingAction.id);
    }
    if (pendingAction.type === 'restore') {
      await onRestore(pendingAction.id);
    }
    if (pendingAction.type === 'delete') {
      await onDelete(pendingAction.id);
    }

    setPendingAction(null);
    setOpenMenuForId(null);
  };

  if (loading) {
    return (
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))' }}
      >
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)]"
          />
        ))}
      </div>
    );
  }

  if (applications.length === 0) {
    return hasActiveFilters ? (
      <EmptyState
        title="No Matching Applications"
        description="Try adjusting filters or sorting to broaden your results."
      />
    ) : (
      <EmptyState
        title="No Applications Yet"
        description="Add your first application to start tracking your pipeline."
      />
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div data-testid="application-list">
      <div className="grid gap-3" style={{ gridTemplateColumns: '1fr' }}>
        {applications.map((application) => (
          <div key={application.id} className="relative">
            <ApplicationCard
              application={application}
              viewMode={viewMode}
              selected={application.id === selectedId}
              onSelect={onSelect}
              onToggleMenu={handleToggleMenu}
            />

            {openMenuForId === application.id ? (
              <div
                data-menu-dropdown
                className="absolute right-3 top-12 z-10 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1 shadow"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-[var(--bg-card-hover)]"
                  type="button"
                  onClick={() =>
                    setPendingAction({ type: application.isArchived ? 'restore' : 'archive', id: application.id })
                  }
                >
                  {application.isArchived ? 'Restore' : 'Archive'}
                </button>
                <button
                  className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-[var(--bg-card-hover)]"
                  type="button"
                  onClick={() => setPendingAction({ type: 'delete', id: application.id })}
                >
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={onPage} />

      <ConfirmDialog
        open={pendingAction != null}
        title={
          pendingAction?.type === 'delete'
            ? 'Delete application?'
            : pendingAction?.type === 'restore'
              ? 'Restore application?'
              : 'Archive application?'
        }
        message={
          pendingAction?.type === 'delete'
            ? `Permanently delete ${pendingApplication?.companyName ?? 'this application'}?`
            : pendingAction?.type === 'restore'
              ? `Restore ${pendingApplication?.companyName ?? 'this application'} to active applications?`
              : `Archive ${pendingApplication?.companyName ?? 'this application'}?`
        }
        confirmLabel={pendingAction?.type === 'delete' ? 'Delete' : 'Confirm'}
        variant={pendingAction?.type === 'delete' ? 'danger' : 'default'}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          void handleConfirm();
        }}
      />
    </div>
  );
}
