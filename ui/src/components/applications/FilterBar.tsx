'use client';

import { useState } from 'react';
import type { ApplicationFilters, ApplicationStatus, CompanyCategory, JobSource } from '@/types/application';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FilterIcon } from '@/assets/icons/FilterIcon';
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  COMPANY_CATEGORIES,
  CATEGORY_LABELS,
  JOB_SOURCES,
  SOURCE_LABELS,
} from '@/lib/constants';
import { cn } from '@/lib/utils';

export interface FilterBarProps {
  filters: ApplicationFilters;
  onFiltersChange: (filters: ApplicationFilters) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function FilterBar({
  filters,
  onFiltersChange,
  onClearFilters,
  hasActiveFilters,
}: FilterBarProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleStatus = (status: ApplicationStatus): void => {
    const currentStatuses = filters.status ?? [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];
    onFiltersChange({
      ...filters,
      status: newStatuses.length > 0 ? newStatuses : undefined,
    });
  };

  const toggleCategory = (category: CompanyCategory): void => {
    const currentCategories = filters.companyCategory ?? [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter((c) => c !== category)
      : [...currentCategories, category];
    onFiltersChange({
      ...filters,
      companyCategory: newCategories.length > 0 ? newCategories : undefined,
    });
  };

  const toggleJobSource = (source: JobSource): void => {
    const currentSources = filters.jobSource ?? [];
    const newSources = currentSources.includes(source)
      ? currentSources.filter((s) => s !== source)
      : [...currentSources, source];
    onFiltersChange({
      ...filters,
      jobSource: newSources.length > 0 ? newSources : undefined,
    });
  };

  const toggleIncludeArchived = (): void => {
    onFiltersChange({
      ...filters,
      includeArchived: !filters.includeArchived,
    });
  };

  const setSkillsMatchMin = (value: string): void => {
    const min = value === '' ? undefined : Number(value);
    onFiltersChange({
      ...filters,
      skillsMatchMin: min,
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-3 sm:p-4 mb-4">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 min-h-[44px] px-2 -mx-2 rounded-md"
          aria-expanded={isExpanded}
        >
          <FilterIcon className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">Filters</span>
          {hasActiveFilters && (
            <Badge variant="info" size="sm">
              Active
            </Badge>
          )}
          <svg
            className={cn(
              'w-4 h-4 transition-transform ml-1',
              isExpanded && 'rotate-180'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Clear All
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Status Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Status</h4>
            <div className="flex flex-wrap gap-2">
              {APPLICATION_STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm border transition-colors',
                    filters.status?.includes(status)
                      ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200'
                      : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-600'
                  )}
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Category</h4>
            <div className="flex flex-wrap gap-2">
              {COMPANY_CATEGORIES.slice(0, 12).map((category) => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm border transition-colors',
                    filters.companyCategory?.includes(category)
                      ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200'
                      : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-600'
                  )}
                >
                  {CATEGORY_LABELS[category]}
                </button>
              ))}
              {COMPANY_CATEGORIES.length > 12 && (
                <span className="text-sm text-gray-400 dark:text-slate-500 py-1">
                  +{COMPANY_CATEGORIES.length - 12} more
                </span>
              )}
            </div>
          </div>

          {/* Job Source Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Source</h4>
            <div className="flex flex-wrap gap-2">
              {JOB_SOURCES.map((source) => (
                <button
                  key={source}
                  onClick={() => toggleJobSource(source)}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm border transition-colors',
                    filters.jobSource?.includes(source)
                      ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200'
                      : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-600'
                  )}
                >
                  {SOURCE_LABELS[source]}
                </button>
              ))}
            </div>
          </div>

          {/* Skills Match Min Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Minimum Skills Match</h4>
            <select
              value={filters.skillsMatchMin ?? ''}
              onChange={(e) => setSkillsMatchMin(e.target.value)}
              className="block w-full max-w-xs rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">Any</option>
              <option value="1">1+ (Poor or better)</option>
              <option value="2">2+ (Below Average or better)</option>
              <option value="3">3+ (Average or better)</option>
              <option value="4">4+ (Good or better)</option>
              <option value="5">5 (Excellent only)</option>
            </select>
          </div>

          {/* Include Archived Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeArchived"
              checked={filters.includeArchived ?? false}
              onChange={toggleIncludeArchived}
              className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="includeArchived" className="text-sm text-gray-700 dark:text-slate-300">
              Show archived applications
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
