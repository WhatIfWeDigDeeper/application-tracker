<script lang="ts">
  import type { InterviewStage } from '$lib/types';
  import RatingDisplay from './RatingDisplay.svelte';

  interface Props {
    stage: InterviewStage;
    onToggleComplete: () => void;
    onEdit: () => void;
    onDelete: () => void;
  }

  let { stage, onToggleComplete, onEdit, onDelete }: Props = $props();

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
</script>

<div class="flex items-center gap-3 py-2 group">
  <button
    type="button"
    class="flex-shrink-0 h-5 w-5 rounded border-2 {stage.isCompleted
      ? 'bg-primary-600 border-primary-600'
      : 'border-gray-300 dark:border-gray-600'} focus:outline-hidden focus:ring-2 focus:ring-primary-500"
    onclick={onToggleComplete}
    aria-label={stage.isCompleted ? 'Mark incomplete' : 'Mark complete'}
  >
    {#if stage.isCompleted}
      <svg class="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
        <path
          fill-rule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clip-rule="evenodd"
        />
      </svg>
    {/if}
  </button>

  <div class="flex-1 min-w-0">
    <div class="flex items-center gap-2">
      <span class="font-medium text-gray-900 dark:text-gray-100 {stage.isCompleted ? 'line-through opacity-60' : ''}">
        {stage.name}
      </span>
      {#if stage.completedDate}
        <span class="text-sm text-gray-500 dark:text-gray-400">{formatDate(stage.completedDate)}</span>
      {/if}
      {#if stage.performanceRating}
        <RatingDisplay value={stage.performanceRating} />
      {/if}
      {#if stage.notes}
        <svg class="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
            clip-rule="evenodd"
          />
        </svg>
      {/if}
    </div>
  </div>

  <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
    <button
      type="button"
      class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
      onclick={onEdit}
      aria-label="Edit stage"
    >
      <svg class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
        />
      </svg>
    </button>
    <button
      type="button"
      class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
      onclick={onDelete}
      aria-label="Delete stage"
    >
      <svg class="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
    </button>
  </div>
</div>
