import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useBlocker, Link } from "@tanstack/react-router";
import type {
  Application,
  ApplicationStatus,
  CompanyCategory,
  JobSource,
  InterviewStage,
  CreateApplicationInput,
  UpdateApplicationInput,
  CreateInterviewStageInput,
  UpdateInterviewStageInput,
} from "../../types/application";
import {
  APPLICATION_STATUSES,
  COMPANY_CATEGORIES,
  JOB_SOURCES,
} from "../../lib/constants";
import { getTodayDate } from "../../lib/utils";
import { useApplication } from "../../queries/applicationQueries";
import {
  useCreateApplication,
  useUpdateApplication,
  useDeleteApplication,
  useCreateStage,
  useUpdateStage,
  useDeleteStage,
} from "../../queries/applicationMutations";
import { Button, RatingInput, ConfirmDialog, UrlFieldInput } from "../ui";
import { InterviewStageItem, InlineInterviewStageForm } from "../interviews";
import { HistoryPanel } from "./HistoryPanel";

// ---------------------------------------------------------------------------
// Form state type
// ---------------------------------------------------------------------------
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

function initialFormState(): FormState {
  return {
    companyName: "",
    positionTitle: "",
    dateApplied: "",
    status: "unsubmitted",
    companyUrl: "",
    jobPostingUrl: "",
    companyCareerUrl: "",
    companyCategory: "",
    skillsMatch: null,
    jobSource: "",
    coverLetterRequired: false,
    salaryMin: "",
    salaryMax: "",
    specialRequirements: "",
    notes: "",
    offerDueDate: "",
  };
}

function populateFromApplication(app: Application): FormState {
  return {
    companyName: app.companyName,
    positionTitle: app.positionTitle,
    dateApplied: app.dateApplied || "",
    status: app.status,
    companyUrl: app.companyUrl || "",
    jobPostingUrl: app.jobPostingUrl || "",
    companyCareerUrl: app.companyCareerUrl || "",
    companyCategory: app.companyCategory || "",
    skillsMatch: app.skillsMatch,
    jobSource: app.jobSource || "",
    coverLetterRequired: app.coverLetterRequired || false,
    salaryMin: app.salaryMin?.toString() || "",
    salaryMax: app.salaryMax?.toString() || "",
    specialRequirements: app.specialRequirements || "",
    notes: app.notes || "",
    offerDueDate: app.offerDueDate || "",
  };
}

