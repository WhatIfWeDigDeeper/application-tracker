<script setup lang="ts">
import { ref } from 'vue';
import { PencilIcon, TrashIcon, ChatBubbleLeftIcon } from '@heroicons/vue/24/outline';
import { CheckCircleIcon } from '@heroicons/vue/24/solid';
import type { InterviewStage } from '@/types';
import RatingDisplay from './RatingDisplay.vue';

defineProps<{
  stage: InterviewStage;
}>();

const emit = defineEmits<{
  toggleComplete: [];
  edit: [];
  delete: [];
}>();

const isExpanded = ref(false);

function formatDate(dateStr: string | null) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
</script>

<template>
  <div
    :class="[
      'border border-gray-200 dark:border-gray-700 rounded-lg p-3 transition-colors',
      stage.isCompleted && 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    ]"
  >
    <div class="flex items-start justify-between">
      <div class="flex items-start flex-1">
        <button
          type="button"
          class="flex-shrink-0 mr-3 mt-0.5"
          @click="emit('toggleComplete')"
        >
          <CheckCircleIcon
            v-if="stage.isCompleted"
            class="h-6 w-6 text-green-500 dark:text-green-400"
          />
          <div
            v-else
            class="h-6 w-6 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 transition-colors"
          />
        </button>

        <div
          class="flex-1 min-w-0"
          @click="isExpanded = !isExpanded"
        >
          <div class="flex items-center flex-wrap gap-2">
            <span
              :class="[
                'font-medium cursor-pointer',
                stage.isCompleted
                  ? 'text-gray-600 dark:text-gray-400'
                  : 'text-gray-900 dark:text-white',
              ]"
            >
              {{ stage.name }}
            </span>

            <span
              v-if="stage.completedDate"
              class="text-sm text-gray-500 dark:text-gray-400"
            >
              {{ formatDate(stage.completedDate) }}
            </span>

            <RatingDisplay
              v-if="stage.performanceRating"
              :value="stage.performanceRating"
            />

            <ChatBubbleLeftIcon
              v-if="stage.notes"
              class="h-4 w-4 text-gray-400 dark:text-gray-500"
              title="Has notes"
            />
          </div>

          <!-- Expanded notes -->
          <div
            v-if="isExpanded && stage.notes"
            class="mt-2 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap"
          >
            {{ stage.notes }}
          </div>
        </div>
      </div>

      <div class="flex items-center space-x-1 ml-2">
        <button
          type="button"
          class="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Edit stage"
          @click="emit('edit')"
        >
          <PencilIcon class="h-4 w-4" />
        </button>
        <button
          type="button"
          class="p-1 rounded-md text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Delete stage"
          @click="emit('delete')"
        >
          <TrashIcon class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>
