<script lang="ts">
  import { goto, beforeNavigate } from '$app/navigation';
  import { onMount, onDestroy, untrack } from 'svelte';
  import type {
    Application,
    ApplicationStatus,
    CompanyCategory,
    JobSource,
    InterviewStage,
    CreateApplicationInput,
    CreateInterviewStageInput,
    UpdateInterviewStageInput,
  } from '$lib/types';
  import {
    ALL_STATUSES,
    STATUS_LABELS,
    ALL_CATEGORIES,
    CATEGORY_LABELS,
    ALL_SOURCES,
    SOURCE_LABELS,
  } from '$lib/types';
  import { api } from '$lib/stores/api';
  import { applicationStore } from '$lib/stores/applications.svelte';
  import RatingInput from './RatingInput.svelte';
  import UrlFieldInput from './UrlFieldInput.svelte';
  import InterviewStageForm from './InterviewStageForm.svelte';
  import InterviewStageItem from './InterviewStageItem.svelte';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import HistoryPanel from './HistoryPanel.svelte';

  interface Props {
    id?: string;
  }

  let { id }: Props = $props();

  const isEditMode = $derived(!!id);

  // ---------------------------------------------------------------------------
  // Application data (edit mode)
  // ---------------------------------------------------------------------------
  let application = $state<Application | null>(null);
  let loading = $state(false);
  let loadError = $state<string | null>(null);

  // ---------------------------------------------------------------------------
  // Form state
  // ---------------------------------------------------------------------------
  let companyName = $state('');
  let positionTitle = $state('');
  let dateApplied = $state('');
  let status = $state<ApplicationStatus>('unsubmitted');
  let companyUrl = $state('');
  let jobPostingUrl = $state('');
  let companyCareerUrl = $state('');
  let companyCategory = $state('');
  let skillsMatch = $state<number | null>(null);
  let jobSource = $state('');
  let coverLetterRequired = $state(false);
  let salaryMin = $state('');
  let salaryMax = $state('');
  let specialRequirements = $state('');
  let notes = $state('');
  let offerDueDate = $state('');

  // ---------------------------------------------------------------------------
  // UI state
  // ---------------------------------------------------------------------------
  let saving = $state(false);
  let skipNavGuard = $state(false);
  let errors = $state<Record<string, string>>({});
  let showDiscardConfirm = $state(false);
  let showDeleteConfirm = $state(false);
  let showAddStageForm = $state(false);
  let editingStage = $state<{ id: string; stage: InterviewStage } | null>(null);
  let showDeleteStageConfirm = $state(false);
  let stageToDelete = $state<string | null>(null);
  let showHistory = $state(false);

  // Local stages for create mode
  let localStages = $state<InterviewStage[]>([]);

  // ---------------------------------------------------------------------------
  // Snapshot-based dirty tracking
  // ---------------------------------------------------------------------------
  function captureSnapshot(): string {
    return JSON.stringify({
      companyName,
      positionTitle,
      dateApplied,
      status,
      companyUrl,
      jobPostingUrl,
      companyCareerUrl,
      companyCategory,
      skillsMatch,
      jobSource,
      coverLetterRequired,
      salaryMin,
      salaryMax,
      specialRequirements,
      notes,
      offerDueDate,
    });
  }

  let snapshot = $state('');

  const isDirty = $derived(captureSnapshot() !== snapshot);

  function recaptureSnapshot() {
    snapshot = captureSnapshot();
  }

  // ---------------------------------------------------------------------------
  // Date-status enforcement
  // ---------------------------------------------------------------------------
  function handleStatusChange(newStatus: ApplicationStatus) {
    const oldStatus = status;
    status = newStatus;
    if (newStatus === 'unsubmitted') {
      dateApplied = '';
    } else if (oldStatus === 'unsubmitted' && !dateApplied) {
      dateApplied = new Date().toISOString().split('T')[0];
    }
  }

  // ---------------------------------------------------------------------------
  // Populate form from application
  // ---------------------------------------------------------------------------
  function populateFromApplication(app: Application) {
    companyName = app.companyName;
    positionTitle = app.positionTitle;
    dateApplied = app.dateApplied || '';
    status = app.status;
    companyUrl = app.companyUrl || '';
    jobPostingUrl = app.jobPostingUrl || '';
    companyCareerUrl = app.companyCareerUrl || '';
    companyCategory = app.companyCategory || '';
    skillsMatch = app.skillsMatch;
    jobSource = app.jobSource || '';
    coverLetterRequired = app.coverLetterRequired || false;
    salaryMin = app.salaryMin?.toString() || '';
    salaryMax = app.salaryMax?.toString() || '';
    specialRequirements = app.specialRequirements || '';
    notes = app.notes || '';
    offerDueDate = app.offerDueDate || '';
  }

  // ---------------------------------------------------------------------------
  // Sorted stages (edit mode uses application, create mode uses localStages)
  // ---------------------------------------------------------------------------
  const sortedStages = $derived.by(() => {
    if (isEditMode && application) {
      return [...application.interviewStages].sort((a, b) => a.order - b.order);
    }
    return [...localStages].sort((a, b) => a.order - b.order);
  });

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

  function validate(): boolean {
    errors = {};

    if (!companyName.trim()) {
      errors.companyName = 'Company name is required';
    } else if (companyName.length > 200) {
      errors.companyName = 'Company name must be at most 200 characters';
    }

    if (!positionTitle.trim()) {
      errors.positionTitle = 'Position title is required';
    } else if (positionTitle.length > 200) {
      errors.positionTitle = 'Position title must be at most 200 characters';
    }

    if (companyUrl && !isValidUrl(companyUrl)) {
      errors.companyUrl = 'Invalid URL';
    }

    if (jobPostingUrl && !isValidUrl(jobPostingUrl)) {
      errors.jobPostingUrl = 'Invalid URL';
    }

    if (companyCareerUrl && !isValidUrl(companyCareerUrl)) {
      errors.companyCareerUrl = 'Invalid URL';
    }

    if (salaryMin && isNaN(parseInt(salaryMin, 10))) {
      errors.salaryMin = 'Invalid number';
    }

    if (salaryMax && isNaN(parseInt(salaryMax, 10))) {
      errors.salaryMax = 'Invalid number';
    }

    if (salaryMin && salaryMax) {
      const min = parseInt(salaryMin, 10);
      const max = parseInt(salaryMax, 10);
      if (!isNaN(min) && !isNaN(max) && min > max) {
        errors.salaryMin = 'Minimum salary must not exceed maximum';
      }
    }

    return Object.keys(errors).length === 0;
  }

  // ---------------------------------------------------------------------------
  // Build input from form state
  // ---------------------------------------------------------------------------
  function buildInput(): CreateApplicationInput & { status?: ApplicationStatus; offerDueDate?: string | null } {
    return {
      companyName: companyName.trim(),
      positionTitle: positionTitle.trim(),
      dateApplied: dateApplied || undefined,
      status,
      companyUrl: companyUrl || undefined,
      jobPostingUrl: jobPostingUrl || undefined,
      companyCareerUrl: companyCareerUrl || undefined,
      companyCategory: (companyCategory || undefined) as CompanyCategory | undefined,
      skillsMatch: skillsMatch || undefined,
      jobSource: (jobSource || undefined) as JobSource | undefined,
      coverLetterRequired: coverLetterRequired || undefined,
      salaryMin: salaryMin ? parseInt(salaryMin, 10) : undefined,
      salaryMax: salaryMax ? parseInt(salaryMax, 10) : undefined,
      specialRequirements: specialRequirements || undefined,
      notes: notes || undefined,
      offerDueDate: offerDueDate || null,
    };
  }

  // ---------------------------------------------------------------------------
  // Save handlers
  // ---------------------------------------------------------------------------
  async function handleSave() {
    if (!validate()) return;

    saving = true;
    errors = {};

    try {
      if (isEditMode && application) {
        const input = { ...buildInput(), dateApplied: dateApplied || null };
        const updated = await api.updateApplication(application.id, input);
        application = updated;
        recaptureSnapshot();
      } else {
        const input = buildInput();
        const created = await applicationStore.create(input);

        if (created) {
          // Create any local stages
          for (const stage of localStages) {
            await api.createInterviewStage(created.id, {
              name: stage.name,
              order: stage.order,
              isCompleted: stage.isCompleted,
              completedDate: stage.completedDate || undefined,
              notes: stage.notes || undefined,
              performanceRating: stage.performanceRating || undefined,
            });
          }

          skipNavGuard = true;
          goto(`/applications/${created.id}`);
        }
      }
    } catch (err) {
      console.error('Failed to save application:', err);
      errors.general = err instanceof Error ? err.message : 'Failed to save application';
    } finally {
      saving = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Discard
  // ---------------------------------------------------------------------------
  function handleDiscardClick() {
    if (!isDirty) {
      if (isEditMode) {
        revertToSnapshot();
      } else {
        skipNavGuard = true;
        goto('/');
      }
      return;
    }
    showDiscardConfirm = true;
  }

  function handleConfirmDiscard() {
    showDiscardConfirm = false;
    if (isEditMode) {
      revertToSnapshot();
    } else {
      skipNavGuard = true;
      goto('/');
    }
  }

  function revertToSnapshot() {
    if (application) {
      populateFromApplication(application);
      recaptureSnapshot();
    }
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------
  async function handleDelete() {
    if (!application) return;
    try {
      await api.deleteApplication(application.id);
      skipNavGuard = true;
      goto('/');
    } catch (err) {
      console.error('Failed to delete application:', err);
    }
    showDeleteConfirm = false;
  }

  // ---------------------------------------------------------------------------
  // Interview Stage handlers
  // ---------------------------------------------------------------------------
  async function handleAddStage(input: CreateInterviewStageInput | UpdateInterviewStageInput) {
    if (isEditMode && application) {
      try {
        const stage = await api.createInterviewStage(application.id, input as CreateInterviewStageInput);
        application = {
          ...application,
          interviewStages: [...application.interviewStages, stage],
        };
        showAddStageForm = false;
      } catch (err) {
        console.error('Failed to add interview stage:', err);
      }
    } else {
      // Create mode: store locally
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
      localStages = [...localStages, newStage];
      showAddStageForm = false;
    }
  }

  async function handleUpdateStage(stageId: string, input: UpdateInterviewStageInput) {
    if (isEditMode && application) {
      try {
        const updated = await api.updateInterviewStage(application.id, stageId, input);
        application = {
          ...application,
          interviewStages: application.interviewStages.map((s) => (s.id === stageId ? updated : s)),
        };
        editingStage = null;
      } catch (err) {
        console.error('Failed to update interview stage:', err);
      }
    } else {
      // Create mode: update locally
      const idx = localStages.findIndex((s) => s.id === stageId);
      if (idx !== -1) {
        localStages = localStages.map((s) => (s.id === stageId ? { ...s, ...input } as InterviewStage : s));
      }
      editingStage = null;
    }
  }

  function handleEditStage(stageId: string) {
    const stages = isEditMode ? application?.interviewStages : localStages;
    const stage = stages?.find((s) => s.id === stageId);
    if (stage) {
      editingStage = { id: stageId, stage };
    }
  }

  function handleDeleteStageRequest(stageId: string) {
    stageToDelete = stageId;
    showDeleteStageConfirm = true;
  }

  async function handleConfirmDeleteStage() {
    if (stageToDelete) {
      if (isEditMode && application) {
        try {
          await api.deleteInterviewStage(application.id, stageToDelete);
          application = {
            ...application,
            interviewStages: application.interviewStages.filter((s) => s.id !== stageToDelete),
          };
        } catch (err) {
          console.error('Failed to delete interview stage:', err);
        }
      } else {
        localStages = localStages.filter((s) => s.id !== stageToDelete);
      }
    }
    showDeleteStageConfirm = false;
    stageToDelete = null;
  }

  async function handleToggleStageComplete(stageId: string) {
    if (isEditMode && application) {
      try {
        const stage = application.interviewStages.find((s) => s.id === stageId);
        if (stage) {
          const newIsCompleted = !stage.isCompleted;
          const updated = await api.updateInterviewStage(application.id, stageId, {
            isCompleted: newIsCompleted,
            completedDate: newIsCompleted ? new Date().toISOString().split('T')[0] : null,
          });
          application = {
            ...application,
            interviewStages: application.interviewStages.map((s) => (s.id === stageId ? updated : s)),
          };
        }
      } catch (err) {
        console.error('Failed to toggle stage completion:', err);
      }
    } else {
      const idx = localStages.findIndex((s) => s.id === stageId);
      if (idx !== -1) {
        const stage = localStages[idx];
        const newIsCompleted = !stage.isCompleted;
        localStages = localStages.map((s) =>
          s.id === stageId
            ? { ...s, isCompleted: newIsCompleted, completedDate: newIsCompleted ? new Date().toISOString().split('T')[0] : null }
            : s
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Navigation guard
  // ---------------------------------------------------------------------------
  beforeNavigate(({ cancel }) => {
    if (skipNavGuard) {
      skipNavGuard = false;
      return;
    }
    if (isDirty) {
      const leave = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!leave) {
        cancel();
      }
    }
  });

  function handleBeforeUnload(e: BeforeUnloadEvent) {
    if (isDirty) {
      e.preventDefault();
    }
  }

  // ---------------------------------------------------------------------------
  // Lifecycle & data loading
  // ---------------------------------------------------------------------------
  async function loadApplication() {
    if (isEditMode && id) {
      loading = true;
      loadError = null;
      try {
        application = await api.getApplication(id);
        populateFromApplication(application);
      } catch (err) {
        loadError = err instanceof Error ? err.message : 'Failed to load application';
      } finally {
        loading = false;
      }
    } else {
      // Create mode: no default date
      dateApplied = '';
    }

    recaptureSnapshot();
  }

  // Reactive effect: reload when id changes (e.g., from /new to /:id)
  // Use untrack so only `id` is a dependency — loadApplication reads all form
  // state via captureSnapshot() which would otherwise re-trigger this effect
  // whenever any form field changes.
  $effect(() => {
    void id;
    untrack(() => loadApplication());
  });

  onMount(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  });
</script>

<div>
  <!-- Loading State (edit mode) -->
  {#if isEditMode && loading && !application}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  {:else if isEditMode && loadError}
    <!-- Error State (edit mode) -->
    <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
      {loadError}
      <button
        type="button"
        class="mt-2 text-primary-600 dark:text-primary-400 hover:underline"
        onclick={() => goto('/')}
      >
        Go back to list
      </button>
    </div>
  {:else}
    <!-- Main Content -->
    <div class="space-y-6">
      <!-- Header area -->
      <div class="flex items-center justify-between">
        <!-- Left: Back to list -->
        <a
          href="/"
          class="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <svg class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to List
        </a>

        <!-- Right: Action buttons -->
        <div class="flex items-center space-x-2">
          <!-- Save -->
          <button
            type="button"
            class="btn-primary"
            disabled={saving || (isEditMode && !isDirty)}
            onclick={handleSave}
          >
            {saving ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Application')}
          </button>

          <!-- Discard -->
          {#if isDirty}
            <button
              type="button"
              class="btn-secondary"
              disabled={saving}
              onclick={handleDiscardClick}
            >
              Discard
            </button>
          {/if}

          <!-- History (edit mode only) -->
          {#if isEditMode && application}
            <button
              type="button"
              class="btn-secondary"
              onclick={() => (showHistory = !showHistory)}
            >
              History
            </button>
          {/if}

          <!-- Delete (edit mode only) -->
          {#if isEditMode && application}
            <button
              type="button"
              class="btn-danger"
              onclick={() => (showDeleteConfirm = true)}
            >
              Delete
            </button>
          {/if}
        </div>
      </div>

      <!-- Error summary -->
      {#if errors.general}
        <div class="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400">
          {errors.general}
        </div>
      {/if}

      <!-- Main card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <!-- Company Name (large) -->
        <div class="mb-4">
          <input
            type="text"
            class="input text-xl font-semibold {errors.companyName ? 'border-red-500' : ''}"
            placeholder="Company Name *"
            bind:value={companyName}
          />
          {#if errors.companyName}
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.companyName}</p>
          {/if}
        </div>

        <!-- Position Title -->
        <div class="mb-4">
          <input
            type="text"
            class="input {errors.positionTitle ? 'border-red-500' : ''}"
            placeholder="Position Title *"
            bind:value={positionTitle}
          />
          {#if errors.positionTitle}
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.positionTitle}</p>
          {/if}
        </div>

        <!-- Date Applied | Status -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label for="dateApplied" class="label">Date Applied</label>
            <input
              id="dateApplied"
              type="date"
              class="input mt-1 {status === 'unsubmitted' ? 'opacity-50 cursor-not-allowed' : ''}"
              value={dateApplied}
              oninput={(e) => (dateApplied = (e.target as HTMLInputElement).value)}
              disabled={status === 'unsubmitted'}
            />
          </div>

          <div>
            <label for="status" class="label">Status</label>
            <select
              id="status"
              class="input mt-1"
              value={status}
              onchange={(e) => handleStatusChange((e.target as HTMLSelectElement).value as ApplicationStatus)}
            >
              {#each ALL_STATUSES as s}
                <option value={s}>{STATUS_LABELS[s]}</option>
              {/each}
            </select>
          </div>
        </div>

        <!-- Two-column grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Left column: Company Info -->
          <div class="space-y-4">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Company Info
            </h3>

            <!-- Company Category -->
            <div>
              <label for="companyCategory" class="label">Company Category</label>
              <select
                id="companyCategory"
                class="input mt-1"
                bind:value={companyCategory}
              >
                <option value="">Select category</option>
                {#each ALL_CATEGORIES as category}
                  <option value={category}>{CATEGORY_LABELS[category]}</option>
                {/each}
              </select>
            </div>

            <!-- Company Website -->
            <UrlFieldInput
              value={companyUrl}
              onchange={(v) => (companyUrl = v)}
              label="Company Website"
              placeholder="https://example.com"
              error={errors.companyUrl}
            />

            <!-- Career Page URL -->
            <UrlFieldInput
              value={companyCareerUrl}
              onchange={(v) => (companyCareerUrl = v)}
              label="Career Page URL"
              placeholder="https://example.com/careers"
              error={errors.companyCareerUrl}
            />

            <!-- Job Posting URL -->
            <UrlFieldInput
              value={jobPostingUrl}
              onchange={(v) => (jobPostingUrl = v)}
              label="Job Posting URL"
              placeholder="https://linkedin.com/jobs/..."
              error={errors.jobPostingUrl}
            />
          </div>

          <!-- Right column: Application Details -->
          <div class="space-y-4">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Application Details
            </h3>

            <!-- Job Source -->
            <div>
              <label for="jobSource" class="label">Job Source</label>
              <select
                id="jobSource"
                class="input mt-1"
                bind:value={jobSource}
              >
                <option value="">Select source</option>
                {#each ALL_SOURCES as source}
                  <option value={source}>{SOURCE_LABELS[source]}</option>
                {/each}
              </select>
            </div>

            <!-- Skills Match -->
            <div>
              <label class="label">Skills Match</label>
              <div class="mt-1">
                <RatingInput value={skillsMatch} onchange={(v) => (skillsMatch = v)} />
              </div>
            </div>

            <!-- Salary range -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="salaryMin" class="label">Min Salary</label>
                <input
                  id="salaryMin"
                  type="number"
                  class="input mt-1 {errors.salaryMin ? 'border-red-500' : ''}"
                  placeholder="120000"
                  bind:value={salaryMin}
                />
                {#if errors.salaryMin}
                  <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.salaryMin}</p>
                {/if}
              </div>

              <div>
                <label for="salaryMax" class="label">Max Salary</label>
                <input
                  id="salaryMax"
                  type="number"
                  class="input mt-1 {errors.salaryMax ? 'border-red-500' : ''}"
                  placeholder="150000"
                  bind:value={salaryMax}
                />
                {#if errors.salaryMax}
                  <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.salaryMax}</p>
                {/if}
              </div>
            </div>

            <!-- Cover Letter Required -->
            <div>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  class="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                  bind:checked={coverLetterRequired}
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Cover letter required</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Full-width fields below the grid -->
        <div class="mt-6 space-y-4">
          <!-- Special Requirements -->
          <div>
            <label for="specialRequirements" class="label">Special Requirements</label>
            <textarea
              id="specialRequirements"
              rows="3"
              class="input mt-1 resize-y"
              placeholder="Portfolio required, specific skills..."
              bind:value={specialRequirements}
            ></textarea>
          </div>

          <!-- Notes -->
          <div>
            <label for="notes" class="label">Notes</label>
            <textarea
              id="notes"
              rows="4"
              class="input mt-1 resize-y"
              placeholder="Referral info, interview prep notes..."
              bind:value={notes}
            ></textarea>
          </div>

          <!-- Offer Due Date (only when status is 'given offer') -->
          {#if status === 'given offer'}
            <div>
              <label for="offerDueDate" class="label">Offer Due Date</label>
              <input
                id="offerDueDate"
                type="date"
                class="input mt-1"
                bind:value={offerDueDate}
              />
            </div>
          {/if}
        </div>
      </div>

      <!-- Interview Stages card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Interview Stages
          </h2>
          <button
            type="button"
            class="btn-primary flex items-center"
            onclick={() => (showAddStageForm = !showAddStageForm)}
          >
            <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Stage
          </button>
        </div>

        <!-- Add Stage Form -->
        {#if showAddStageForm}
          <InterviewStageForm
            nextOrder={sortedStages.length}
            onsubmit={handleAddStage}
            oncancel={() => (showAddStageForm = false)}
          />
        {/if}

        <!-- Stage List -->
        {#if sortedStages.length > 0}
          <div class="space-y-3 mt-4">
            {#each sortedStages as stage (stage.id)}
              {#if editingStage?.id === stage.id}
                <InterviewStageForm
                  stage={stage}
                  nextOrder={stage.order}
                  onsubmit={(input) => handleUpdateStage(stage.id, input as UpdateInterviewStageInput)}
                  oncancel={() => (editingStage = null)}
                />
              {:else}
                <InterviewStageItem
                  {stage}
                  onToggleComplete={() => handleToggleStageComplete(stage.id)}
                  onEdit={() => handleEditStage(stage.id)}
                  onDelete={() => handleDeleteStageRequest(stage.id)}
                />
              {/if}
            {/each}
          </div>
        {:else if !showAddStageForm}
          <p class="text-gray-500 dark:text-gray-400 text-center py-6">
            No interview stages added yet.
          </p>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Discard Confirmation Dialog -->
  {#if showDiscardConfirm}
    <ConfirmDialog
      title="Discard changes?"
      message="You have unsaved changes. Are you sure you want to discard them?"
      confirmLabel="Discard"
      confirmVariant="danger"
      onconfirm={handleConfirmDiscard}
      oncancel={() => (showDiscardConfirm = false)}
    />
  {/if}

  <!-- Delete Confirmation Dialog -->
  {#if showDeleteConfirm}
    <ConfirmDialog
      title="Delete Application"
      message="Are you sure you want to delete this application? This action cannot be undone and all interview stages will be deleted."
      confirmLabel="Delete"
      confirmVariant="danger"
      onconfirm={handleDelete}
      oncancel={() => (showDeleteConfirm = false)}
    />
  {/if}

  <!-- Delete Stage Confirmation Dialog -->
  {#if showDeleteStageConfirm}
    <ConfirmDialog
      title="Delete Interview Stage"
      message="Are you sure you want to delete this interview stage?"
      confirmLabel="Delete"
      confirmVariant="danger"
      onconfirm={handleConfirmDeleteStage}
      oncancel={() => { showDeleteStageConfirm = false; stageToDelete = null; }}
    />
  {/if}

  <!-- History Panel -->
  {#if showHistory && application}
    <HistoryPanel
      applicationId={application.id}
      onclose={() => (showHistory = false)}
      onrestored={async () => {
        if (!application) return;
        application = await api.getApplication(application.id);
        populateFromApplication(application);
        recaptureSnapshot();
      }}
    />
  {/if}
</div>
