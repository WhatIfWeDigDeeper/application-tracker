import { ref, computed, watch } from 'vue';
import type { Application, FilterState, PaginatedResponse } from '@/types';
import { applicationService } from '@/services/api';

// Default filter state
const defaultFilters: FilterState = {
  status: undefined,
  companyCategory: undefined,
  jobSource: undefined,
  skillsMatchMin: undefined,
  includeArchived: false,
  sortBy: 'dateApplied',
  sortDir: 'desc',
  page: 1,
  limit: 20,
};

export function useApplications() {
  const applications = ref<Application[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const filters = ref<FilterState>({ ...defaultFilters });

  const totalPages = computed(() => Math.ceil(total.value / filters.value.limit));
  const hasNextPage = computed(() => filters.value.page < totalPages.value);
  const hasPrevPage = computed(() => filters.value.page > 1);

  async function fetchApplications() {
    loading.value = true;
    error.value = null;

    try {
      const result: PaginatedResponse<Application> = await applicationService.list(filters.value);
      applications.value = result.items;
      total.value = result.total;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch applications';
      console.error('Failed to fetch applications:', err);
    } finally {
      loading.value = false;
    }
  }

  async function createApplication(input: Parameters<typeof applicationService.create>[0]) {
    loading.value = true;
    error.value = null;

    try {
      const application = await applicationService.create(input);
      // Refresh the list to include the new application
      await fetchApplications();
      return application;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create application';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateApplication(
    id: string,
    input: Parameters<typeof applicationService.update>[1]
  ) {
    error.value = null;

    try {
      const updated = await applicationService.update(id, input);
      // Update local state
      const index = applications.value.findIndex((app) => app.id === id);
      if (index !== -1) {
        applications.value[index] = updated;
      }
      return updated;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update application';
      throw err;
    }
  }

  async function deleteApplication(id: string) {
    error.value = null;

    try {
      await applicationService.delete(id);
      // Remove from local state
      applications.value = applications.value.filter((app) => app.id !== id);
      total.value--;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete application';
      throw err;
    }
  }

  async function archiveApplication(id: string) {
    error.value = null;

    try {
      const updated = await applicationService.archive(id);
      if (!filters.value.includeArchived) {
        // Remove from list if not showing archived
        applications.value = applications.value.filter((app) => app.id !== id);
        total.value--;
      } else {
        // Update local state
        const index = applications.value.findIndex((app) => app.id === id);
        if (index !== -1) {
          applications.value[index] = updated;
        }
      }
      return updated;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to archive application';
      throw err;
    }
  }

  async function restoreApplication(id: string) {
    error.value = null;

    try {
      const updated = await applicationService.restore(id);
      // Update local state
      const index = applications.value.findIndex((app) => app.id === id);
      if (index !== -1) {
        applications.value[index] = updated;
      }
      return updated;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to restore application';
      throw err;
    }
  }

  function setFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    filters.value[key] = value;
    // Reset to page 1 when filters change
    if (key !== 'page') {
      filters.value.page = 1;
    }
  }

  function setFilters(updates: Partial<FilterState>) {
    // Batch update multiple filters at once to avoid triggering multiple fetches
    const shouldResetPage = Object.keys(updates).some(key => key !== 'page');
    
    // Type-safe batch update using Object.assign
    Object.assign(filters.value, updates);
    
    // Reset to page 1 when any filter other than page changes
    if (shouldResetPage && !('page' in updates)) {
      filters.value.page = 1;
    }
  }

  function resetFilters() {
    filters.value = { ...defaultFilters };
  }

  function nextPage() {
    if (hasNextPage.value) {
      filters.value.page++;
    }
  }

  function prevPage() {
    if (hasPrevPage.value) {
      filters.value.page--;
    }
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages.value) {
      filters.value.page = page;
    }
  }

  // Watch filters and refetch
  watch(
    filters,
    () => {
      fetchApplications();
    },
    { deep: true }
  );

  return {
    // State
    applications,
    total,
    loading,
    error,
    filters,

    // Computed
    totalPages,
    hasNextPage,
    hasPrevPage,

    // Methods
    fetchApplications,
    createApplication,
    updateApplication,
    deleteApplication,
    archiveApplication,
    restoreApplication,
    setFilter,
    setFilters,
    resetFilters,
    nextPage,
    prevPage,
    goToPage,
  };
}
