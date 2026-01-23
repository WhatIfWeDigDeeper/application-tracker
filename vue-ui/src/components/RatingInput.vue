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

function handleKeyDown(event: KeyboardEvent) {
  const currentValue = props.modelValue ?? 0;

  if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
    event.preventDefault();
    const newValue = Math.min(currentValue + 1, maxStars);
    emit('update:modelValue', newValue);
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
    event.preventDefault();
    const newValue = Math.max(currentValue - 1, props.allowClear ? 0 : 1);
    emit('update:modelValue', newValue || null);
  }
}
</script>

<template>
  <div
    class="flex items-center"
    role="slider"
    :aria-valuenow="modelValue ?? 0"
    :aria-valuemin="allowClear ? 0 : 1"
    :aria-valuemax="5"
    tabindex="0"
    @keydown="handleKeyDown"
  >
    <button
      v-for="i in maxStars"
      :key="i"
      type="button"
      class="p-0.5 focus:outline-none"
      @click="handleClick(i)"
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
