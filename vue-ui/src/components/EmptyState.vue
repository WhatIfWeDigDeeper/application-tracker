<script setup lang="ts">
import { DocumentTextIcon } from '@heroicons/vue/24/outline';

defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="text-center py-12">
    <slot name="icon">
      <DocumentTextIcon class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
    </slot>
    <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
      {{ title }}
    </h3>
    <p
      v-if="description"
      class="mt-2 text-sm text-gray-500 dark:text-gray-400"
    >
      {{ description }}
    </p>
    <div
      v-if="$slots.action"
      class="mt-6"
    >
      <slot name="action" />
    </div>
  </div>
</template>
