<script lang="ts">
  import type { InterviewStage, CreateInterviewStageInput, UpdateInterviewStageInput } from '$lib/types';
  import RatingInput from './RatingInput.svelte';

  interface Props {
    stage?: InterviewStage;
    nextOrder: number;
    onsubmit: (input: CreateInterviewStageInput | UpdateInterviewStageInput) => Promise<void>;
    oncancel: () => void;
  }

  let { stage, nextOrder, onsubmit, oncancel }: Props = $props();

  let name = $state(stage?.name || '');
  let order = $state(stage?.order ?? nextOrder);
  let isCompleted = $state(stage?.isCompleted || false);
  let completedDate = $state(stage?.completedDate || '');
  let notes = $state(stage?.notes || '');
  let performanceRating = $state<number | null>(stage?.performanceRating ?? null);
  let submitting = $state(false);
  let error = $state<string | null>(null);

  const isEditing = $derived(!!stage);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    error = null;
    submitting = true;

    try {
      if (isEditing) {
        const input: UpdateInterviewStageInput = {
          name,
          order,
          isCompleted,
          completedDate: completedDate || null,
          notes: notes || null,
          performanceRating,
        };
        await onsubmit(input);
      } else {
        const input: CreateInterviewStageInput = {
          name,
          order,
          isCompleted,
          completedDate: completedDate || undefined,
          notes: notes || undefined,
          performanceRating: performanceRating ?? undefined,
        };
        await onsubmit(input);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save stage';
    } finally {
      submitting = false;
    }
  }
</script>

<div class="card p-4 mt-4">
  <form onsubmit={handleSubmit} class="space-y-4">
    <h4 class="font-medium text-gray-900 dark:text-gray-100">
      {isEditing ? 'Edit Interview Stage' : 'Add Interview Stage'}
    </h4>

    {#if error}
      <div class="text-red-600 dark:text-red-400 text-sm">{error}</div>
    {/if}

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="stage-name" class="label mb-1">Stage Name *</label>
        <input
          id="stage-name"
          type="text"
          class="input"
          bind:value={name}
          placeholder="e.g., Phone Screen, Technical Interview"
          required
        />
      </div>

      <div>
        <label for="stage-order" class="label mb-1">Order</label>
        <input id="stage-order" type="number" class="input" bind:value={order} min="0" />
      </div>
    </div>

    <div class="flex items-center gap-4">
      <label class="flex items-center gap-2">
        <input
          type="checkbox"
          class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          bind:checked={isCompleted}
        />
        <span class="text-sm text-gray-700 dark:text-gray-300">Completed</span>
      </label>

      {#if isCompleted}
        <div class="flex-1 max-w-[200px]">
          <input type="date" class="input" bind:value={completedDate} />
        </div>
      {/if}
    </div>

    <div>
      <label class="label mb-1">Performance Rating</label>
      <RatingInput value={performanceRating} onchange={(v) => (performanceRating = v)} />
    </div>

    <div>
      <label for="stage-notes" class="label mb-1">Notes</label>
      <textarea
        id="stage-notes"
        class="input min-h-[80px]"
        bind:value={notes}
        placeholder="Notes about this interview stage..."
      ></textarea>
    </div>

    <div class="flex justify-end gap-2">
      <button type="button" class="btn-secondary" onclick={oncancel} disabled={submitting}>
        Cancel
      </button>
      <button type="submit" class="btn-primary" disabled={submitting || !name.trim()}>
        {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Stage'}
      </button>
    </div>
  </form>
</div>
