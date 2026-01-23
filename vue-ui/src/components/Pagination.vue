<script setup lang="ts">
import { computed } from 'vue';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline';

const props = defineProps<{
  currentPage: number;
  totalPages: number;
}>();

const emit = defineEmits<{
  pageChange: [page: number];
}>();

const pages = computed(() => {
  const result: (number | string)[] = [];
  const current = props.currentPage;
  const total = props.totalPages;

  if (total <= 7) {
    // Show all pages
    for (let i = 1; i <= total; i++) {
      result.push(i);
    }
  } else {
    // Always show first page
    result.push(1);

    if (current > 3) {
      result.push('...');
    }

    // Show pages around current
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      result.push(i);
    }

    if (current < total - 2) {
      result.push('...');
    }

    // Always show last page
    result.push(total);
  }

  return result;
});

function goToPage(page: number | string) {
  if (typeof page === 'number' && page !== props.currentPage) {
    emit('pageChange', page);
  }
}
</script>

<template>
  <nav
    v-if="totalPages > 1"
    class="flex items-center justify-center space-x-1"
    aria-label="Pagination"
  >
    <button
      type="button"
      :disabled="currentPage === 1"
      class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      @click="emit('pageChange', currentPage - 1)"
    >
      <span class="sr-only">Previous</span>
      <ChevronLeftIcon class="h-5 w-5" />
    </button>

    <template
      v-for="(page, index) in pages"
      :key="index"
    >
      <span
        v-if="page === '...'"
        class="px-3 py-2 text-gray-500 dark:text-gray-400"
      >
        ...
      </span>
      <button
        v-else
        type="button"
        :class="[
          'px-3 py-2 rounded-md text-sm font-medium',
          page === currentPage
            ? 'bg-primary-600 text-white'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
        ]"
        @click="goToPage(page)"
      >
        {{ page }}
      </button>
    </template>

    <button
      type="button"
      :disabled="currentPage === totalPages"
      class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      @click="emit('pageChange', currentPage + 1)"
    >
      <span class="sr-only">Next</span>
      <ChevronRightIcon class="h-5 w-5" />
    </button>
  </nav>
</template>
