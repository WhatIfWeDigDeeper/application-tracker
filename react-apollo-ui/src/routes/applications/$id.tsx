import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_APPLICATION, GET_HISTORY } from '../../graphql/queries.js';
import {
  UPDATE_APPLICATION, DELETE_APPLICATION, ARCHIVE_APPLICATION,
  RESTORE_APPLICATION, CREATE_STAGE, UPDATE_STAGE, DELETE_STAGE, RESTORE_HISTORY,
} from '../../graphql/mutations.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { Spinner } from '../../components/ui/Spinner.js';
import type { Application, ApplicationStatus, InterviewStage, HistoryEntry } from '../../types/application.js';

export const Route = createFileRoute('/applications/$id')({
  component: ApplicationDetailPage,
});

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: 'wishlist', label: 'Wishlist' },
  { value: 'applied', label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'archived', label: 'Archived' },
];

function ApplicationDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const { data, loading, error, refetch } = useQuery(GET_APPLICATION, { variables: { id } });
  const app: Application | null = data?.application ?? null;

  const [form, setForm] = useState({
    companyName: '', positionTitle: '', status: 'wishlist' as ApplicationStatus,
    dateApplied: '', jobPostingUrl: '', companyWebsiteUrl: '',
    salaryMin: '', salaryMax: '', skillsMatch: '', notes: '',
    contactName: '', contactEmail: '', offerDueDate: '',
  });
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAddStage, setShowAddStage] = useState(false);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [stageForm, setStageForm] = useState({ stageName: '', stageOrder: '1', scheduledDate: '', notes: '' });

  useEffect(() => {
    if (app) {
      setForm({
        companyName: app.companyName, positionTitle: app.positionTitle,
        status: app.status, dateApplied: app.dateApplied ?? '',
        jobPostingUrl: app.jobPostingUrl ?? '', companyWebsiteUrl: app.companyWebsiteUrl ?? '',
        salaryMin: app.salaryMin?.toString() ?? '', salaryMax: app.salaryMax?.toString() ?? '',
        skillsMatch: app.skillsMatch?.toString() ?? '', notes: app.notes ?? '',
        contactName: app.contactName ?? '', contactEmail: app.contactEmail ?? '',
        offerDueDate: app.offerDueDate ?? '',
      });
      setIsDirty(false);
    }
  }, [app]);

  const [updateApp, { loading: saving }] = useMutation(UPDATE_APPLICATION);
  const [deleteApp] = useMutation(DELETE_APPLICATION);
  const [archiveApp] = useMutation(ARCHIVE_APPLICATION, { onCompleted: () => refetch() });
  const [restoreApp] = useMutation(RESTORE_APPLICATION, { onCompleted: () => refetch() });
  const [createStage] = useMutation(CREATE_STAGE, { onCompleted: () => { refetch(); setShowAddStage(false); setStageForm({ stageName: '', stageOrder: '1', scheduledDate: '', notes: '' }); } });
  const [updateStage] = useMutation(UPDATE_STAGE, { onCompleted: () => { refetch(); setEditingStageId(null); } });
  const [deleteStage] = useMutation(DELETE_STAGE, { onCompleted: () => refetch() });
  const [restoreHistory] = useMutation(RESTORE_HISTORY, { onCompleted: () => { refetch(); setShowHistory(false); } });

  const updateField = <K extends keyof typeof form>(field: K, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'status') {
        if (value === 'wishlist') next.dateApplied = '';
        else if (prev.status === 'wishlist' && !prev.dateApplied) {
          const today = new Date().toISOString().split('T')[0];
          next.dateApplied = today;
        }
      }
      return next;
    });
    setIsDirty(true);
  };

  const doSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!form.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!form.positionTitle.trim()) newErrors.positionTitle = 'Position title is required';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});

    try {
      await updateApp({
        variables: {
          id,
          input: {
            companyName: form.companyName.trim(), positionTitle: form.positionTitle.trim(),
            status: form.status, dateApplied: form.dateApplied || null,
            jobPostingUrl: form.jobPostingUrl || null, companyWebsiteUrl: form.companyWebsiteUrl || null,
            salaryMin: form.salaryMin ? parseInt(form.salaryMin, 10) : null,
            salaryMax: form.salaryMax ? parseInt(form.salaryMax, 10) : null,
            skillsMatch: form.skillsMatch ? parseInt(form.skillsMatch, 10) : null,
            notes: form.notes || null, contactName: form.contactName || null,
            contactEmail: form.contactEmail || null, offerDueDate: form.offerDueDate || null,
          },
        },
      });
      await refetch();
      setIsDirty(false);
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Failed to save' });
    }
  };

  const handleDelete = async () => {
    await deleteApp({ variables: { id } });
    navigate({ to: '/' });
  };

  const handleAddStage = async () => {
    await createStage({
      variables: {
        applicationId: id,
        input: {
          stageName: stageForm.stageName, stageOrder: parseInt(stageForm.stageOrder, 10),
          scheduledDate: stageForm.scheduledDate || null, notes: stageForm.notes || null,
        },
      },
    });
  };

  const handleUpdateStage = async (stageId: string) => {
    await updateStage({
      variables: {
        applicationId: id, stageId,
        input: {
          stageName: stageForm.stageName, stageOrder: parseInt(stageForm.stageOrder, 10),
          scheduledDate: stageForm.scheduledDate || null, notes: stageForm.notes || null,
        },
      },
    });
  };

  const startEditStage = (stage: InterviewStage) => {
    setEditingStageId(stage.id);
    setStageForm({
      stageName: stage.stageName, stageOrder: stage.stageOrder.toString(),
      scheduledDate: stage.scheduledDate ?? '', notes: stage.notes ?? '',
    });
  };

  if (loading && !app) return <Spinner />;
  if (error) return <div className="text-red-600 p-4">{error.message}</div>;
  if (!app) return <div className="text-gray-500 p-4">Application not found.</div>;

  const stages: InterviewStage[] = [...(app.interviewStages ?? [])].sort((a, b) => a.stageOrder - b.stageOrder);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">
          ← Back to List
        </Link>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            data-testid="application-form-save"
            onClick={doSubmit}
            disabled={saving || !isDirty}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          {isDirty && (
            <Button variant="secondary" onClick={() => { if (app) { setForm({ companyName: app.companyName, positionTitle: app.positionTitle, status: app.status, dateApplied: app.dateApplied ?? '', jobPostingUrl: app.jobPostingUrl ?? '', companyWebsiteUrl: app.companyWebsiteUrl ?? '', salaryMin: app.salaryMin?.toString() ?? '', salaryMax: app.salaryMax?.toString() ?? '', skillsMatch: app.skillsMatch?.toString() ?? '', notes: app.notes ?? '', contactName: app.contactName ?? '', contactEmail: app.contactEmail ?? '', offerDueDate: app.offerDueDate ?? '' }); setIsDirty(false); } }}>
              Discard
            </Button>
          )}
          <Button variant="secondary" onClick={() => setShowHistory(true)}>History</Button>
          {app.isArchived ? (
            <Button variant="secondary" onClick={() => restoreApp({ variables: { id } })}>Restore</Button>
          ) : (
            <Button variant="secondary" onClick={() => archiveApp({ variables: { id } })}>Archive</Button>
          )}
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>Delete</Button>
        </div>
      </div>

      {errors.general && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded text-red-700 dark:text-red-300">
          {errors.general}
        </div>
      )}

      {/* Main Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Badge status={app.status} />
          {app.isArchived && <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Archived</span>}
        </div>

        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name *</label>
          <input id="companyName" type="text" value={form.companyName}
            onChange={(e) => updateField('companyName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.companyName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} />
          {errors.companyName && <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>}
        </div>

        <div>
          <label htmlFor="positionTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position Title *</label>
          <input id="positionTitle" type="text" value={form.positionTitle}
            onChange={(e) => updateField('positionTitle', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.positionTitle ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} />
          {errors.positionTitle && <p className="mt-1 text-sm text-red-600">{errors.positionTitle}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select id="status" value={form.status} onChange={(e) => updateField('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="dateApplied" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date Applied</label>
            <input id="dateApplied" type="date" value={form.dateApplied}
              onChange={(e) => updateField('dateApplied', e.target.value)}
              disabled={form.status === 'wishlist'}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" />
          </div>
        </div>

        {form.status === 'offer' && (
          <div>
            <label htmlFor="offerDueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Offer Due Date</label>
            <input id="offerDueDate" type="date" value={form.offerDueDate}
              onChange={(e) => updateField('offerDueDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="jobPostingUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Posting URL</label>
            <input id="jobPostingUrl" type="url" value={form.jobPostingUrl}
              onChange={(e) => updateField('jobPostingUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="companyWebsiteUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Website</label>
            <input id="companyWebsiteUrl" type="url" value={form.companyWebsiteUrl}
              onChange={(e) => updateField('companyWebsiteUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="salaryMin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Salary</label>
            <input id="salaryMin" type="number" value={form.salaryMin}
              onChange={(e) => updateField('salaryMin', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="salaryMax" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Salary</label>
            <input id="salaryMax" type="number" value={form.salaryMax}
              onChange={(e) => updateField('salaryMax', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="skillsMatch" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skills Match %</label>
            <input id="skillsMatch" type="number" min="0" max="100" value={form.skillsMatch}
              onChange={(e) => updateField('skillsMatch', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Name</label>
            <input id="contactName" type="text" value={form.contactName}
              onChange={(e) => updateField('contactName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Email</label>
            <input id="contactEmail" type="email" value={form.contactEmail}
              onChange={(e) => updateField('contactEmail', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
          <textarea id="notes" value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y" />
        </div>
      </div>

      {/* Interview Stages */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Interview Stages</h2>
          <Button onClick={() => { setShowAddStage(true); setStageForm({ stageName: '', stageOrder: String((stages.length > 0 ? Math.max(...stages.map(s => s.stageOrder)) + 1 : 1)), scheduledDate: '', notes: '' }); }}>
            Add Stage
          </Button>
        </div>

        {showAddStage && (
          <StageForm
            form={stageForm}
            onChange={setStageForm}
            onSave={handleAddStage}
            onCancel={() => setShowAddStage(false)}
          />
        )}

        {stages.length === 0 && !showAddStage && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-6 text-sm">No interview stages added yet.</p>
        )}

        <div className="space-y-3 mt-3">
          {stages.map((stage) => (
            editingStageId === stage.id ? (
              <StageForm
                key={stage.id}
                form={stageForm}
                onChange={setStageForm}
                onSave={() => handleUpdateStage(stage.id)}
                onCancel={() => setEditingStageId(null)}
              />
            ) : (
              <div key={stage.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div>
                  <span className="font-medium text-sm">{stage.stageName}</span>
                  <span className="ml-2 text-xs text-gray-500">#{stage.stageOrder}</span>
                  {stage.scheduledDate && <span className="ml-2 text-xs text-gray-400">{stage.scheduledDate}</span>}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => startEditStage(stage)}
                    className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                    Edit
                  </button>
                  <button type="button" onClick={() => deleteStage({ variables: { applicationId: id, stageId: stage.id } })}
                    className="text-xs px-2 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20">
                    Delete
                  </button>
                </div>
              </div>
            )
          ))}
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <HistoryPanel
          applicationId={id}
          onClose={() => setShowHistory(false)}
          onRestore={(sequence) => restoreHistory({ variables: { applicationId: id, sequence } })}
        />
      )}

      {/* Delete Confirm */}
      <Modal
        isOpen={showDeleteConfirm}
        title="Delete Application"
        message="Are you sure you want to delete this application? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setShowDeleteConfirm(false)}
        isDestructive
      />
    </div>
  );
}

