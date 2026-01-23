<script setup lang="ts">
import { computed } from 'vue';
import { StarIcon } from '@heroicons/vue/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/vue/24/outline';

const props = defineProps<{
  value: number;
  max?: number;
  showNumeric?: boolean;
}>();

const maxStars = computed(() => props.max ?? 5);

const stars = computed(() => {
  const result = [];
  for (let i = 1; i <= maxStars.value; i++) {
    result.push({
      filled: i <= props.value,
      key: i,
    });
  }
  return result;
});
</script>

<template>
  <div class="flex items-center">
    <div class="flex">
      <template
        v-for="star in stars"
        :key="star.key"
      >
        <StarIcon
          v-if="star.filled"
          class="h-4 w-4 text-yellow-400"
        />
        <StarOutlineIcon
          v-else
          class="h-4 w-4 text-gray-300 dark:text-gray-600"
        />
      </template>
    </div>
    <span
      v-if="showNumeric"
      class="ml-1 text-sm text-gray-500 dark:text-gray-400"
    >
      {{ value }}/{{ maxStars }}
    </span>
  </div>
</template>