function buildCreateInput(
  form: FormState
): CreateApplicationInput & { status?: ApplicationStatus; offerDueDate?: string | null } {
  return {
    companyName: form.companyName.trim(),
    positionTitle: form.positionTitle.trim(),
    dateApplied: form.dateApplied || undefined,
    status: form.status,
    companyUrl: form.companyUrl || undefined,
    jobPostingUrl: form.jobPostingUrl || undefined,
    companyCareerUrl: form.companyCareerUrl || undefined,
    companyCategory: (form.companyCategory || undefined) as
      | CompanyCategory
      | undefined,
    skillsMatch: form.skillsMatch || undefined,
    jobSource: (form.jobSource || undefined) as JobSource | undefined,
    coverLetterRequired: form.coverLetterRequired || undefined,
    salaryMin: form.salaryMin ? parseInt(form.salaryMin, 10) : undefined,
    salaryMax: form.salaryMax ? parseInt(form.salaryMax, 10) : undefined,
    specialRequirements: form.specialRequirements || undefined,
    notes: form.notes || undefined,
    offerDueDate: form.offerDueDate || null,
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function validate(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!form.companyName.trim()) {
    errors.companyName = "Company name is required";
  } else if (form.companyName.length > 200) {
    errors.companyName = "Company name must be at most 200 characters";
  }

  if (!form.positionTitle.trim()) {
    errors.positionTitle = "Position title is required";
  } else if (form.positionTitle.length > 200) {
    errors.positionTitle = "Position title must be at most 200 characters";
  }

  if (form.companyUrl && !isValidUrl(form.companyUrl)) {
    errors.companyUrl = "Invalid URL";
  }

  if (form.jobPostingUrl && !isValidUrl(form.jobPostingUrl)) {
    errors.jobPostingUrl = "Invalid URL";
  }

  if (form.companyCareerUrl && !isValidUrl(form.companyCareerUrl)) {
    errors.companyCareerUrl = "Invalid URL";
  }

  if (form.salaryMin && isNaN(parseInt(form.salaryMin, 10))) {
    errors.salaryMin = "Invalid number";
  }

  if (form.salaryMax && isNaN(parseInt(form.salaryMax, 10))) {
    errors.salaryMax = "Invalid number";
  }

  if (form.salaryMin && form.salaryMax) {
    const min = parseInt(form.salaryMin, 10);
    const max = parseInt(form.salaryMax, 10);
    if (!isNaN(min) && !isNaN(max) && min > max) {
      errors.salaryMin = "Minimum salary must not exceed maximum";
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// ApplicationEdit component
// ---------------------------------------------------------------------------
interface ApplicationEditProps {
  applicationId?: string;
  initialApplication?: Application;
}

export function ApplicationEdit({ applicationId, initialApplication }: ApplicationEditProps) {
  const navigate = useNavigate();
  const isEditMode = !!applicationId;

  // TanStack Query for fetching application data
  const { data: application, error: fetchQueryError, refetch } = useApplication(applicationId);
  const fetchError = fetchQueryError ? (fetchQueryError instanceof Error ? fetchQueryError.message : "Failed to load application") : null;

  // Use query data or fall back to loader data (available immediately from SSR)
  const appData = application ?? initialApplication;

  // Mutations
  const createMutation = useCreateApplication();
  const updateMutation = useUpdateApplication();
  const deleteMutation = useDeleteApplication();
  const createStageMutation = useCreateStage();
  const updateStageMutation = useUpdateStage();
  const deleteStageMutation = useDeleteStage();

  // Form state — initialized synchronously from SSR loader data if available
  const [form, setForm] = useState<FormState>(() =>
    initialApplication ? populateFromApplication(initialApplication) : initialFormState()
  );
  const [snapshot, setSnapshot] = useState(() =>
    initialApplication
      ? JSON.stringify(populateFromApplication(initialApplication))
      : JSON.stringify(initialFormState())
  );

  // Tracks whether form has been populated from application data.
  // Starts true when initialApplication is provided (SSR path), preventing the
  // populate effect from overwriting user edits on subsequent renders/refetches.
  const formInitializedRef = useRef(!!initialApplication);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [navigatingAway, setNavigatingAway] = useState(false);

  // UI state
  const [showHistory, setShowHistory] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddStageForm, setShowAddStageForm] = useState(false);
  const [editingStage, setEditingStage] = useState<{
    id: string;
    stage: InterviewStage;
  } | null>(null);

  // Local stages for create mode
  const [localStages, setLocalStages] = useState<InterviewStage[]>([]);

  // Ref to bypass navigation guard on programmatic nav
  const skipNavGuard = useRef(false);

  // -------------------------------------------------------------------------
  // Snapshot-based dirty tracking
  // -------------------------------------------------------------------------
  const captureSnapshot = useCallback((state: FormState): string => {
    return JSON.stringify(state);
  }, []);

  const isDirty = captureSnapshot(form) !== snapshot;

  // -------------------------------------------------------------------------
  // Populate form from loaded application
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Only populate from query data when no SSR loader data was provided.
    // When initialApplication is present the form is already initialized from it,
    // and re-populating here would overwrite in-progress user edits.
    if (isEditMode && application && !initialApplication && !formInitializedRef.current) {
      formInitializedRef.current = true;
      const populated = populateFromApplication(application);
      setForm(populated);
      setSnapshot(captureSnapshot(populated));
    }
  }, [isEditMode, application, initialApplication, captureSnapshot]);

  // -------------------------------------------------------------------------
  // Navigation guard (TanStack Router useBlocker)
  // -------------------------------------------------------------------------
  useBlocker({
    shouldBlockFn: () => {
      if (skipNavGuard.current || !isDirty) return false;
      return !window.confirm("You have unsaved changes. Are you sure you want to leave?");
    },
  });

  // beforeunload guard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // -------------------------------------------------------------------------
  // Form change helpers
  // -------------------------------------------------------------------------
  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Date↔status enforcement
      if (field === "status") {
        if (value === "unsubmitted") {
          next.dateApplied = "";
        } else if (prev.status === "unsubmitted" && !prev.dateApplied) {
          next.dateApplied = getTodayDate();
        }
      }
      return next;
    });
  };

  // -------------------------------------------------------------------------
  // Save
  // -------------------------------------------------------------------------
  const handleSave = async () => {
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSaving(true);
    setErrors({});

    try {
      if (isEditMode && applicationId) {
        const input = buildCreateInput(form) as UpdateApplicationInput;
        const updated = await updateMutation.mutateAsync({ id: applicationId, data: input });
        const populated = populateFromApplication(updated);
        setForm(populated);
        setSnapshot(captureSnapshot(populated));
      } else {
        const input = buildCreateInput(form);
        const created = await createMutation.mutateAsync(
          input as CreateApplicationInput
        );

        // Create any local stages
        for (const stage of localStages) {
          await createStageMutation.mutateAsync({
            applicationId: created.id,
            input: {
              name: stage.name,
              order: stage.order,
              isCompleted: stage.isCompleted,
              completedDate: stage.completedDate || undefined,
              notes: stage.notes || undefined,
              performanceRating: stage.performanceRating || undefined,
            },
          });
        }

        skipNavGuard.current = true;
        setNavigatingAway(true);
        navigate({ to: "/applications/$id", params: { id: created.id } });
        return;
      }
    } catch (err) {
      setErrors({
        general:
          err instanceof Error ? err.message : "Failed to save application",
      });
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // Discard
  // -------------------------------------------------------------------------
  const handleDiscardClick = () => {
    if (!isDirty) {
      if (isEditMode && appData) {
        const populated = populateFromApplication(appData);
        setForm(populated);
        setSnapshot(captureSnapshot(populated));
      } else {
        skipNavGuard.current = true;
        navigate({ to: "/" });
      }
      return;
    }
    setShowDiscardConfirm(true);
  };

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false);
    if (isEditMode && appData) {
      const populated = populateFromApplication(appData);
      setForm(populated);
      setSnapshot(captureSnapshot(populated));
    } else {
      skipNavGuard.current = true;
      navigate({ to: "/" });
    }
  };

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------
  const handleDelete = async () => {
    if (!applicationId) return;
    try {
      await deleteMutation.mutateAsync(applicationId);
      skipNavGuard.current = true;
      navigate({ to: "/" });
    } catch (err) {
      void err;
    }
    setShowDeleteConfirm(false);
  };

  // -------------------------------------------------------------------------
  // Interview stage handlers
  // -------------------------------------------------------------------------
  const sortedStages = (() => {
    if (isEditMode && appData) {
      return [...appData.interviewStages].sort((a, b) => a.order - b.order);
    }
    return [...localStages].sort((a, b) => a.order - b.order);
  })();

  const nextOrder =
    sortedStages.length > 0
      ? Math.max(...sortedStages.map((s) => s.order)) + 1
      : 0;

  const handleAddStage = async (
    input: CreateInterviewStageInput | UpdateInterviewStageInput
  ) => {
    if (isEditMode && applicationId) {
      try {
        await createStageMutation.mutateAsync({
          applicationId,
          input: input as CreateInterviewStageInput,
        });
        await refetch();
        setShowAddStageForm(false);
      } catch (err) {
        void err;
      }
    } else {
      const stageInput = input as CreateInterviewStageInput;
      const newStage: InterviewStage = {
        id: crypto.randomUUID(),
        name: stageInput.name,
        order: stageInput.order,
        isCompleted: stageInput.isCompleted || false,
        completedDate: stageInput.completedDate || null,
        notes: stageInput.notes || null,
        performanceRating: stageInput.performanceRating || null,
      };
      setLocalStages((prev) => [...prev, newStage]);
      setShowAddStageForm(false);
    }
  };

  const handleUpdateStage = async (
    stageId: string,
    input: UpdateInterviewStageInput
  ) => {
    if (isEditMode && applicationId) {
      try {
        await updateStageMutation.mutateAsync({
          applicationId,
          stageId,
          input,
        });
        await refetch();
        setEditingStage(null);
      } catch (err) {
        void err;
      }
    } else {
      setLocalStages((prev) =>
        prev.map((s) =>
          s.id === stageId ? ({ ...s, ...input } as InterviewStage) : s
        )
      );
      setEditingStage(null);
    }
  };

  const handleEditStage = (stageId: string) => {
    const stages = isEditMode ? appData?.interviewStages : localStages;
    const stage = stages?.find((s) => s.id === stageId);
    if (stage) {
      setEditingStage({ id: stageId, stage });
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    if (isEditMode && applicationId) {
      try {
        await deleteStageMutation.mutateAsync({
          applicationId,
          stageId,
        });
        await refetch();
      } catch (err) {
        void err;
      }
    } else {
      setLocalStages((prev) => prev.filter((s) => s.id !== stageId));
    }
  };

  const handleToggleStageComplete = async (
    stage: InterviewStage,
    isCompleted: boolean,
    completedDate?: string | null
  ) => {
    if (isEditMode && applicationId) {
      try {
        await updateStageMutation.mutateAsync({
          applicationId,
          stageId: stage.id,
          input: { isCompleted, completedDate },
        });
        await refetch();
      } catch (err) {
        void err;
      }
    } else {
      setLocalStages((prev) =>
        prev.map((s) =>
          s.id === stage.id
            ? {
                ...s,
                isCompleted,
                completedDate: isCompleted
                  ? getTodayDate()
                  : null,
              }
            : s
        )
      );
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  // After create, hide the form during navigation to prevent stale input
  // interactions (the edit page's form replaces this one after transition)
  if (navigatingAway) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </div>
    );
  }

  // Loading state — wait for TanStack Query to confirm the data, not just SSR
  // loader data. This ensures the React render is committed before Playwright
  // (or any user) interacts, avoiding concurrent-render event-loss in WebKit.
  if (isEditMode && !application) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </div>
    );
  }

  // Error state
  if (isEditMode && fetchError) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          {fetchError}
          <button
            type="button"
            className="mt-2 block text-primary-600 dark:text-primary-400 hover:underline"
            onClick={() => navigate({ to: "/" })}
          >
            Go back to list
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header area */}
      <div className="flex items-center justify-between">
        {/* Left: Back to list */}
        <Link
          to="/"
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <svg
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to List
        </Link>

        {/* Right: Action buttons */}
        <div className="flex items-center space-x-2">
          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={saving || (isEditMode && !isDirty)}
          >
            {saving
              ? "Saving..."
              : isEditMode
              ? "Save Changes"
              : "Create Application"}
          </Button>

          {/* Discard */}
          {isDirty && (
            <Button
              variant="secondary"
              onClick={handleDiscardClick}
              disabled={saving}
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {/* Company Name (large) */}
        <div className="mb-4">
          <input
            type="text"
            value={form.companyName}
            onChange={(e) => updateField("companyName", e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg shadow-xs transition-colors text-xl font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
              errors.companyName
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
            placeholder="Company Name *"
          />
          {errors.companyName && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.companyName}
            </p>
          )}
        </div>

        {/* Position Title */}
        <div className="mb-4">
          <input
            type="text"
            value={form.positionTitle}
            onChange={(e) => updateField("positionTitle", e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
              errors.positionTitle
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
            placeholder="Position Title *"
          />
          {errors.positionTitle && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.positionTitle}
            </p>
          )}
        </div>

        {/* Date Applied | Status */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label
              htmlFor="dateApplied"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Date Applied
            </label>
            <input
              id="dateApplied"
              type="date"
              value={form.dateApplied}
              onChange={(e) => updateField("dateApplied", e.target.value)}
              disabled={form.status === "unsubmitted"}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Status
            </label>
            <select
              id="status"
              value={form.status}
              onChange={(e) =>
                updateField("status", e.target.value as ApplicationStatus)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-xs transition-colors appearance-none bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              {APPLICATION_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
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
              <label
                htmlFor="companyCategory"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Company Category
              </label>
              <select
                id="companyCategory"
                value={form.companyCategory}
                onChange={(e) =>
                  updateField("companyCategory", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-xs transition-colors appearance-none bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select category</option>
                {COMPANY_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Company Website */}
            <UrlFieldInput
              label="Company Website"
              placeholder="https://example.com"
              value={form.companyUrl}
              onChange={(e) => updateField("companyUrl", e.target.value)}
              error={errors.companyUrl}
            />

            {/* Career Page URL */}
            <UrlFieldInput
              label="Career Page URL"
              placeholder="https://example.com/careers"
              value={form.companyCareerUrl}
              onChange={(e) => updateField("companyCareerUrl", e.target.value)}
              error={errors.companyCareerUrl}
            />

            {/* Job Posting URL */}
            <UrlFieldInput
              label="Job Posting URL"
              placeholder="https://linkedin.com/jobs/..."
              value={form.jobPostingUrl}
              onChange={(e) => updateField("jobPostingUrl", e.target.value)}
              error={errors.jobPostingUrl}
            />
          </div>

          {/* Right column: Application Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Application Details
            </h3>

            {/* Job Source */}
            <div>
              <label
                htmlFor="jobSource"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Job Source
              </label>
              <select
                id="jobSource"
                value={form.jobSource}
                onChange={(e) => updateField("jobSource", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-xs transition-colors appearance-none bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select source</option>
                {JOB_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Skills Match */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Skills Match
              </label>
              <div className="mt-1">
                <RatingInput
                  value={form.skillsMatch}
                  onChange={(val) => updateField("skillsMatch", val)}
                />
              </div>
            </div>

            {/* Salary range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="salaryMin"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Min Salary
                </label>
                <input
                  id="salaryMin"
                  type="number"
                  value={form.salaryMin}
                  onChange={(e) => updateField("salaryMin", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                    errors.salaryMin
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="120000"
                />
                {errors.salaryMin && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.salaryMin}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="salaryMax"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Max Salary
                </label>
                <input
                  id="salaryMax"
                  type="number"
                  value={form.salaryMax}
                  onChange={(e) => updateField("salaryMax", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                    errors.salaryMax
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="150000"
                />
                {errors.salaryMax && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.salaryMax}
                  </p>
                )}
              </div>
            </div>

            {/* Cover Letter Required */}
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.coverLetterRequired}
                  onChange={(e) =>
                    updateField("coverLetterRequired", e.target.checked)
                  }
                  className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 dark:bg-gray-800 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Cover letter required
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Full-width fields below the grid */}
        <div className="mt-6 space-y-4">
          {/* Special Requirements */}
          <div>
            <label
              htmlFor="specialRequirements"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Special Requirements
            </label>
            <textarea
              id="specialRequirements"
              value={form.specialRequirements}
              onChange={(e) =>
                updateField("specialRequirements", e.target.value)
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-xs transition-colors resize-y focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              placeholder="Portfolio required, specific skills..."
            />
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Notes
            </label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-xs transition-colors resize-y focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              placeholder="Referral info, interview prep notes..."
            />
          </div>

          {/* Offer Due Date (only when status is 'given offer') */}
          {form.status === "given offer" && (
            <div>
              <label
                htmlFor="offerDueDate"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Offer Due Date
              </label>
              <input
                id="offerDueDate"
                type="date"
                value={form.offerDueDate}
                onChange={(e) => updateField("offerDueDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* Interview Stages card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Interview Stages
          </h2>
          <Button onClick={() => setShowAddStageForm(true)}>
            <svg
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Stage
          </Button>
        </div>

        {/* Add Stage Form */}
        {showAddStageForm && (
          <InlineInterviewStageForm
            onSubmit={handleAddStage}
            onCancel={() => setShowAddStageForm(false)}
            nextOrder={nextOrder}
          />
        )}

        {/* Stage List */}
        {sortedStages.length > 0 ? (
          <div className="space-y-3 mt-4">
            {sortedStages.map((stage) =>
              editingStage?.id === stage.id ? (
                <InlineInterviewStageForm
                  key={stage.id}
                  stage={stage}
                  onSubmit={(input) =>
                    handleUpdateStage(
                      stage.id,
                      input as UpdateInterviewStageInput
                    )
                  }
                  onCancel={() => setEditingStage(null)}
                  nextOrder={nextOrder}
                />
              ) : (
                <InterviewStageItem
                  key={stage.id}
                  stage={stage}
                  onToggleComplete={(isCompleted, completedDate) =>
                    handleToggleStageComplete(stage, isCompleted, completedDate)
                  }
                  onEdit={() => handleEditStage(stage.id)}
                  onDelete={() => handleDeleteStage(stage.id)}
                />
              )
            )}
          </div>
        ) : (
          !showAddStageForm && (
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
        isDestructive
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Application"
        message="Are you sure you want to delete this application? This action cannot be undone and all interview stages will be deleted."
        confirmLabel="Delete"
        isDestructive
      />

      {/* History Panel */}
      {showHistory && applicationId && (
        <HistoryPanel
          applicationId={applicationId}
          onClose={() => setShowHistory(false)}
          onRestored={async () => {
            const { data } = await refetch();
            if (data) {
              const populated = populateFromApplication(data);
              setForm(populated);
              setSnapshot(captureSnapshot(populated));
            }
          }}
        />
      )}
    </div>
  );
}
