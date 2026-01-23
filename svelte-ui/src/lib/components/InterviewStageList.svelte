<script lang="ts">
  import type { InterviewStage, CreateInterviewStageInput, UpdateInterviewStageInput } from '$lib/types';
  import InterviewStageItem from './InterviewStageItem.svelte';
  import InterviewStageForm from './InterviewStageForm.svelte';

  interface Props {
    stages: InterviewStage[];
    onAdd: (input: CreateInterviewStageInput) => Promise<void>;
    onUpdate: (stageId: string, input: UpdateInterviewStageInput) => Promise<void>;
    onRemove: (stageId: string) => Promise<void>;
  }

  let { stages, onAdd, onUpdate, onRemove }: Props = $props();

  let showAddForm = $state(false);
  let editingStage = $state<InterviewStage | null>(null);

  const sortedStages = $derived([...stages].sort((a, b) => a.order - b.order));
  const completedCount = $derived(stages.filter((s) => s.isCompleted).length);

  async function handleToggleComplete(stage: InterviewStage) {
    await onUpdate(stage.id, {
      isCompleted: !stage.isCompleted,
      completedDate: !stage.isCompleted ? new Date().toISOString().split('T')[0] : null,
    });
  }

  async function handleAddStage(input: CreateInterviewStageInput) {
    await onAdd(input);
    showAddForm = false;
  }

  async function handleUpdateStage(input: UpdateInterviewStageInput) {
    if (editingStage) {
      await onUpdate(editingStage.id, input);
      editingStage = null;
    }
  }

  async function handleDeleteStage(stageId: string) {
    if (confirm('Are you sure you want to delete this interview stage?')) {
      await onRemove(stageId);
    }
  }
</script>

<div class="space-y-2">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
      Interview Stages
      {#if stages.length > 0}
        <span class="text-sm font-normal text-gray-500 dark:text-gray-400">
          ({completedCount}/{stages.length} completed)
        </span>
      {/if}
    </h3>
  </div>

  {#if sortedStages.length > 0}
    <div class="divide-y divide-gray-200 dark:divide-gray-700">
      {#each sortedStages as stage (stage.id)}
        <InterviewStageItem
          {stage}
          onToggleComplete={() => handleToggleComplete(stage)}
          onEdit={() => (editingStage = stage)}
          onDelete={() => handleDeleteStage(stage.id)}
        />
      {/each}
    </div>
  {:else}
    <p class="text-gray-500 dark:text-gray-400 text-sm py-4">No interview stages yet.</p>
  {/if}

  {#if showAddForm}
    <InterviewStageForm
      nextOrder={stages.length}
      onsubmit={(input) => handleAddStage(input as CreateInterviewStageInput)}
      oncancel={() => (showAddForm = false)}
    />
  {:else}
    <button type="button" class="btn-secondary mt-4" onclick={() => (showAddForm = true)}>
      <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Add Stage
    </button>
  {/if}

  {#if editingStage}
    <InterviewStageForm
      stage={editingStage}
      nextOrder={editingStage.order}
      onsubmit={(input) => handleUpdateStage(input as UpdateInterviewStageInput)}
      oncancel={() => (editingStage = null)}
    />
  {/if}
</div>
