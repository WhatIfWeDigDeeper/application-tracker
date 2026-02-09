<script setup lang="ts">
import { computed } from 'vue';
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline';

const props = defineProps<{
  modelValue: string;
  label?: string;
  placeholder?: string;
  error?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const isValidUrl = computed(() => {
  return props.modelValue.startsWith('http://') || props.modelValue.startsWith('https://');
});

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
}

function openUrl() {
  if (isValidUrl.value) {
    window.open(props.modelValue, '_blank');
  }
}
</script>

<template>
  <div>
    <label
      v-if="label"
      class="label mb-1"
    >{{ label }}</label>
    <div class="flex items-center gap-2">
      <input
        type="url"
        class="input flex-1"
        :class="error && 'border-red-500'"
        :value="modelValue"
        :placeholder="placeholder"
        @input="handleInput"
      >
      <button
        v-if="isValidUrl"
        type="button"
        class="p-2 rounded-md text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        title="Open URL in new tab"
        @click="openUrl"
      >
        <ArrowTopRightOnSquareIcon class="h-5 w-5" />
      </button>
    </div>
    <p
      v-if="error"
      class="text-sm text-red-600 dark:text-red-400 mt-1"
    >
      {{ error }}
    </p>
  </div>
</template>
