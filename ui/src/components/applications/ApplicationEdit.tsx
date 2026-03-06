'use client';

import { useState, useEffect, useCallback, useRef, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type {
  JobApplication,
  ApplicationStatus,
  CompanyCategory,
  JobSource,
  InterviewStage,
  InterviewStageInput,
  UpdateInterviewStageInput,
} from '@/types/application';
import { applicationsApi, stagesApi } from '@/services/api';
import { logger } from '@/lib/logger';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UrlFieldInput } from '@/components/applications/UrlFieldInput';
import { StageForm } from '@/components/interviews/StageForm';
import { InterviewStage as InterviewStageComponent } from '@/components/interviews/InterviewStage';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { HistoryPanel } from '@/components/applications/HistoryPanel';
import { PlusIcon } from '@/assets/icons/PlusIcon';
import { getCurrentDateISO, generateId, cn } from '@/lib/utils';
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  COMPANY_CATEGORIES,
  CATEGORY_LABELS,
  JOB_SOURCES,
  SOURCE_LABELS,
} from '@/lib/constants';

// ============================================================================
// Types
// ============================================================================

interface FormState {
  companyName: string;
  positionTitle: string;
  dateApplied: string;
  status: ApplicationStatus;
  companyUrl: string;
  jobPostingUrl: string;
  companyCareerUrl: string;
  companyCategory: string;
  skillsMatch: number | null;
  jobSource: string;
  coverLetterRequired: boolean;
  salaryMin: string;
  salaryMax: string;
  specialRequirements: string;
  notes: string;
  offerDueDate: string;
}

export interface ApplicationEditProps {
  applicationId?: string;
}

// ============================================================================
// Helpers
// ============================================================================

function createDefaultFormState(): FormState {
  return {
    companyName: '',
    positionTitle: '',
    dateApplied: '',
    status: 'unsubmitted',
    companyUrl: '',
    jobPostingUrl: '',
    companyCareerUrl: '',
    companyCategory: '',
    skillsMatch: null,
    jobSource: '',
    coverLetterRequired: false,
    salaryMin: '',
    salaryMax: '',
    specialRequirements: '',
    notes: '',
    offerDueDate: '',
  };
}

function populateFromApplication(app: JobApplication): FormState {
  return {
    companyName: app.companyName,
    positionTitle: app.positionTitle,
    dateApplied: app.dateApplied ? app.dateApplied.split('T')[0] ?? '' : '',
    status: app.status,
    companyUrl: app.companyUrl || '',
    jobPostingUrl: app.jobPostingUrl || '',
    companyCareerUrl: app.companyCareerUrl || '',
    companyCategory: app.companyCategory || '',
    skillsMatch: app.skillsMatch ?? null,
    jobSource: app.jobSource || '',
    coverLetterRequired: app.coverLetterRequired || false,
    salaryMin: app.salaryMin?.toString() || '',
    salaryMax: app.salaryMax?.toString() || '',
    specialRequirements: app.specialRequirements || '',
    notes: app.notes || '',
    offerDueDate: app.offerDueDate ? app.offerDueDate.split('T')[0] ?? '' : '',
  };
}

function isValidUrl(url: string): boolean {
  if (!url) return true;
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}

// ============================================================================
// Component
// ============================================================================

