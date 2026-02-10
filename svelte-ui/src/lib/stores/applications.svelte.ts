import { api } from './api';
import type { Application, FilterState, CreateApplicationInput, UpdateApplicationInput } from '$lib/types';

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

// Application store using Svelte 5 runes
function createApplicationStore() {
  let applications = $state<Application[]>([]);
  let total = $state(0);
  let page = $state(1);
  let limit = $state(20);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let filters = $state<FilterState>({ ...defaultFilters });

  const totalPages = $derived(Math.ceil(total / limit));

  async function load() {
    loading = true;
    error = null;
    try {
      const response = await api.listApplications(filters);
      applications = response.items;
      total = response.total;
      page = response.page;
      limit = response.limit;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load applications';
    } finally {
      loading = false;
    }
  }

  async function create(input: CreateApplicationInput): Promise<Application> {
    const app = await api.createApplication(input);
    await load();
    return app;
  }

  async function update(id: string, input: UpdateApplicationInput): Promise<Application> {
    const app = await api.updateApplication(id, input);
    const index = applications.findIndex((a) => a.id === id);
    if (index >= 0) {
      applications[index] = app;
    }
    return app;
  }

  async function remove(id: string): Promise<void> {
    await api.deleteApplication(id);
    await load();
  }

  async function archive(id: string): Promise<Application> {
    const app = await api.archiveApplication(id);
    if (!filters.includeArchived) {
      applications = applications.filter((a) => a.id !== id);
      total--;
    } else {
      const index = applications.findIndex((a) => a.id === id);
      if (index >= 0) {
        applications[index] = app;
      }
    }
    return app;
  }

  async function restore(id: string): Promise<Application> {
    const app = await api.restoreApplication(id);
    const index = applications.findIndex((a) => a.id === id);
    if (index >= 0) {
      applications[index] = app;
    }
    return app;
  }

  function setFilters(newFilters: Partial<FilterState>) {
    filters = { ...filters, ...newFilters, page: 1 };
  }

  function setPage(newPage: number) {
    filters = { ...filters, page: newPage };
  }

  function resetFilters() {
    filters = { ...defaultFilters };
  }

  return {
    get applications() {
      return applications;
    },
    get total() {
      return total;
    },
    get page() {
      return page;
    },
    get limit() {
      return limit;
    },
    get loading() {
      return loading;
    },
    get error() {
      return error;
    },
    get filters() {
      return filters;
    },
    get totalPages() {
      return totalPages;
    },
    load,
    create,
    update,
    remove,
    archive,
    restore,
    setFilters,
    setPage,
    resetFilters,
  };
}

export const applicationStore = createApplicationStore();
