<script lang="ts">
  import type { Application } from '$lib/types';
  import { CATEGORY_LABELS } from '$lib/types';
  import StatusBadge from './StatusBadge.svelte';
  import RatingDisplay from './RatingDisplay.svelte';

  interface Props {
    application: Application;
    onclick: () => void;
    onarchive: () => void;
    ondelete: () => void;
  }

  let { application, onclick, onarchive, ondelete }: Props = $props();

  let menuOpen = $state(false);

  const completedStages = $derived(application.interviewStages.filter((s) => s.isCompleted).length);
  const totalStages = $derived(application.interviewStages.length);

  const daysUntilDue = $derived(() => {
    if (!application.offerDueDate) return null;
    const due = new Date(application.offerDueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  });

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '\u2014';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function handleMenuClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    menuOpen = !menuOpen;
  }

  function handleArchiveClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    menuOpen = false;
    onarchive();
  }

  function handleDeleteClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    menuOpen = false;
    ondelete();
  }
</script>

<div
  class="card p-4 hover:shadow-md transition-shadow cursor-pointer {application.isArchived ? 'opacity-60' : ''}"
  onclick={onclick}
  onkeydown={(e) => e.key === 'Enter' && onclick()}
  tabindex="0"
  role="button"
>
  <div class="flex items-start justify-between gap-4">
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1 flex-wrap">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
          {application.companyName}
        </h3>
        <StatusBadge status={application.status} />
        {#if application.isArchived}
          <span class="text-xs text-gray-500 dark:text-gray-400">(Archived)</span>
        {/if}
      </div>
      <p class="text-gray-600 dark:text-gray-400 truncate">{application.positionTitle}</p>
    </div>
    <div class="flex-shrink-0">
      <div class="relative">
        <button
          type="button"
          class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          onclick={handleMenuClick}
          aria-label="Actions"
        >
          <svg class="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"
            />
          </svg>
        </button>
        {#if menuOpen}
          <div
            class="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10"
          >
            <button
              type="button"
              class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              onclick={handleArchiveClick}
            >
              {application.isArchived ? 'Restore' : 'Archive'}
            </button>
            <button
              type="button"
              class="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              onclick={handleDeleteClick}
            >
              Delete
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
    <span>Applied: {formatDate(application.dateApplied)}</span>
    {#if application.companyCategory}
      <span class="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
        {CATEGORY_LABELS[application.companyCategory]}
      </span>
    {/if}
    {#if application.skillsMatch}
      <RatingDisplay value={application.skillsMatch} />
    {/if}
    {#if application.status === 'interviewing' && totalStages > 0}
      <span>{completedStages}/{totalStages} stages</span>
    {/if}
    {#if application.status === 'given offer' && application.offerDueDate}
      {@const days = daysUntilDue()}
      {#if days !== null}
        <span class={days < 0 ? 'text-red-600 dark:text-red-400 font-medium' : days <= 3 ? 'text-yellow-600 dark:text-yellow-400' : ''}>
          {days < 0 ? 'Overdue' : `Due: ${formatDate(application.offerDueDate)}`}
        </span>
      {/if}
    {/if}
  </div>
</div>
