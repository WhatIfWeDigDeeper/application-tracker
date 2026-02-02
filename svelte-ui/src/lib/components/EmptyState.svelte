<script lang="ts">
  interface Props {
    title: string;
    description?: string;
    actionLabel?: string;
    onaction?: () => void;
  }

  let { title, description, actionLabel, onaction }: Props = $props();
</script>

<div class="text-center py-12 px-4">
  <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
    />
  </svg>
  <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
  {#if description}
    <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>
  {/if}
  {#if actionLabel && onaction}
    <div class="mt-6">
      <button type="button" class="btn-primary" onclick={onaction}>
        {actionLabel}
      </button>
    </div>
  {/if}
</div>