export function ApplicationEdit({ applicationId }: ApplicationEditProps): React.ReactElement {
  const router = useRouter();
  const isEditMode = !!applicationId;

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [form, setForm] = useState<FormState>(createDefaultFormState);
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Snapshot for dirty tracking
  const snapshotRef = useRef<string>('');

  // Local stages for create mode
  const [localStages, setLocalStages] = useState<InterviewStage[]>([]);

  // UI state
  const [showStageForm, setShowStageForm] = useState(false);
  const [editingStage, setEditingStage] = useState<InterviewStage | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);

  // ---------------------------------------------------------------------------
  // Dirty tracking
  // ---------------------------------------------------------------------------
  const captureSnapshot = useCallback((state: FormState): string => {
    return JSON.stringify(state);
  }, []);

  const isDirty = JSON.stringify(form) !== snapshotRef.current;

  // Navigation guard
  const { setSkipGuard } = useUnsavedChanges(isDirty);

  // ---------------------------------------------------------------------------
  // Load application (edit mode)
  // ---------------------------------------------------------------------------
  const loadApplication = useCallback(async (id: string, silent = false): Promise<void> => {
    if (!silent) setIsLoading(true);
    setFetchError(null);
    try {
      const app = await applicationsApi.get(id) as JobApplication;
      setApplication(app);
      const newForm = populateFromApplication(app);
      setForm(newForm);
      snapshotRef.current = JSON.stringify(newForm);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load application';
      setFetchError(message);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (applicationId) {
      loadApplication(applicationId);
    } else {
      // Create mode: set initial snapshot
      snapshotRef.current = captureSnapshot(form);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  // ---------------------------------------------------------------------------
  // Form change handler
  // ---------------------------------------------------------------------------
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void => {
    const { name, value, type } = e.target;

    setForm((prev) => {
      if (type === 'checkbox') {
        return { ...prev, [name]: (e.target as HTMLInputElement).checked };
      }
      if (name === 'skillsMatch') {
        return { ...prev, [name]: value === '' ? null : Number(value) };
      }
      // Handle status change: sync dateApplied with unsubmitted status
      if (name === 'status') {
        if (value === 'unsubmitted') {
          return { ...prev, status: value as ApplicationStatus, dateApplied: '' };
        }
        // Transitioning FROM unsubmitted to another status: auto-fill today's date
        if (prev.status === 'unsubmitted' && !prev.dateApplied) {
          return { ...prev, status: value as ApplicationStatus, dateApplied: getCurrentDateISO() };
        }
      }
      return { ...prev, [name]: value };
    });

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // Rating handler (click-based star rating)
  const handleRatingClick = (rating: number): void => {
    setForm((prev) => ({
      ...prev,
      skillsMatch: prev.skillsMatch === rating ? null : rating,
    }));
  };

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    } else if (form.companyName.length > 200) {
      newErrors.companyName = 'Company name must be at most 200 characters';
    }

    if (!form.positionTitle.trim()) {
      newErrors.positionTitle = 'Position title is required';
    } else if (form.positionTitle.length > 200) {
      newErrors.positionTitle = 'Position title must be at most 200 characters';
    }

    if (form.companyUrl && !isValidUrl(form.companyUrl)) {
      newErrors.companyUrl = 'Invalid URL';
    }

    if (form.jobPostingUrl && !isValidUrl(form.jobPostingUrl)) {
      newErrors.jobPostingUrl = 'Invalid URL';
    }

    if (form.companyCareerUrl && !isValidUrl(form.companyCareerUrl)) {
      newErrors.companyCareerUrl = 'Invalid URL';
    }

    if (form.salaryMin && form.salaryMax) {
      const min = parseInt(form.salaryMin, 10);
      const max = parseInt(form.salaryMax, 10);
      if (!isNaN(min) && !isNaN(max) && min > max) {
        newErrors.salaryMin = 'Minimum salary must not exceed maximum';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------------------------------------------------------------------
  // Build API payload
  // ---------------------------------------------------------------------------
  const buildInput = (): Record<string, unknown> => {
    return {
      companyName: form.companyName.trim(),
      positionTitle: form.positionTitle.trim(),
      dateApplied: form.dateApplied || null,
      status: form.status,
      companyUrl: form.companyUrl || undefined,
      jobPostingUrl: form.jobPostingUrl || undefined,
      companyCareerUrl: form.companyCareerUrl || undefined,
      companyCategory: (form.companyCategory || undefined) as CompanyCategory | undefined,
      skillsMatch: form.skillsMatch || undefined,
      jobSource: (form.jobSource || undefined) as JobSource | undefined,
      coverLetterRequired: form.coverLetterRequired || undefined,
      salaryMin: form.salaryMin ? parseInt(form.salaryMin, 10) : undefined,
      salaryMax: form.salaryMax ? parseInt(form.salaryMax, 10) : undefined,
      specialRequirements: form.specialRequirements || undefined,
      notes: form.notes || undefined,
      offerDueDate: form.offerDueDate || undefined,
    };
  };

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------
  const handleSave = async (): Promise<void> => {
    if (!validate()) return;

    setIsSaving(true);
    setErrors({});

    try {
      if (isEditMode && applicationId) {
        // Edit mode: update
        const input = buildInput();
        const updatedApp = await applicationsApi.update(applicationId, input) as JobApplication;
        setApplication(updatedApp);
        const newForm = populateFromApplication(updatedApp);
        setForm(newForm);
        snapshotRef.current = JSON.stringify(newForm);
        setHistoryKey((k) => k + 1);
      } else {
        // Create mode: create application, then create local stages
        const input = buildInput();
        const created = await applicationsApi.create(input) as JobApplication;

        // Create local stages
        for (const stage of localStages) {
          await stagesApi.create(created.id, {
            name: stage.name,
            order: stage.order,
            isCompleted: stage.isCompleted,
            completedDate: stage.completedDate || undefined,
            notes: stage.notes || undefined,
            performanceRating: stage.performanceRating || undefined,
          });
        }

        setSkipGuard(true);
        router.push(`/applications/${created.id}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save application';
      setErrors((prev) => ({ ...prev, general: message }));
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Discard
  // ---------------------------------------------------------------------------
  const handleDiscardClick = (): void => {
    if (!isDirty) {
      if (isEditMode && application) {
        revertToSnapshot();
      } else {
        setSkipGuard(true);
        router.push('/');
      }
      return;
    }
    setShowDiscardConfirm(true);
  };

  const handleConfirmDiscard = (): void => {
    setShowDiscardConfirm(false);
    if (isEditMode && application) {
      revertToSnapshot();
    } else {
      setSkipGuard(true);
      router.push('/');
    }
  };

  const revertToSnapshot = (): void => {
    if (application) {
      const newForm = populateFromApplication(application);
      setForm(newForm);
      snapshotRef.current = JSON.stringify(newForm);
      setErrors({});
    }
  };

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------
  const handleDelete = async (): Promise<void> => {
    if (!applicationId) return;
    try {
      await applicationsApi.delete(applicationId);
      setSkipGuard(true);
      router.push('/');
    } catch (err: unknown) {
      logger.error('Failed to delete application:', err);
    }
    setShowDeleteConfirm(false);
  };

  // ---------------------------------------------------------------------------
  // Interview Stages
  // ---------------------------------------------------------------------------
  const stages = isEditMode && application ? application.interviewStages : localStages;
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  const handleAddStage = async (data: InterviewStageInput): Promise<void> => {
    if (isEditMode && applicationId) {
      try {
        const maxOrder = stages.length > 0 ? Math.max(...stages.map((s) => s.order)) : -1;
        await stagesApi.create(applicationId, {
          name: data.name,
          order: maxOrder + 1,
          isCompleted: data.isCompleted ?? false,
          completedDate: data.completedDate || undefined,
          notes: data.notes || undefined,
          performanceRating: data.performanceRating || undefined,
        });
        // Reload application to get updated stages
        await loadApplication(applicationId, true);
        setHistoryKey((k) => k + 1);
        setShowStageForm(false);
      } catch (err: unknown) {
        logger.error('Failed to add interview stage:', err);
      }
    } else {
      // Create mode: store locally
      const maxOrder = localStages.length > 0 ? Math.max(...localStages.map((s) => s.order)) : -1;
      const newStage: InterviewStage = {
        id: generateId(),
        name: data.name,
        order: maxOrder + 1,
        isCompleted: data.isCompleted ?? false,
        completedDate: data.completedDate,
        notes: data.notes,
        performanceRating: data.performanceRating,
      };
      setLocalStages((prev) => [...prev, newStage]);
      setShowStageForm(false);
    }
  };

  const handleUpdateStage = async (data: InterviewStageInput): Promise<void> => {
    if (!editingStage) return;

    if (isEditMode && applicationId) {
      try {
        const update: UpdateInterviewStageInput = {};
        if (data.name !== editingStage.name) update.name = data.name;
        if ((data.isCompleted ?? false) !== editingStage.isCompleted) update.isCompleted = data.isCompleted ?? false;
        if (data.completedDate !== editingStage.completedDate) update.completedDate = data.completedDate;
        if (data.notes !== editingStage.notes) update.notes = data.notes;
        if (data.performanceRating !== editingStage.performanceRating) update.performanceRating = data.performanceRating;

        if (Object.keys(update).length > 0) {
          await stagesApi.update(applicationId, editingStage.id, update);
          await loadApplication(applicationId, true);
          setHistoryKey((k) => k + 1);
        }
        setEditingStage(null);
      } catch (err: unknown) {
        logger.error('Failed to update interview stage:', err);
      }
    } else {
      // Create mode: update locally
      setLocalStages((prev) =>
        prev.map((s) =>
          s.id === editingStage.id
            ? {
                ...s,
                name: data.name,
                isCompleted: data.isCompleted ?? false,
                completedDate: data.completedDate,
                notes: data.notes,
                performanceRating: data.performanceRating,
              }
            : s
        )
      );
      setEditingStage(null);
    }
  };

  const handleDeleteStage = async (): Promise<void> => {
    if (!editingStage) return;

    if (isEditMode && applicationId) {
      try {
        await stagesApi.delete(applicationId, editingStage.id);
        await loadApplication(applicationId, true);
        setHistoryKey((k) => k + 1);
      } catch (err: unknown) {
        logger.error('Failed to delete interview stage:', err);
      }
    } else {
      // Create mode: remove locally
      setLocalStages((prev) => prev.filter((s) => s.id !== editingStage.id));
    }
    setEditingStage(null);
  };

  const handleToggleStageComplete = async (stageId: string): Promise<void> => {
    const stage = stages.find((s) => s.id === stageId);
    if (!stage) return;

    const newIsCompleted = !stage.isCompleted;
    const update: UpdateInterviewStageInput = {
      isCompleted: newIsCompleted,
      completedDate: newIsCompleted ? getCurrentDateISO() : undefined,
    };

    if (isEditMode && applicationId) {
      try {
        await stagesApi.update(applicationId, stageId, update);
        await loadApplication(applicationId, true);
        setHistoryKey((k) => k + 1);
      } catch (err: unknown) {
        logger.error('Failed to toggle stage completion:', err);
      }
    } else {
      // Create mode: toggle locally
      setLocalStages((prev) =>
        prev.map((s) =>
          s.id === stageId
            ? {
                ...s,
                isCompleted: newIsCompleted,
                completedDate: newIsCompleted ? getCurrentDateISO() : undefined,
              }
            : s
        )
      );
    }
  };

  const handleEditStage = (stage: InterviewStage): void => {
    setEditingStage(stage);
    setShowStageForm(false);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // Loading state
  if (isEditMode && isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Error state
  if (isEditMode && fetchError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
        {fetchError}
        <Link href="/" className="mt-2 block text-blue-600 dark:text-blue-400 hover:underline">
          Go back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header area */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Left: Back to list */}
        <Link
          href="/"
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <svg
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to List
        </Link>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-2">
          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={isSaving || (isEditMode && !isDirty)}
            isLoading={isSaving}
          >
            {isEditMode ? 'Save Changes' : 'Create Application'}
          </Button>

          {/* Discard (only when dirty) */}
          {isDirty && (
            <Button
              variant="secondary"
              onClick={handleDiscardClick}
              disabled={isSaving}
            >
              Discard
            </Button>
          )}

          {/* History (edit mode only) */}
          {isEditMode && (
            <Button
              variant="secondary"
              onClick={() => setShowHistory(true)}
            >
              History
            </Button>
          )}

          {/* Delete (edit mode only) */}
          {isEditMode && (
            <Button
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Error summary */}
      {errors.general && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400">
          {errors.general}
        </div>
      )}

      {/* Main card */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700 p-6">
        {/* Company Name (large) */}
        <div className="mb-4">
          <input
            type="text"
            name="companyName"
            value={form.companyName}
            onChange={handleChange}
            placeholder="Company Name *"
            className={cn(
              'block w-full rounded-md shadow-sm text-xl font-semibold',
              'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
              'dark:border-slate-600 dark:focus:border-blue-400 dark:focus:ring-blue-400',
              'placeholder:text-gray-400 dark:placeholder:text-slate-500',
              'px-3 py-2 text-gray-900 bg-white',
              'dark:text-slate-100 dark:bg-slate-800',
              errors.companyName && 'border-red-500 focus:border-red-500 focus:ring-red-500'
            )}
          />
          {errors.companyName && (
            <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
          )}
        </div>

        {/* Position Title */}
        <div className="mb-4">
          <input
            type="text"
            name="positionTitle"
            value={form.positionTitle}
            onChange={handleChange}
            placeholder="Position Title *"
            className={cn(
              'block w-full rounded-md shadow-sm',
              'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
              'dark:border-slate-600 dark:focus:border-blue-400 dark:focus:ring-blue-400',
              'placeholder:text-gray-400 dark:placeholder:text-slate-500',
              'px-3 py-2 text-base text-gray-900 bg-white',
              'dark:text-slate-100 dark:bg-slate-800',
              errors.positionTitle && 'border-red-500 focus:border-red-500 focus:ring-red-500'
            )}
          />
          {errors.positionTitle && (
            <p className="mt-1 text-sm text-red-600">{errors.positionTitle}</p>
          )}
        </div>

        {/* Date Applied | Status */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="dateApplied" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
              Date Applied
            </label>
            <input
              type="date"
              id="dateApplied"
              name="dateApplied"
              value={form.dateApplied}
              onChange={handleChange}
              disabled={form.status === 'unsubmitted'}
              className={cn(
                'block w-full rounded-md shadow-sm',
                'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                'dark:border-slate-600 dark:focus:border-blue-400 dark:focus:ring-blue-400',
                'disabled:bg-gray-100 disabled:cursor-not-allowed dark:disabled:bg-slate-800',
                'px-3 py-2 text-base text-gray-900 bg-white',
                'dark:text-slate-100 dark:bg-slate-800'
              )}
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={form.status}
              onChange={handleChange}
              className={cn(
                'block w-full rounded-md shadow-sm',
                'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                'dark:border-slate-600 dark:focus:border-blue-400 dark:focus:ring-blue-400',
                'px-3 py-2 text-base text-gray-900 bg-white',
                'dark:text-slate-100 dark:bg-slate-800'
              )}
            >
              {APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column: Company Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Company Info
            </h3>

            {/* Company Category */}
            <div>
              <label htmlFor="companyCategory" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                Company Category
              </label>
              <select
                id="companyCategory"
                name="companyCategory"
                value={form.companyCategory}
                onChange={handleChange}
                className={cn(
                  'block w-full rounded-md shadow-sm',
                  'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                  'dark:border-slate-600 dark:focus:border-blue-400 dark:focus:ring-blue-400',
                  'px-3 py-2 text-base text-gray-900 bg-white',
                  'dark:text-slate-100 dark:bg-slate-800'
                )}
              >
                <option value="">Select category</option>
                {COMPANY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>

            {/* Company Website */}
            <UrlFieldInput
              label="Company Website"
              name="companyUrl"
              value={form.companyUrl}
              placeholder="https://example.com"
              error={errors.companyUrl}
              onChange={handleChange}
            />

            {/* Career Page URL */}
            <UrlFieldInput
              label="Career Page URL"
              name="companyCareerUrl"
              value={form.companyCareerUrl}
              placeholder="https://example.com/careers"
              error={errors.companyCareerUrl}
              onChange={handleChange}
            />

            {/* Job Posting URL */}
            <UrlFieldInput
              label="Job Posting URL"
              name="jobPostingUrl"
              value={form.jobPostingUrl}
              placeholder="https://linkedin.com/jobs/..."
              error={errors.jobPostingUrl}
              onChange={handleChange}
            />
          </div>

          {/* Right column: Application Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Application Details
            </h3>

            {/* Job Source */}
            <div>
              <label htmlFor="jobSource" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                Job Source
              </label>
              <select
                id="jobSource"
                name="jobSource"
                value={form.jobSource}
                onChange={handleChange}
                className={cn(
                  'block w-full rounded-md shadow-sm',
                  'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                  'dark:border-slate-600 dark:focus:border-blue-400 dark:focus:ring-blue-400',
                  'px-3 py-2 text-base text-gray-900 bg-white',
                  'dark:text-slate-100 dark:bg-slate-800'
                )}
              >
                <option value="">Select source</option>
                {JOB_SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {SOURCE_LABELS[source]}
                  </option>
                ))}
              </select>
            </div>

            {/* Skills Match */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                Skills Match
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleRatingClick(rating)}
                    className={cn(
                      'w-8 h-8 rounded transition-colors',
                      form.skillsMatch !== null && rating <= form.skillsMatch
                        ? 'text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-300'
                    )}
                    aria-label={`Rate ${rating} out of 5`}
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
                {form.skillsMatch !== null && (
                  <span className="ml-2 text-sm text-gray-500 dark:text-slate-400">
                    {form.skillsMatch} / 5
                  </span>
                )}
              </div>
            </div>

            {/* Salary range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="salaryMin" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                  Min Salary
                </label>
                <input
                  type="number"
                  id="salaryMin"
                  name="salaryMin"
                  value={form.salaryMin}
                  onChange={handleChange}
                  className={cn(
                    'block w-full rounded-md shadow-sm',
                    'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                    'dark:border-slate-600 dark:focus:border-blue-400 dark:focus:ring-blue-400',
                    'px-3 py-2 text-base text-gray-900 bg-white',
                    'dark:text-slate-100 dark:bg-slate-800',
                    errors.salaryMin && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  )}
                  placeholder="120000"
                />
                {errors.salaryMin && (
                  <p className="mt-1 text-sm text-red-600">{errors.salaryMin}</p>
                )}
              </div>
              <div>
                <label htmlFor="salaryMax" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                  Max Salary
                </label>
                <input
                  type="number"
                  id="salaryMax"
                  name="salaryMax"
                  value={form.salaryMax}
                  onChange={handleChange}
                  className={cn(
                    'block w-full rounded-md shadow-sm',
                    'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                    'dark:border-slate-600 dark:focus:border-blue-400 dark:focus:ring-blue-400',
                    'px-3 py-2 text-base text-gray-900 bg-white',
                    'dark:text-slate-100 dark:bg-slate-800',
                    errors.salaryMax && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  )}
                  placeholder="150000"
                />
                {errors.salaryMax && (
                  <p className="mt-1 text-sm text-red-600">{errors.salaryMax}</p>
                )}
              </div>
            </div>

            {/* Cover Letter Required */}
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="coverLetterRequired"
                  name="coverLetterRequired"
                  checked={form.coverLetterRequired}
                  onChange={handleChange}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Cover letter required</span>
              </label>
            </div>
          </div>
        </div>

        {/* Full-width fields below the grid */}
        <div className="mt-6 space-y-4">
          {/* Special Requirements */}
          <div>
            <label htmlFor="specialRequirements" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
              Special Requirements
            </label>
            <textarea
              id="specialRequirements"
              name="specialRequirements"
              rows={3}
              value={form.specialRequirements}
              onChange={handleChange}
              className={cn(
                'block w-full rounded-md shadow-sm resize-y',
                'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                'dark:border-slate-600 dark:focus:border-blue-400 dark:focus:ring-blue-400',
                'placeholder:text-gray-400 dark:placeholder:text-slate-500',
                'px-3 py-2 text-base text-gray-900 bg-white',
                'dark:text-slate-100 dark:bg-slate-800'
              )}
              placeholder="Portfolio required, specific skills..."
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              value={form.notes}
              onChange={handleChange}
              className={cn(
                'block w-full rounded-md shadow-sm resize-y',
                'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                'dark:border-slate-600 dark:focus:border-blue-400 dark:focus:ring-blue-400',
                'placeholder:text-gray-400 dark:placeholder:text-slate-500',
                'px-3 py-2 text-base text-gray-900 bg-white',
                'dark:text-slate-100 dark:bg-slate-800'
              )}
              placeholder="Referral info, interview prep notes..."
            />
          </div>

          {/* Offer Due Date (only when status is 'given offer') */}
          {form.status === 'given offer' && (
            <div>
              <label htmlFor="offerDueDate" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                Offer Due Date
              </label>
              <input
                type="date"
                id="offerDueDate"
                name="offerDueDate"
                value={form.offerDueDate}
                onChange={handleChange}
                className={cn(
                  'block w-full rounded-md shadow-sm',
                  'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                  'dark:border-slate-600 dark:focus:border-blue-400 dark:focus:ring-blue-400',
                  'px-3 py-2 text-base text-gray-900 bg-white',
                  'dark:text-slate-100 dark:bg-slate-800'
                )}
              />
            </div>
          )}
        </div>
      </div>

      {/* Interview Stages card */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Interview Stages
          </h2>
          {!showStageForm && !editingStage && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowStageForm(true)}
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Stage
            </Button>
          )}
        </div>

        {/* Add Stage Form (inline) */}
        {showStageForm && (
          <div className="mb-4">
            <InlineStageForm
              onSubmit={handleAddStage}
              onCancel={() => setShowStageForm(false)}
            />
          </div>
        )}

        {/* Stage List */}
        {sortedStages.length > 0 ? (
          <div className="space-y-3">
            {sortedStages.map((stage) => (
              editingStage?.id === stage.id ? (
                <div key={stage.id}>
                  <StageForm
                    stage={stage}
                    onSubmit={handleUpdateStage}
                    onCancel={() => setEditingStage(null)}
                    onDelete={handleDeleteStage}
                    mode="edit"
                  />
                </div>
              ) : (
                <InterviewStageComponent
                  key={stage.id}
                  stage={stage}
                  onToggleComplete={handleToggleStageComplete}
                  onEdit={handleEditStage}
                />
              )
            ))}
          </div>
        ) : (
          !showStageForm && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-6">
              No interview stages added yet.
            </p>
          )
        )}
      </div>

      {/* Discard Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={handleConfirmDiscard}
        title="Discard changes?"
        message="You have unsaved changes. Are you sure you want to discard them?"
        confirmLabel="Discard"
        variant="warning"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Application"
        message="Are you sure you want to delete this application? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />

      {/* History Panel */}
      {showHistory && applicationId && (
        <HistoryPanel
          applicationId={applicationId}
          refreshKey={historyKey}
          onClose={() => setShowHistory(false)}
          onRestored={() => {
            loadApplication(applicationId);
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// Inline Stage Form (simplified for the "Add Stage" flow)
// ============================================================================

interface InlineStageFormProps {
  onSubmit: (data: InterviewStageInput) => void;
  onCancel: () => void;
}

function InlineStageForm({ onSubmit, onCancel }: InlineStageFormProps): React.ReactElement {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Stage name is required');
      return;
    }
    onSubmit({ name: name.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700/50">
      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          placeholder="Phone Screen, Technical Interview..."
          className={cn(
            'block w-full rounded-md shadow-sm',
            'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
            'dark:border-slate-600 dark:focus:border-blue-400 dark:focus:ring-blue-400',
            'placeholder:text-gray-400 dark:placeholder:text-slate-500',
            'px-3 py-2 text-base text-gray-900 bg-white',
            'dark:text-slate-100 dark:bg-slate-800',
            error && 'border-red-500'
          )}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm">
          Add Stage
        </Button>
      </div>
    </form>
  );
}
