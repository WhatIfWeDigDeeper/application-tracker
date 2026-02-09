<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useApplicationsListStore } from '@/stores/applicationsList';
import ApplicationCard from '@/components/ApplicationCard.vue';
import FilterBar from '@/components/FilterBar.vue';
import Pagination from '@/components/Pagination.vue';
import EmptyState from '@/components/EmptyState.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { BriefcaseIcon } from '@heroicons/vue/24/outline';

const router = useRouter();
const listStore = useApplicationsListStore();
const { applications, total, loading, error, filters, totalPages } = storeToRefs(listStore);

// Delete confirmation
const showDeleteConfirm = ref(false);
const applicationToDelete = ref<string | null>(null);

onMounted(() => {
  listStore.fetchApplications();
});

function handleCardClick(id: string) {
  router.push(`/applications/${id}`);
}

async function handleArchive(id: string) {
  try {
    await listStore.archiveApplication(id);
  } catch (err) {
    console.error('Failed to archive application:', err);
  }
}

async function handleRestore(id: string) {
  try {
    await listStore.restoreApplication(id);
  } catch (err) {
    console.error('Failed to restore application:', err);
  }
}

function handleDeleteRequest(id: string) {
  applicationToDelete.value = id;
  showDeleteConfirm.value = true;
}

async function handleConfirmDelete() {
  if (applicationToDelete.value) {
    try {
      await listStore.deleteApplication(applicationToDelete.value);
    } catch (err) {
      console.error('Failed to delete application:', err);
    }
  }
  showDeleteConfirm.value = false;
  applicationToDelete.value = null;
}

function handleCancelDelete() {
  showDeleteConfirm.value = false;
  applicationToDelete.value = null;
}

function handleFilterUpdate(updates: Partial<typeof filters.value>) {
  listStore.setFilters(updates);
}

function handlePageChange(page: number) {
  listStore.goToPage(page);
}
</script>

<template>
  <div>
    <!-- Filter Bar -->
    <FilterBar
      :filters="filters"
      :result-count="applications.length"
      :total-count="total"
      @update:filters="handleFilterUpdate"
      @clear-filters="listStore.resetFilters"
    />

    <!-- Loading State -->
    <div
      v-if="loading && applications.length === 0"
      class="flex justify-center py-12"
    >
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400"
    >
      {{ error }}
    </div>

    <!-- Empty State -->
    <EmptyState
      v-else-if="applications.length === 0"
      title="No applications found"
      :description="total === 0 ? 'Start tracking your job search by adding your first application.' : 'Try adjusting your filters to see more results.'"
    >
      <template #icon>
        <BriefcaseIcon class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
      </template>
    </EmptyState>

    <!-- Applications List -->
    <div
      v-else
      class="space-y-4"
    >
      <ApplicationCard
        v-for="application in applications"
        :key="application.id"
        :application="application"
        @click="handleCardClick(application.id)"
        @archive="handleArchive(application.id)"
        @restore="handleRestore(application.id)"
        @delete="handleDeleteRequest(application.id)"
      />

      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="mt-6"
      >
        <Pagination
          :current-page="filters.page"
          :total-pages="totalPages"
          @page-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-if="showDeleteConfirm"
      title="Delete Application"
      message="Are you sure you want to delete this application? This action cannot be undone."
      confirm-label="Delete"
      :is-destructive="true"
      @confirm="handleConfirmDelete"
      @cancel="handleCancelDelete"
    />
  </div>
</template>
