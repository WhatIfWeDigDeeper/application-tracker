import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useBlocker, useLocation } from 'react-router-dom';
import { ApplicationForm } from '@/components/applications/ApplicationForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { InterviewStageList } from '@/components/interviews/InterviewStageList';
import { useApplicationStore } from '@/stores/applicationStore';
import { useUiStore } from '@/stores/uiStore';
import type { CreateApplicationInput, UpdateApplicationInput } from '@/types/application';

export default function ApplicationEditPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [createStageDraft, setCreateStageDraft] = useState<string[]>([]);
  const [formResetKey, setFormResetKey] = useState(0);
  const allowProgrammaticNavigationRef = useRef(false);

  const selectedApplication = useApplicationStore((state) => state.selectedApplication);
  const selectedLoading = useApplicationStore((state) => state.selectedLoading);
  const error = useApplicationStore((state) => state.error);
  const createApplication = useApplicationStore((state) => state.createApplication);
  const updateApplication = useApplicationStore((state) => state.updateApplication);
  const deleteApplication = useApplicationStore((state) => state.deleteApplication);
  const loadSelectedApplication = useApplicationStore((state) => state.loadSelectedApplication);
  const addDefaultStages = useApplicationStore((state) => state.addDefaultStages);
  const addStage = useApplicationStore((state) => state.addStage);
  const openPanel = useUiStore((state) => state.openPanel);

  useEffect(() => {
    if (id) {
      void loadSelectedApplication(id);
    }
  }, [id, loadSelectedApplication]);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (allowProgrammaticNavigationRef.current) {
      return false;
    }

    if (!isDirty) {
      return false;
    }

    return currentLocation.pathname !== nextLocation.pathname;
  });

  const navigateAfterSave = (path: string) => {
    allowProgrammaticNavigationRef.current = true;
    setIsDirty(false);
    navigate(path);
  };

  useEffect(() => {
    allowProgrammaticNavigationRef.current = false;
  }, [location.pathname]);

  const canRenderForm = !id || (!!selectedApplication && !selectedLoading);

  const handleSubmit = async (payload: CreateApplicationInput | UpdateApplicationInput) => {
    setSaving(true);
    setSubmitError(null);
    try {
      if (id) {
        await updateApplication(id, payload as UpdateApplicationInput);
      } else {
        const created = await createApplication(payload as CreateApplicationInput);
        if (createStageDraft.length > 0) {
          await Promise.all(createStageDraft.map((name, index) => addStage(created.id, { name, order: index })));
        }
        navigateAfterSave(`/applications/${created.id}`);
      }
      if (id) {
        setIsDirty(false);
      }
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : 'Failed to save application');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <h1 style={{ margin: 0 }}>{id ? 'Edit Application' : 'New Application'}</h1>
      <Button variant="ghost" size="sm" type="button" onClick={() => navigate('/')}>
        Back to List
      </Button>
      <p style={{ color: 'var(--text-secondary)' }}>
        {id ? 'Update application details and track changes.' : 'Create a new application entry.'}
      </p>

      {selectedLoading ? <p>Loading application...</p> : null}
      {error ? <p style={{ color: 'var(--status-rejected)' }}>{error}</p> : null}
      {submitError ? <p style={{ color: 'var(--status-rejected)' }}>{submitError}</p> : null}

      <div className="mt-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
        {canRenderForm ? (
          <ApplicationForm
            key={`${formResetKey}-${selectedApplication?.updatedAt ?? 'new'}`}
            mode={id ? 'edit' : 'create'}
            initialValues={id ? selectedApplication ?? undefined : undefined}
            onSubmit={handleSubmit}
            onTransitionToInterviewing={
              id
                ? async () => {
                    await addDefaultStages(id);
                  }
                : undefined
            }
            saving={saving}
            onCancel={(formIsDirty) => {
              if (formIsDirty || isDirty) {
                setShowDiscardDialog(true);
                return;
              }
              navigate('/');
            }}
            onDirtyChange={setIsDirty}
            onCreateStagesDraftChange={setCreateStageDraft}
          />
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">Loading application...</p>
        )}
      </div>

      {id && selectedApplication ? (
        <div className="mt-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
          <InterviewStageList appId={selectedApplication.id} stages={selectedApplication.interviewStages} />
        </div>
      ) : null}

      <Button
        style={{ marginTop: '0.75rem' }}
        onClick={() => openPanel('history')}
        type="button"
        variant="secondary"
      >
        History
      </Button>

      {id ? (
        <Button
          style={{ marginTop: '0.75rem', marginLeft: '0.5rem' }}
          onClick={() => setShowDeleteDialog(true)}
          type="button"
          variant="danger"
        >
          Delete
        </Button>
      ) : null}

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Leave this page?"
        message="You have unsaved changes that will be lost."
        confirmLabel="Leave"
        cancelLabel="Stay"
        variant="danger"
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />

      <ConfirmDialog
        open={showDiscardDialog}
        title="Discard changes?"
        message="Unsaved changes will be lost."
        confirmLabel="Discard"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          setShowDiscardDialog(false);
          setIsDirty(false);
          setFormResetKey((current) => current + 1);
        }}
        onCancel={() => setShowDiscardDialog(false)}
      />

      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete application?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          if (!id) {
            return;
          }
          void (async () => {
            setShowDeleteDialog(false);
            try {
              await deleteApplication(id);
              navigateAfterSave('/');
            } catch (caught) {
              setSubmitError(caught instanceof Error ? caught.message : 'Failed to delete application');
            }
          })();
        }}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </section>
  );
}
