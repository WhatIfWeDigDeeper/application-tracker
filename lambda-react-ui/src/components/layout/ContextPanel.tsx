import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { HistoryPanel } from '@/components/applications/HistoryPanel';
import { InterviewStageList } from '@/components/interviews/InterviewStageList';
import { TextArea } from '@/components/ui/TextArea';
import { useApplicationStore } from '@/stores/applicationStore';
import { useFilterStore } from '@/stores/filterStore';
import { useUiStore } from '@/stores/uiStore';

export function ContextPanel() {
  const [pendingAction, setPendingAction] = useState<'archive' | 'restore' | 'delete' | null>(null);
  const [detailDraft, setDetailDraft] = useState({
    notes: '',
    specialRequirements: '',
    salaryMin: '',
    salaryMax: '',
  });
  const [savedField, setSavedField] = useState<string | null>(null);

  const panelOpen = useUiStore((state) => state.panelOpen);
  const panelTab = useUiStore((state) => state.panelTab);
  const closePanel = useUiStore((state) => state.closePanel);
  const setPanelTab = useUiStore((state) => state.setPanelTab);

  const selectedApplication = useApplicationStore((state) => state.selectedApplication);
  const archiveApplication = useApplicationStore((state) => state.archiveApplication);
  const restoreApplication = useApplicationStore((state) => state.restoreApplication);
  const deleteApplication = useApplicationStore((state) => state.deleteApplication);
  const updateApplication = useApplicationStore((state) => state.updateApplication);
  const fetchApplications = useApplicationStore((state) => state.fetchApplications);

  const status = useFilterStore((state) => state.status);
  const companyCategory = useFilterStore((state) => state.companyCategory);
  const jobSource = useFilterStore((state) => state.jobSource);
  const skillsMatchMin = useFilterStore((state) => state.skillsMatchMin);
  const includeArchived = useFilterStore((state) => state.includeArchived);
  const sortBy = useFilterStore((state) => state.sortBy);
  const sortDir = useFilterStore((state) => state.sortDir);

  const refreshList = async () => {
    await fetchApplications(
      { status, companyCategory, jobSource, skillsMatchMin, includeArchived },
      { sortBy, sortDir },
      1
    );
  };

  useEffect(() => {
    if (!selectedApplication) {
      setDetailDraft({ notes: '', specialRequirements: '', salaryMin: '', salaryMax: '' });
      return;
    }

    setDetailDraft({
      notes: selectedApplication.notes ?? '',
      specialRequirements: selectedApplication.specialRequirements ?? '',
      salaryMin: selectedApplication.salaryMin != null ? String(selectedApplication.salaryMin) : '',
      salaryMax: selectedApplication.salaryMax != null ? String(selectedApplication.salaryMax) : '',
    });
  }, [selectedApplication]);

  const handleDetailBlur = async (field: 'notes' | 'specialRequirements' | 'salaryMin' | 'salaryMax') => {
    if (!selectedApplication) {
      return;
    }

    try {
      if (field === 'notes' || field === 'specialRequirements') {
        const currentValue = field === 'notes' ? selectedApplication.notes ?? '' : selectedApplication.specialRequirements ?? '';
        const draftValue = detailDraft[field].trim();
        if (draftValue === currentValue) {
          return;
        }
        await updateApplication(selectedApplication.id, { [field]: draftValue || null });
      }

      if (field === 'salaryMin' || field === 'salaryMax') {
        const rawValue = detailDraft[field].trim();
        const parsed = rawValue ? Number(rawValue) : null;
        if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) {
          return;
        }
        const nextValue = parsed !== null ? Math.round(parsed) : null;
        const currentValue = field === 'salaryMin' ? selectedApplication.salaryMin : selectedApplication.salaryMax;
        if (nextValue === currentValue) {
          return;
        }
        await updateApplication(selectedApplication.id, { [field]: nextValue });
      }

      setSavedField(field);
      setTimeout(() => setSavedField(null), 1200);
    } catch {
      // API error — do not show "Saved" indicator
    }
  };

  const handleConfirm = async () => {
    if (!selectedApplication || !pendingAction) {
      setPendingAction(null);
      return;
    }

    try {
      if (pendingAction === 'archive') {
        await archiveApplication(selectedApplication.id);
      }
      if (pendingAction === 'restore') {
        await restoreApplication(selectedApplication.id);
      }
      if (pendingAction === 'delete') {
        await deleteApplication(selectedApplication.id);
        closePanel();
      }

      await refreshList();
    } catch {
      // Error is surfaced via the store's error state
    } finally {
      setPendingAction(null);
    }
  };

  if (!panelOpen) {
    return <aside data-testid="context-panel" className="hidden xl:block" style={{ borderLeft: '1px solid var(--border-subtle)' }} />;
  }

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm xl:hidden" onClick={closePanel} />
      <aside
        data-testid="context-panel"
        style={{ borderLeft: '1px solid var(--border-subtle)', padding: '1rem' }}
        className="fixed inset-y-0 right-0 z-40 w-full max-w-[420px] overflow-y-auto bg-[var(--bg-page)] xl:static xl:block"
      >
      <div className="flex items-center justify-between">
        <div>
          <div style={{ fontWeight: 600 }}>{selectedApplication?.companyName ?? 'No Selection'}</div>
          <div className="text-sm text-[var(--text-secondary)]">{selectedApplication?.positionTitle ?? 'Select an application'}</div>
        </div>
        <Button variant="ghost" size="sm" onClick={closePanel} type="button" aria-label="Close context panel">
          X
        </Button>
      </div>

      <div className="mt-3 flex gap-2">
        <Button variant={panelTab === 'details' ? 'primary' : 'secondary'} size="sm" onClick={() => setPanelTab('details')} type="button">
          Details
        </Button>
        <Button variant={panelTab === 'interview' ? 'primary' : 'secondary'} size="sm" onClick={() => setPanelTab('interview')} type="button">
          Interview
        </Button>
        <Button
          variant={panelTab === 'history' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setPanelTab('history')}
          type="button"
        >
          History
        </Button>
      </div>

      <div className="mt-4 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3 text-sm text-[var(--text-secondary)]">
        {panelTab === 'details' && selectedApplication ? (
          <div>
            <div className="space-y-1">
              <div>
                <strong className="text-[var(--text-primary)]">Status:</strong> {selectedApplication.status}
              </div>
              <div>
                <strong className="text-[var(--text-primary)]">Date Applied:</strong>{' '}
                {selectedApplication.dateApplied ?? '—'}
              </div>
              <div>
                <strong className="text-[var(--text-primary)]">Category:</strong>{' '}
                {selectedApplication.companyCategory ?? '—'}
              </div>
              <div>
                <strong className="text-[var(--text-primary)]">Source:</strong>{' '}
                {selectedApplication.jobSource ?? '—'}
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <TextArea
                label="Notes"
                value={detailDraft.notes}
                onChange={(event) => setDetailDraft((current) => ({ ...current, notes: event.target.value }))}
                onBlur={() => {
                  void handleDetailBlur('notes');
                }}
                rows={3}
              />

              <TextArea
                label="Special Requirements"
                value={detailDraft.specialRequirements}
                onChange={(event) =>
                  setDetailDraft((current) => ({ ...current, specialRequirements: event.target.value }))
                }
                onBlur={() => {
                  void handleDetailBlur('specialRequirements');
                }}
                rows={3}
              />

              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs text-[var(--text-secondary)]">
                  Salary Min
                  <input
                    className="mt-1 w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1 text-sm text-[var(--text-primary)]"
                    value={detailDraft.salaryMin}
                    onChange={(event) =>
                      setDetailDraft((current) => ({ ...current, salaryMin: event.target.value }))
                    }
                    onBlur={() => {
                      void handleDetailBlur('salaryMin');
                    }}
                  />
                </label>
                <label className="block text-xs text-[var(--text-secondary)]">
                  Salary Max
                  <input
                    className="mt-1 w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1 text-sm text-[var(--text-primary)]"
                    value={detailDraft.salaryMax}
                    onChange={(event) =>
                      setDetailDraft((current) => ({ ...current, salaryMax: event.target.value }))
                    }
                    onBlur={() => {
                      void handleDetailBlur('salaryMax');
                    }}
                  />
                </label>
              </div>

              {savedField ? <div className="text-xs text-emerald-500">Saved</div> : null}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {selectedApplication.isArchived ? (
                <Button type="button" size="sm" onClick={() => setPendingAction('restore')}>
                  Restore
                </Button>
              ) : (
                <Button type="button" size="sm" variant="secondary" onClick={() => setPendingAction('archive')}>
                  Archive
                </Button>
              )}
              <Button type="button" size="sm" variant="danger" onClick={() => setPendingAction('delete')}>
                Delete
              </Button>
            </div>
          </div>
        ) : null}
        {panelTab === 'details' && !selectedApplication ? 'Select an application to view details.' : null}
        {panelTab === 'interview' && selectedApplication ? (
          <InterviewStageList appId={selectedApplication.id} stages={selectedApplication.interviewStages} />
        ) : null}
        {panelTab === 'interview' && !selectedApplication ? 'Select an application to manage interview stages.' : null}
        {panelTab === 'history' && selectedApplication ? (
          <HistoryPanel applicationId={selectedApplication.id} />
        ) : null}
        {panelTab === 'history' && !selectedApplication ? 'Select an application to view history.' : null}
      </div>

      <ConfirmDialog
        open={pendingAction != null}
        title={
          pendingAction === 'delete'
            ? 'Delete application?'
            : pendingAction === 'restore'
              ? 'Restore application?'
              : 'Archive application?'
        }
        message={
          pendingAction === 'delete'
            ? `Permanently delete ${selectedApplication?.companyName ?? 'this application'}?`
            : pendingAction === 'restore'
              ? `Restore ${selectedApplication?.companyName ?? 'this application'} to active applications?`
              : `Archive ${selectedApplication?.companyName ?? 'this application'}?`
        }
        confirmLabel={pendingAction === 'delete' ? 'Delete' : 'Confirm'}
        variant={pendingAction === 'delete' ? 'danger' : 'default'}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          void handleConfirm();
        }}
      />
      </aside>
    </>
  );
}
