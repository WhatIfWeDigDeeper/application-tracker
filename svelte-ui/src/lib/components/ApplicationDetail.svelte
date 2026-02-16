<script lang="ts">
  import type { Application, UpdateApplicationInput, CreateInterviewStageInput, UpdateInterviewStageInput, ApplicationStatus } from '$lib/types';
  import { ALL_STATUSES, STATUS_LABELS, CATEGORY_LABELS, SOURCE_LABELS } from '$lib/types';
  import RatingDisplay from './RatingDisplay.svelte';
  import InterviewStageList from './InterviewStageList.svelte';
  import ApplicationForm from './ApplicationForm.svelte';

  interface Props {
    application: Application;
    onUpdate: (input: UpdateApplicationInput) => Promise<void>;
    onAddStage: (input: CreateInterviewStageInput) => Promise<void>;
    onUpdateStage: (stageId: string, input: UpdateInterviewStageInput) => Promise<void>;
    onRemoveStage: (stageId: string) => Promise<void>;
    onArchive: () => Promise<void>;
    onDelete: () => Promise<void>;
    onClose: () => void;
  }

  let { application, onUpdate, onAddStage, onUpdateStage, onRemoveStage, onArchive, onDelete, onClose }: Props = $props();

  let isEditing = $state(false);
  let showDeleteConfirm = $state(false);

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '\u2014';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function formatSalary(min: number | null, max: number | null): string | null {
    if (!min && !max) return null;
    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    if (min && max) return `${formatter.format(min)} - ${formatter.format(max)}`;
    if (min) return `${formatter.format(min)}+`;
    return `Up to ${formatter.format(max!)}`;
  }

  async function handleStatusChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    await onUpdate({ status: select.value as ApplicationStatus });
  }

  async function handleOfferDateChange(e: Event) {
    const input = e.target as HTMLInputElement;
    await onUpdate({ offerDueDate: input.value || null });
  }

  async function handleFormSubmit(input: UpdateApplicationInput) {
    await onUpdate(input);
    isEditing = false;
  }

  async function handleDelete() {
    await onDelete();
    showDeleteConfirm = false;
  }

  const salaryRange = $derived(formatSalary(application.salaryMin, application.salaryMax));
</script>

<div class="h-full flex flex-col">
  <!-- Header -->
  <div class="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-3 mb-2">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
          {application.companyName}
        </h2>
        {#if application.isArchived}
          <span class="text-sm text-gray-500 dark:text-gray-400">(Archived)</span>
        {/if}
      </div>
      <p class="text-lg text-gray-600 dark:text-gray-400">{application.positionTitle}</p>
    </div>
    <button
      type="button"
      class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
      onclick={onClose}
      aria-label="Close"
    >
      <svg class="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-y-auto p-6">
    {#if isEditing}
      <ApplicationForm
        {application}
        onsubmit={handleFormSubmit}
        oncancel={() => (isEditing = false)}
      />
    {:else}
      <div class="space-y-6">
        <!-- Status and Quick Actions -->
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <label for="status" class="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</label>
            <select
              id="status"
              class="input w-auto"
              value={application.status}
              onchange={handleStatusChange}
            >
              {#each ALL_STATUSES as status}
                <option value={status}>{STATUS_LABELS[status]}</option>
              {/each}
            </select>
          </div>

          {#if application.status === 'given offer'}
            <div class="flex items-center gap-2">
              <label for="offerDate" class="text-sm font-medium text-gray-700 dark:text-gray-300">Offer Due:</label>
              <input
                id="offerDate"
                type="date"
                class="input w-auto"
                value={application.offerDueDate || ''}
                onchange={handleOfferDateChange}
              />
            </div>
          {/if}
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div>
              <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Date Applied</h4>
              <p class="text-gray-900 dark:text-gray-100">{formatDate(application.dateApplied)}</p>
            </div>

            {#if application.companyCategory}
              <div>
                <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Industry</h4>
                <p class="text-gray-900 dark:text-gray-100">{CATEGORY_LABELS[application.companyCategory]}</p>
              </div>
            {/if}

            {#if application.jobSource}
              <div>
                <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Job Source</h4>
                <p class="text-gray-900 dark:text-gray-100">{SOURCE_LABELS[application.jobSource]}</p>
              </div>
            {/if}

            {#if application.skillsMatch}
              <div>
                <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Skills Match</h4>
                <RatingDisplay value={application.skillsMatch} />
              </div>
            {/if}
          </div>

          <div class="space-y-4">
            {#if salaryRange}
              <div>
                <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Salary Range</h4>
                <p class="text-gray-900 dark:text-gray-100">{salaryRange}</p>
              </div>
            {/if}

            {#if application.coverLetterRequired !== null}
              <div>
                <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Cover Letter</h4>
                <p class="text-gray-900 dark:text-gray-100">{application.coverLetterRequired ? 'Required' : 'Not Required'}</p>
              </div>
            {/if}

            {#if application.specialRequirements}
              <div>
                <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Special Requirements</h4>
                <p class="text-gray-900 dark:text-gray-100">{application.specialRequirements}</p>
              </div>
            {/if}
          </div>
        </div>

        <!-- Links -->
        {#if application.companyUrl || application.jobPostingUrl || application.companyCareerUrl}
          <div>
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Links</h4>
            <div class="flex flex-wrap gap-3">
              {#if application.companyUrl}
                <a
                  href={application.companyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm"
                >
                  Company Website
                </a>
              {/if}
              {#if application.jobPostingUrl}
                <a
                  href={application.jobPostingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm"
                >
                  Job Posting
                </a>
              {/if}
              {#if application.companyCareerUrl}
                <a
                  href={application.companyCareerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm"
                >
                  Careers Page
                </a>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Notes -->
        {#if application.notes}
          <div>
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Notes</h4>
            <p class="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{application.notes}</p>
          </div>
        {/if}

        <!-- Interview Stages -->
        <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
          <InterviewStageList
            stages={application.interviewStages}
            onAdd={onAddStage}
            onUpdate={onUpdateStage}
            onRemove={onRemoveStage}
          />
        </div>
      </div>
    {/if}
  </div>

  <!-- Footer Actions -->
  {#if !isEditing}
    <div class="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <div class="flex gap-2">
        <button type="button" class="btn-secondary" onclick={() => (isEditing = true)}>
          Edit
        </button>
        <button type="button" class="btn-secondary" onclick={onArchive}>
          {application.isArchived ? 'Restore' : 'Archive'}
        </button>
      </div>
      <div>
        {#if showDeleteConfirm}
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">Are you sure?</span>
            <button type="button" class="btn-danger" onclick={handleDelete}>Delete</button>
            <button type="button" class="btn-secondary" onclick={() => (showDeleteConfirm = false)}>Cancel</button>
          </div>
        {:else}
          <button type="button" class="btn-danger" onclick={() => (showDeleteConfirm = true)}>
            Delete
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div>
