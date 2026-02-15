<script lang="ts">
  import type { FieldChange } from '$lib/types';

  interface Props {
    changes: FieldChange[];
  }

  let { changes }: Props = $props();

  function formatValue(value: unknown): string {
    if (value === null || value === undefined) return 'None';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  }
</script>

{#if changes.length > 0}
  <div class="space-y-2">
    {#each changes as change}
      <div class="text-sm">
        <span class="font-medium text-gray-600 dark:text-gray-400">{change.label}:</span>
        <div class="ml-2">
          {#if change.oldValue !== null && change.oldValue !== undefined}
            <span class="text-red-600 dark:text-red-400 line-through">{formatValue(change.oldValue)}</span>
            <span class="mx-1 text-gray-400">&rarr;</span>
          {/if}
          <span class="text-green-600 dark:text-green-400">{formatValue(change.newValue)}</span>
        </div>
      </div>
    {/each}
  </div>
{:else}
  <p class="text-sm italic text-gray-500 dark:text-gray-400">No field changes recorded</p>
{/if}
