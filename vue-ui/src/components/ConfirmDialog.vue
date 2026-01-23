<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline';

defineProps<{
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('cancel');
  }
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    emit('cancel');
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
  // Prevent body scrolling
  document.body.style.overflow = 'hidden';
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click="handleBackdropClick"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="'dialog-title'"
      >
        <div class="p-6">
          <div class="flex items-start">
            <div
              v-if="isDestructive"
              class="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-red-100 dark:bg-red-900"
            >
              <ExclamationTriangleIcon class="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div :class="isDestructive ? 'ml-4' : ''">
              <h3
                id="dialog-title"
                class="text-lg font-medium text-gray-900 dark:text-white"
              >
                {{ title }}
              </h3>
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {{ message }}
              </p>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg flex justify-end space-x-3">
          <button
            type="button"
            class="btn btn-secondary"
            @click="emit('cancel')"
          >
            {{ cancelLabel || 'Cancel' }}
          </button>
          <button
            type="button"
            :class="isDestructive ? 'btn btn-danger' : 'btn btn-primary'"
            @click="emit('confirm')"
          >
            {{ confirmLabel || 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
