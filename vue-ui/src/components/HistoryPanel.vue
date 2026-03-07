<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { XMarkIcon, ChevronDownIcon, ChevronUpIcon, ClockIcon } from '@heroicons/vue/24/outline';
import { useHistoryStore, type Commit } from '@/stores/history';
import EventDiff from './EventDiff.vue';

const props = defineProps<{
  applicationId: string;
}>();

const emit = defineEmits<{
  close: [];
  restored: [];
}>();

const historyStore = useHistoryStore();
const expandedEvent = ref<string | null>(null);

const commits = computed(() => {
  // Return newest first
  return [...historyStore.getCommits(props.applicationId)].reverse();
});

const currentCursor = computed(() => historyStore.getCursor(props.applicationId));

function toggleExpand(commitId: string) {
  if (expandedEvent.value === commitId) {
    expandedEvent.value = null;
  } else {
    expandedEvent.value = commitId;
  }
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isCurrentVersion(commit: Commit): boolean {
  const allCommits = historyStore.getCommits(props.applicationId);
  const idx = allCommits.indexOf(commit);
  return idx === currentCursor.value;
}

async function handleRestore(commit: Commit) {
  if (commit.sequence > 0) {
    // Use restore endpoint for server-side events
    const { eventService } = await import('@/services/api');
    const { useApplicationDetailStore } = await import('@/stores/applicationDetail');
    const detailStore = useApplicationDetailStore();

    try {
      const restored = await eventService.restore(props.applicationId, commit.sequence);
      detailStore.application = restored;
      await historyStore.loadHistory(props.applicationId);
      emit('restored');
    } catch (err) {
      console.error('Failed to restore to version:', err);
    }
  }
}

onMounted(() => {
  // Load history if not already loaded
  if (historyStore.getCommits(props.applicationId).length === 0) {
    historyStore.loadHistory(props.applicationId);
  }
});
</script>

<template>
  <div
    data-testid="history-panel"
    class="fixed inset-y-0 right-0 w-96 z-40 bg-white dark:bg-gray-800 shadow-xl border-l border-gray-200 dark:border-gray-700 flex flex-col"
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-2">
        <ClockIcon class="h-5 w-5 text-gray-500 dark:text-gray-400" />
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          History
        </h2>
      </div>
      <button
        type="button"
        class="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        @click="emit('close')"
      >
        <XMarkIcon class="h-5 w-5" />
      </button>
    </div>

    <!-- Loading -->
    <div
      v-if="historyStore.loadingHistory"
      class="flex justify-center py-8"
    >
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="commits.length === 0"
      class="flex-1 flex items-center justify-center px-4"
    >
      <p class="text-gray-500 dark:text-gray-400 text-center">
        No history recorded yet. Changes will appear here as you modify this application.
      </p>
    </div>

    <!-- Event timeline -->
    <div
      v-else
      class="flex-1 overflow-y-auto"
    >
      <div class="px-4 py-2 space-y-1">
        <div
          v-for="commit in commits"
          :key="commit.id"
          data-testid="history-entry"
          class="border border-gray-100 dark:border-gray-700 rounded-lg"
          :class="isCurrentVersion(commit) ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800' : 'bg-white dark:bg-gray-800'"
        >
          <!-- Event header -->
          <button
            type="button"
            class="w-full text-left px-3 py-2.5 flex items-start gap-2"
            @click="toggleExpand(commit.id)"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ commit.description }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {{ formatRelativeTime(commit.timestamp) }}
                <span
                  v-if="isCurrentVersion(commit)"
                  class="ml-1 text-primary-600 dark:text-primary-400 font-medium"
                >(current)</span>
              </p>
            </div>
            <component
              :is="expandedEvent === commit.id ? ChevronUpIcon : ChevronDownIcon"
              class="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5"
            />
          </button>

          <!-- Expanded details -->
          <div
            v-if="expandedEvent === commit.id"
            class="px-3 pb-3 border-t border-gray-100 dark:border-gray-700 pt-2"
          >
            <EventDiff :changes="commit.changes" />

            <button
              v-if="!isCurrentVersion(commit) && commit.sequence > 0"
              type="button"
              class="mt-3 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              @click.stop="handleRestore(commit)"
            >
              Restore to this point
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