interface StageFormProps {
  form: { stageName: string; stageOrder: string; scheduledDate: string; notes: string };
  onChange: (f: { stageName: string; stageOrder: string; scheduledDate: string; notes: string }) => void;
  onSave: () => void;
  onCancel: () => void;
}

function StageForm({ form, onChange, onSave, onCancel }: StageFormProps) {
  return (
    <div className="border border-blue-200 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 mb-3">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Stage Name *</label>
          <input type="text" value={form.stageName} onChange={(e) => onChange({ ...form, stageName: e.target.value })}
            placeholder="e.g., Phone Screen"
            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Order</label>
          <input type="number" min="1" max="100" value={form.stageOrder} onChange={(e) => onChange({ ...form, stageOrder: e.target.value })}
            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
      </div>
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Scheduled Date</label>
        <input type="date" value={form.scheduledDate} onChange={(e) => onChange({ ...form, scheduledDate: e.target.value })}
          className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel}
          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
        <button type="button" onClick={onSave}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
      </div>
    </div>
  );
}

interface HistoryPanelProps {
  applicationId: string;
  onClose: () => void;
  onRestore: (sequence: number) => void;
}

function HistoryPanel({ applicationId, onClose, onRestore }: HistoryPanelProps) {
  const { data, loading } = useQuery(GET_HISTORY, { variables: { applicationId, page: 1, limit: 20 } });
  const entries: HistoryEntry[] = data?.applicationHistory?.items ?? [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">History</h2>
        <button type="button" onClick={onClose}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm">Close</button>
      </div>
      {loading && <Spinner />}
      {!loading && entries.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No history yet.</p>}
      <div className="space-y-2">
        {entries.map((entry) => {
          const changed: string[] = JSON.parse(entry.changedFields);
          return (
            <div key={entry.id} className="flex items-start justify-between p-3 border border-gray-200 dark:border-gray-600 rounded">
              <div>
                <span className="text-sm font-medium">#{entry.sequence}</span>
                <span className="ml-2 text-xs text-gray-500">{new Date(entry.createdAt).toLocaleString()}</span>
                <p className="text-xs text-gray-400 mt-0.5">{changed.join(', ')}</p>
              </div>
              <button type="button"
                onClick={() => onRestore(entry.sequence)}
                className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 shrink-0">
                Restore
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
