<script setup lang="ts">
import type { FieldChange } from '@/types';

defineProps<{
  changes: FieldChange[];
}>();

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'None';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}
</script>

<template>
  <div
    v-if="changes.length > 0"
    class="space-y-2"
  >
    <div
      v-for="(change, index) in changes"
      :key="index"
      class="text-sm"
    >
      <span class="font-medium text-gray-600 dark:text-gray-400">{{ change.label }}:</span>
      <div class="ml-4 flex flex-col gap-0.5">
        <span
          v-if="change.oldValue !== null && change.oldValue !== undefined"
          class="text-red-600 dark:text-red-400 line-through"
        >{{ formatValue(change.oldValue) }}</span>
        <span class="text-green-600 dark:text-green-400">{{ formatValue(change.newValue) }}</span>
      </div>
    </div>
  </div>
  <p
    v-else
    class="text-sm text-gray-400 dark:text-gray-500 italic"
  >
    No field changes recorded
  </p>
</template>
