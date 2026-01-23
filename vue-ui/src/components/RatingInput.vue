<script setup lang="ts">
import { ref, computed } from 'vue';
import { StarIcon } from '@heroicons/vue/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/vue/24/outline';

const props = defineProps<{
  modelValue?: number | null;
  allowClear?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: number | null];
}>();

const hoverValue = ref<number | null>(null);
const maxStars = 5;

const displayValue = computed(() => {
  return hoverValue.value ?? props.modelValue ?? 0;
});

function handleClick(value: number) {
  if (props.allowClear && props.modelValue === value) {
    emit('update:modelValue', null);
  } else {
    emit('update:modelValue', value);
  }
}

function handleMouseEnter(value: number) {
  hoverValue.value = value;
}

function handleMouseLeave() {
  hoverValue.value = null;
}

function handleKeyDown(event: KeyboardEvent, value: number) {
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    handleClick(value);
  }
}
</script>

<template>
  <div
    class="flex items-center"
    role="radiogroup"
    aria-label="Rating"
  >
    <button
      v-for="i in maxStars"
      :key="i"
      type="button"
      role="radio"
      class="p-0.5 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
      :tabindex="modelValue === i || (modelValue == null && i === 1) ? 0 : -1"
      :aria-checked="modelValue === i ? 'true' : 'false'"
      :aria-label="`${i} stars`"
      @click="handleClick(i)"
      @keydown="(e) => handleKeyDown(e, i)"
      @mouseenter="handleMouseEnter(i)"
      @mouseleave="handleMouseLeave"
    >
      <StarIcon
        v-if="i <= displayValue"
        class="h-6 w-6 text-yellow-400 hover:scale-110 transition-transform"
      />
      <StarOutlineIcon
        v-else
        class="h-6 w-6 text-gray-300 dark:text-gray-600 hover:text-yellow-300 hover:scale-110 transition-transform"
      />
    </button>
  </div>
</template>
