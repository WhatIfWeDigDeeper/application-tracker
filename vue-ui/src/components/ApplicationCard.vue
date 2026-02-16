<script setup lang="ts">
import { computed, ref } from 'vue';
import { EllipsisVerticalIcon, ArchiveBoxIcon, TrashIcon, ArchiveBoxXMarkIcon } from '@heroicons/vue/24/outline';
import type { Application } from '@/types';
import { COMPANY_CATEGORIES } from '@/types';
import StatusBadge from './StatusBadge.vue';
import RatingDisplay from './RatingDisplay.vue';

const props = defineProps<{
  application: Application;
}>();

const emit = defineEmits<{
  (e: 'click'): void;
  (e: 'archive'): void;
  (e: 'restore'): void;
  (e: 'delete'): void;
}>();

const showMenu = ref(false);

const categoryLabel = computed(() => {
  if (!props.application.companyCategory) return null;
  return COMPANY_CATEGORIES.find(c => c.value === props.application.companyCategory)?.label;
});

const interviewProgress = computed(() => {
  if (props.application.status !== 'interviewing') return null;
  const stages = props.application.interviewStages;
  const completed = stages.filter(s => s.isCompleted).length;
  return `${completed}/${stages.length} stages`;
});

const offerDueInfo = computed(() => {
  if (props.application.status !== 'given offer' || !props.application.offerDueDate) return null;

  const dueDate = new Date(props.application.offerDueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: 'Overdue', isOverdue: true };
  } else if (diffDays === 0) {
    return { text: 'Due today', isUrgent: true };
  } else if (diffDays <= 3) {
    return { text: `Due in ${diffDays} days`, isUrgent: true };
  } else {
    return { text: `Due: ${formatDate(props.application.offerDueDate)}`, isUrgent: false };
  }
});

function formatDate(dateStr: string | null) {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function handleMenuClick(event: MouseEvent) {
  event.stopPropagation();
  showMenu.value = !showMenu.value;
}

function handleAction(action: 'archive' | 'restore' | 'delete') {
  showMenu.value = false;
  if (action === 'archive') {
    emit('archive');
  } else if (action === 'restore') {
    emit('restore');
  } else {
    emit('delete');
  }
}
</script>

<template>
  <div
    :class="[
      'card p-4 cursor-pointer hover:shadow-md transition-shadow',
      application.isArchived && 'opacity-60',
    ]"
    @click="emit('click')"
  >
    <div class="flex items-start justify-between">
      <div class="flex-1 min-w-0">
        <div class="flex items-center space-x-2">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white truncate">
            {{ application.companyName }}
          </h3>
          <StatusBadge
            :status="application.status"
            size="small"
          />
          <span
            v-if="application.isArchived"
            class="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300"
          >
            Archived
          </span>
        </div>
        <p class="text-gray-600 dark:text-gray-400 truncate">
          {{ application.positionTitle }}
        </p>
      </div>

      <div class="relative ml-4">
        <button
          type="button"
          class="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          @click="handleMenuClick"
        >
          <EllipsisVerticalIcon class="h-5 w-5" />
        </button>

        <div
          v-if="showMenu"
          class="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10"
          @click.stop
        >
          <button
            v-if="!application.isArchived"
            type="button"
            class="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            @click="handleAction('archive')"
          >
            <ArchiveBoxIcon class="h-4 w-4 mr-2" />
            Archive
          </button>
          <button
            v-else
            type="button"
            class="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            @click="handleAction('restore')"
          >
            <ArchiveBoxXMarkIcon class="h-4 w-4 mr-2" />
            Restore
          </button>
          <button
            type="button"
            class="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            @click="handleAction('delete')"
          >
            <TrashIcon class="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>
    </div>

    <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
      <span>Applied: {{ formatDate(application.dateApplied) }}</span>

      <span
        v-if="categoryLabel"
        class="flex items-center"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 mr-1.5" />
        {{ categoryLabel }}
      </span>

      <span
        v-if="application.skillsMatch"
        class="flex items-center"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 mr-1.5" />
        <RatingDisplay :value="application.skillsMatch" />
      </span>

      <span
        v-if="interviewProgress"
        class="flex items-center"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-blue-500 mr-1.5" />
        {{ interviewProgress }}
      </span>

      <span
        v-if="offerDueInfo"
        :class="[
          'flex items-center',
          offerDueInfo.isOverdue && 'text-red-600 dark:text-red-400 font-medium',
          offerDueInfo.isUrgent && !offerDueInfo.isOverdue && 'text-yellow-600 dark:text-yellow-400 font-medium',
        ]"
      >
        <span
          :class="[
            'w-1.5 h-1.5 rounded-full mr-1.5',
            offerDueInfo.isOverdue ? 'bg-red-400' : offerDueInfo.isUrgent ? 'bg-yellow-400' : 'bg-gray-400',
          ]"
        />
        {{ offerDueInfo.text }}
      </span>
    </div>
  </div>
</template>
