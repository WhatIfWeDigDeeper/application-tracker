import type {
  FilterState,
  ApplicationStatus,
  CompanyCategory,
  JobSource,
  SortState,
} from "../../types/application";
import { Button, Select, Checkbox } from "../ui";
import {
  APPLICATION_STATUSES,
  COMPANY_CATEGORIES,
  JOB_SOURCES,
} from "../../lib/constants";

interface FilterBarProps {
  filters: FilterState;
  sorting: SortState;
  resultCount: number;
  totalCount: number;
  onStatusChange: (statuses: ApplicationStatus[]) => void;
  onCategoryChange: (category: CompanyCategory | null) => void;
  onSourceChange: (source: JobSource | null) => void;
  onSkillsMatchChange: (min: number | null) => void;
  onIncludeArchivedChange: (include: boolean) => void;
  onSortByChange: (sortBy: SortState["sortBy"]) => void;
  onSortDirToggle: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
}

const SORT_OPTIONS = [
  { value: "dateApplied", label: "Date Applied" },
  { value: "companyName", label: "Company Name" },
  { value: "updatedAt", label: "Last Updated" },
];

const SKILLS_MATCH_OPTIONS = [
  { value: "", label: "Any" },
  { value: "2", label: "2+ stars" },
  { value: "3", label: "3+ stars" },
  { value: "4", label: "4+ stars" },
  { value: "5", label: "5 stars" },
];

export function FilterBar({
  filters,
  sorting,
  resultCount,
  totalCount,
  onStatusChange,
  onCategoryChange,
  onSourceChange,
  onSkillsMatchChange,
  onIncludeArchivedChange,
  onSortByChange,
  onSortDirToggle,
  onClearFilters,
  hasActiveFilters,
  activeFilterCount,
}: FilterBarProps) {
  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Status Filter - Multi-select (simplified to single for now) */}
        <div className="w-40">
          <Select
            label="Status"
            value={filters.status[0] || ""}
            onChange={(e) => {
              const value = e.target.value as ApplicationStatus;
              onStatusChange(value ? [value] : []);
            }}
            options={APPLICATION_STATUSES}
            placeholder="All statuses"
          />
        </div>

        {/* Category Filter */}
        <div className="w-44">
          <Select
            label="Category"
            value={filters.companyCategory || ""}
            onChange={(e) =>
              onCategoryChange(
                (e.target.value as CompanyCategory) || null
              )
            }
            options={COMPANY_CATEGORIES}
            placeholder="All categories"
          />
        </div>

        {/* Source Filter */}
        <div className="w-40">
          <Select
            label="Source"
            value={filters.jobSource || ""}
            onChange={(e) =>
              onSourceChange((e.target.value as JobSource) || null)
            }
            options={JOB_SOURCES}
            placeholder="All sources"
          />
        </div>

        {/* Skills Match Filter */}
        <div className="w-32">
          <Select
            label="Skills"
            value={filters.skillsMatchMin?.toString() || ""}
            onChange={(e) =>
              onSkillsMatchChange(
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            options={SKILLS_MATCH_OPTIONS}
          />
        </div>

        {/* Include Archived */}
        <div className="pb-2">
          <Checkbox
            label="Show archived"
            checked={filters.includeArchived}
            onChange={(e) => onIncludeArchivedChange(e.target.checked)}
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="pb-2">
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              Clear ({activeFilterCount})
            </Button>
          </div>
        )}
      </div>

      {/* Sort Controls and Results Count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {resultCount === totalCount
            ? `${totalCount} application${totalCount !== 1 ? "s" : ""}`
            : `${resultCount} of ${totalCount} applications`}
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={sorting.sortBy}
            onChange={(e) =>
              onSortByChange(e.target.value as SortState["sortBy"])
            }
            options={SORT_OPTIONS}
            className="w-36"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={onSortDirToggle}
            aria-label={
              sorting.sortDir === "asc"
                ? "Sort ascending"
                : "Sort descending"
            }
          >
            {sorting.sortDir === "asc" ? (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
                />
              </svg>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
