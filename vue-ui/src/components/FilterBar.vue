<script setup lang="ts">
import { computed } from 'vue';
import { XMarkIcon, FunnelIcon } from '@heroicons/vue/24/outline';
import type { FilterState, CompanyCategory, JobSource } from '@/types';
import { APPLICATION_STATUSES, COMPANY_CATEGORIES, JOB_SOURCES } from '@/types';

const props = defineProps<{
  filters: FilterState;
  resultCount: number;
  totalCount: number;
}>();

const emit = defineEmits<{
  'update:filters': [filters: Partial<FilterState>];
  clearFilters: [];
}>();

const activeFilterCount = computed(() => {
  let count = 0;
  if (props.filters.status) count++;
  if (props.filters.companyCategory) count++;
  if (props.filters.jobSource) count++;
  if (props.filters.skillsMatchMin) count++;
  if (props.filters.includeArchived) count++;
  return count;
});

function updateFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
  emit('update:filters', { [key]: value });
}

function handleStatusChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  updateFilter('status', value || undefined);
}

function handleCategoryChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value as CompanyCategory | '';
  updateFilter('companyCategory', value || undefined);
}

function handleSourceChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value as JobSource | '';
  updateFilter('jobSource', value || undefined);
}

function handleSkillsChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  updateFilter('skillsMatchMin', value ? parseInt(value, 10) : undefined);
}

function handleArchivedChange(event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  updateFilter('includeArchived', checked);
}

function handleSortByChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value as FilterState['sortBy'];
  updateFilter('sortBy', value);
}

function handleSortDirChange() {
  updateFilter('sortDir', props.filters.sortDir === 'asc' ? 'desc' : 'asc');
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
    <div class="flex flex-wrap gap-4">
      <!-- Status Filter -->
      <div class="flex-1 min-w-[150px]">
        <label
          for="status-filter"
          class="label mb-1"
        >Status</label>
        <select
          id="status-filter"
          class="input"
          :value="filters.status || ''"
          @change="handleStatusChange"
        >
          <option value="">
            All Statuses
          </option>
          <option
            v-for="status in APPLICATION_STATUSES"
            :key="status.value"
            :value="status.value"
          >
            {{ status.label }}
          </option>
        </select>
      </div>

      <!-- Category Filter -->
      <div class="flex-1 min-w-[150px]">
        <label
          for="category-filter"
          class="label mb-1"
        >Category</label>
        <select
          id="category-filter"
          class="input"
          :value="filters.companyCategory || ''"
          @change="handleCategoryChange"
        >
          <option value="">
            All Categories
          </option>
          <option
            v-for="category in COMPANY_CATEGORIES"
            :key="category.value"
            :value="category.value"
          >
            {{ category.label }}
          </option>
        </select>
      </div>

      <!-- Source Filter -->
      <div class="flex-1 min-w-[150px]">
        <label
          for="source-filter"
          class="label mb-1"
        >Source</label>
        <select
          id="source-filter"
          class="input"
          :value="filters.jobSource || ''"
          @change="handleSourceChange"
        >
          <option value="">
            All Sources
          </option>
          <option
            v-for="source in JOB_SOURCES"
            :key="source.value"
            :value="source.value"
          >
            {{ source.label }}
          </option>
        </select>
      </div>

      <!-- Skills Match Filter -->
      <div class="flex-1 min-w-[150px]">
        <label
          for="skills-filter"
          class="label mb-1"
        >Min Skills Match</label>
        <select
          id="skills-filter"
          class="input"
          :value="filters.skillsMatchMin || ''"
          @change="handleSkillsChange"
        >
          <option value="">
            Any
          </option>
          <option value="2">
            2+ Stars
          </option>
          <option value="3">
            3+ Stars
          </option>
          <option value="4">
            4+ Stars
          </option>
          <option value="5">
            5 Stars
          </option>
        </select>
      </div>

      <!-- Sort -->
      <div class="flex-1 min-w-[180px]">
        <label
          for="sort-filter"
          class="label mb-1"
        >Sort By</label>
        <div class="flex">
          <select
            id="sort-filter"
            class="input rounded-r-none"
            :value="filters.sortBy"
            @change="handleSortByChange"
          >
            <option value="dateApplied">
              Date Applied
            </option>
            <option value="companyName">
              Company Name
            </option>
            <option value="updatedAt">
              Last Updated
            </option>
          </select>
          <button
            type="button"
            class="px-3 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"
            @click="handleSortDirChange"
          >
            {{ filters.sortDir === 'asc' ? '↑' : '↓' }}
          </button>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center space-x-4">
        <label class="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            :checked="filters.includeArchived"
            class="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
            @change="handleArchivedChange"
          >
          <span class="text-sm text-gray-700 dark:text-gray-300">Include archived</span>
        </label>

        <button
          v-if="activeFilterCount > 0"
          type="button"
          class="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center"
          @click="emit('clearFilters')"
        >
          <XMarkIcon class="h-4 w-4 mr-1" />
          Clear filters ({{ activeFilterCount }})
        </button>
      </div>

      <div class="text-sm text-gray-500 dark:text-gray-400 flex items-center">
        <FunnelIcon class="h-4 w-4 mr-1" />
        Showing {{ resultCount }} of {{ totalCount }} applications
      </div>
    </div>
  </div>
</template>
