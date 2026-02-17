<script setup lang="ts">
import { computed } from 'vue';
import type { ApplicationStatus } from '@/types';

const props = defineProps<{
  status: ApplicationStatus;
  size?: 'small' | 'medium';
}>();

const statusConfig = {
  unsubmitted: {
    label: 'Unsubmitted',
    classes: 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200',
  },
  applied: {
    label: 'Applied',
    classes: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  },
  interviewing: {
    label: 'Interviewing',
    classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  },
  'given offer': {
    label: 'Given Offer',
    classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  },
  'accepted offer': {
    label: 'Accepted',
    classes: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  rejected: {
    label: 'Rejected',
    classes: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
  'declined offer': {
    label: 'Declined',
    classes: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  },
  'no offer': {
    label: 'No Offer',
    classes: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  },
};

const config = computed(() => statusConfig[props.status] || statusConfig.applied);

const sizeClasses = computed(() => {
  return props.size === 'small' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';
});
</script>

<template>
  <span
    :class="[
      'inline-flex items-center font-medium rounded-full',
      config.classes,
      sizeClasses,
    ]"
  >
    {{ config.label }}
  </span>
</template>
