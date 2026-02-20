<script lang="ts">
  import type { FilterState, CompanyCategory, JobSource } from '$lib/types';
  import { ALL_STATUSES, ALL_CATEGORIES, ALL_SOURCES, STATUS_LABELS, CATEGORY_LABELS, SOURCE_LABELS } from '$lib/types';

  interface Props {
    filters: FilterState;
    resultCount: number;
    totalCount: number;
    onchange: (filters: Partial<FilterState>) => void;
    onreset: () => void;
  }

  let { filters, resultCount, totalCount, onchange, onreset }: Props = $props();

  const hasActiveFilters = $derived(
    filters.status || filters.companyCategory || filters.jobSource || filters.skillsMatchMin || filters.includeArchived
  );
</script>

<div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xs border border-gray-200 dark:border-gray-700">
  <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 items-end">
    <!-- Status Filter -->
    <div>
      <label for="status" class="label mb-1">Status</label>
      <select
        id="status"
        class="input"
        value={filters.status || ''}
        onchange={(e) => onchange({ status: e.currentTarget.value || undefined })}
      >
        <option value="">All Statuses</option>
        {#each ALL_STATUSES as status}
          <option value={status}>{STATUS_LABELS[status]}</option>
        {/each}
      </select>
    </div>

    <!-- Category Filter -->
    <div>
      <label for="category" class="label mb-1">Category</label>
      <select
        id="category"
        class="input"
        value={filters.companyCategory || ''}
        onchange={(e) => onchange({ companyCategory: (e.currentTarget.value as CompanyCategory) || undefined })}
      >
        <option value="">All Categories</option>
        {#each ALL_CATEGORIES as category}
          <option value={category}>{CATEGORY_LABELS[category]}</option>
        {/each}
      </select>
    </div>

    <!-- Source Filter -->
    <div>
      <label for="source" class="label mb-1">Source</label>
      <select
        id="source"
        class="input"
        value={filters.jobSource || ''}
        onchange={(e) => onchange({ jobSource: (e.currentTarget.value as JobSource) || undefined })}
      >
        <option value="">All Sources</option>
        {#each ALL_SOURCES as source}
          <option value={source}>{SOURCE_LABELS[source]}</option>
        {/each}
      </select>
    </div>

    <!-- Skills Match Filter -->
    <div>
      <label for="skills" class="label mb-1">Min Skills Match</label>
      <select
        id="skills"
        class="input"
        value={filters.skillsMatchMin || ''}
        onchange={(e) => onchange({ skillsMatchMin: e.currentTarget.value ? Number(e.currentTarget.value) : undefined })}
      >
        <option value="">Any</option>
        <option value="2">2+</option>
        <option value="3">3+</option>
        <option value="4">4+</option>
        <option value="5">5</option>
      </select>
    </div>

    <!-- Sort -->
    <div class="sm:col-span-2 lg:col-span-1">
      <label for="sort" class="label mb-1">Sort By</label>
      <div class="flex gap-2">
        <select
          id="sort"
          class="input flex-1"
          value={filters.sortBy}
          onchange={(e) => onchange({ sortBy: e.currentTarget.value as FilterState['sortBy'] })}
        >
          <option value="dateApplied">Date Applied</option>
          <option value="companyName">Company Name</option>
          <option value="updatedAt">Last Updated</option>
        </select>
        <button
          type="button"
          class="btn-secondary px-3"
          onclick={() => onchange({ sortDir: filters.sortDir === 'asc' ? 'desc' : 'asc' })}
          aria-label="Toggle sort direction"
        >
          {#if filters.sortDir === 'asc'}
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
            </svg>
          {:else}
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          {/if}
        </button>
      </div>
    </div>
  </div>

  <div class="mt-4 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          checked={filters.includeArchived}
          onchange={(e) => onchange({ includeArchived: e.currentTarget.checked })}
        />
        Include archived
      </label>
      {#if hasActiveFilters}
        <button type="button" class="text-sm text-primary-600 hover:text-primary-700" onclick={onreset}>
          Clear filters
        </button>
      {/if}
    </div>
    <span class="text-sm text-gray-500 dark:text-gray-400">
      Showing {resultCount} of {totalCount} applications
    </span>
  </div>
</div>
