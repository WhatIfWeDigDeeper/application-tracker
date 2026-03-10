import type { ApplicationStatus, CompanyCategory, JobSource } from '../../types/application.js';
import { STATUS_LABELS, CATEGORY_LABELS, SOURCE_LABELS, COMPANY_CATEGORIES, JOB_SOURCES } from '../../types/application.js';

export interface Filters {
  status?: ApplicationStatus;
  companyCategory?: CompanyCategory;
  jobSource?: JobSource;
  skillsMatchMin?: number;
  includeArchived?: boolean;
  sortBy?: string;
  sortDir?: string;
}

interface FilterBarProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: 'unsubmitted', label: STATUS_LABELS.unsubmitted },
  { value: 'applied', label: STATUS_LABELS.applied },
  { value: 'interviewing', label: STATUS_LABELS.interviewing },
  { value: 'given offer', label: STATUS_LABELS['given offer'] },
  { value: 'accepted offer', label: STATUS_LABELS['accepted offer'] },
  { value: 'declined offer', label: STATUS_LABELS['declined offer'] },
  { value: 'rejected', label: STATUS_LABELS.rejected },
  { value: 'no offer', label: STATUS_LABELS['no offer'] },
];

const CATEGORY_OPTIONS = COMPANY_CATEGORIES.map((v) => ({ value: v, label: CATEGORY_LABELS[v] }));
const SOURCE_OPTIONS = JOB_SOURCES.map((v) => ({ value: v, label: SOURCE_LABELS[v] }));

const SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Last Updated' },
  { value: 'dateApplied', label: 'Date Applied' },
  { value: 'companyName', label: 'Company Name' },
  { value: 'skillsMatch', label: 'Skills Match' },
];

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const update = (partial: Partial<Filters>) => onFilterChange({ ...filters, ...partial });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div>
          <label htmlFor="filter-status" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
          <select
            id="filter-status"
            value={filters.status ?? ''}
            onChange={(e) => update({ status: (e.target.value || undefined) as ApplicationStatus | undefined })}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="filter-category" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Category</label>
          <select
            id="filter-category"
            value={filters.companyCategory ?? ''}
            onChange={(e) => update({ companyCategory: (e.target.value || undefined) as CompanyCategory | undefined })}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All categories</option>
            {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="filter-source" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Source</label>
          <select
            id="filter-source"
            value={filters.jobSource ?? ''}
            onChange={(e) => update({ jobSource: (e.target.value || undefined) as JobSource | undefined })}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All sources</option>
            {SOURCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="filter-skills" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Skills Match Min</label>
          <input
            id="filter-skills"
            type="number"
            min="1"
            max="5"
            value={filters.skillsMatchMin ?? ''}
            onChange={(e) => update({ skillsMatchMin: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="1-5"
          />
        </div>

        <div>
          <label htmlFor="filter-sort" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Sort By</label>
          <select
            id="filter-sort"
            value={filters.sortBy ?? 'updatedAt'}
            onChange={(e) => update({ sortBy: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 mt-5">
            <input
              id="filter-archived"
              type="checkbox"
              checked={filters.includeArchived ?? false}
              onChange={(e) => update({ includeArchived: e.target.checked })}
              className="w-3.5 h-3.5"
            />
            Include Archived
          </label>
          <button
            type="button"
            onClick={() => update({ sortDir: filters.sortDir === 'asc' ? 'desc' : 'asc' })}
            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            {filters.sortDir === 'asc' ? 'Asc' : 'Desc'}
          </button>
        </div>
      </div>
    </div>
  );
}
