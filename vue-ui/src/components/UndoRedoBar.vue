<script setup lang="ts">
import { computed } from 'vue';
import { ArrowUturnLeftIcon, ArrowUturnRightIcon } from '@heroicons/vue/24/outline';
import { useHistoryStore } from '@/stores/history';

const props = defineProps<{
  applicationId: string;
}>();

const historyStore = useHistoryStore();

const undoDisabled = computed(() => !historyStore.canUndo(props.applicationId));
const redoDisabled = computed(() => !historyStore.canRedo(props.applicationId));

const lastActionDescription = computed(() => {
  const commits = historyStore.getCommits(props.applicationId);
  const cursor = historyStore.getCursor(props.applicationId);
  if (cursor >= 0 && cursor < commits.length) {
    return commits[cursor].description;
  }
  return null;
});

async function handleUndo() {
  if (!undoDisabled.value) {
    await historyStore.undo(props.applicationId);
  }
}

async function handleRedo() {
  if (!redoDisabled.value) {
    await historyStore.redo(props.applicationId);
  }
}
</script>

<template>
  <div class="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm px-3 py-2">
    <button
      type="button"
      class="p-1.5 rounded-md transition-colors"
      :class="undoDisabled
        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'"
      :disabled="undoDisabled"
      title="Undo (Ctrl+Z)"
      @click="handleUndo"
    >
      <ArrowUturnLeftIcon class="h-4 w-4" />
    </button>

    <button
      type="button"
      class="p-1.5 rounded-md transition-colors"
      :class="redoDisabled
        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'"
      :disabled="redoDisabled"
      title="Redo (Ctrl+Shift+Z)"
      @click="handleRedo"
    >
      <ArrowUturnRightIcon class="h-4 w-4" />
    </button>

    <span
      v-if="lastActionDescription"
      class="text-xs text-gray-500 dark:text-gray-400 ml-1 truncate max-w-48"
    >
      {{ lastActionDescription }}
    </span>
  </div>
</template>
