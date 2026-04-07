import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CsvImportModal } from '@/components/applications/CsvImportModal';
import { Button } from '@/components/ui/Button';
import { CATEGORY_LABELS, SOURCE_LABELS, STATUS_LABELS } from '@/lib/constants';
import { downloadSampleCSV, exportCSV } from '@/services/api';
import { useFilterStore } from '@/stores/filterStore';
import { useUiStore } from '@/stores/uiStore';
import type { ApplicationStatus } from '@/types/application';

interface FilterBarProps {
  total: number;
  visibleCount: number;
  onImported?: () => Promise<void>;
}

const statusOptions = Object.entries(STATUS_LABELS) as Array<[ApplicationStatus, string]>;

export function FilterBar({ total, visibleCount, onImported }: FilterBarProps) {
  const [importOpen, setImportOpen] = useState(false);
  const navigate = useNavigate();
  const status = useFilterStore((state) => state.status);
  const companyCategory = useFilterStore((state) => state.companyCategory);
  const jobSource = useFilterStore((state) => state.jobSource);
  const skillsMatchMin = useFilterStore((state) => state.skillsMatchMin);
  const includeArchived = useFilterStore((state) => state.includeArchived);
  const sortBy = useFilterStore((state) => state.sortBy);
  const sortDir = useFilterStore((state) => state.sortDir);
  const setStatusFilter = useFilterStore((state) => state.setStatusFilter);
  const setCategoryFilter = useFilterStore((state) => state.setCategoryFilter);
  const setSourceFilter = useFilterStore((state) => state.setSourceFilter);
  const setSkillsMatchMin = useFilterStore((state) => state.setSkillsMatchMin);
  const setIncludeArchived = useFilterStore((state) => state.setIncludeArchived);
  const setSortBy = useFilterStore((state) => state.setSortBy);
  const setSortDir = useFilterStore((state) => state.setSortDir);
  const clearFilters = useFilterStore((state) => state.clearFilters);
  const activeFilterCount = useFilterStore((state) => state.activeFilterCount());

  const viewMode = useUiStore((state) => state.viewMode);
  const setViewMode = useUiStore((state) => state.setViewMode);

  const toggleStatus = (nextStatus: ApplicationStatus) => {
    const next = status.includes(nextStatus)
      ? status.filter((item) => item !== nextStatus)
      : [...status, nextStatus];
    setStatusFilter(next);
  };

  const activeLabels: string[] = [];
  if (status.length > 0) {
    activeLabels.push(`Status: ${status.map((item) => STATUS_LABELS[item]).join(', ')}`);
  }
  if (companyCategory) {
    activeLabels.push(`Category: ${CATEGORY_LABELS[companyCategory]}`);
  }
  if (jobSource) {
    activeLabels.push(`Source: ${SOURCE_LABELS[jobSource]}`);
  }
  if (skillsMatchMin != null) {
    activeLabels.push(`Skills: ${skillsMatchMin}+ stars`);
  }
  if (includeArchived) {
    activeLabels.push('Including archived');
  }

  return (
    <div className="mb-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3">
      <div className="flex flex-wrap items-center gap-2">
        {statusOptions.map(([value, label]) => (
          <label
            key={value}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--border-subtle)] px-2 py-1 text-xs text-[var(--text-primary)]"
          >
            <input
              type="checkbox"
              checked={status.includes(value)}
              onChange={() => toggleStatus(value)}
            />
            {label}
          </label>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <select
          value={companyCategory ?? ''}
          onChange={(event) =>
            setCategoryFilter((event.target.value || undefined) as keyof typeof CATEGORY_LABELS | undefined)
          }
          className="h-9 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-2 text-sm"
        >
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={jobSource ?? ''}
          onChange={(event) => setSourceFilter((event.target.value || undefined) as keyof typeof SOURCE_LABELS | undefined)}
          className="h-9 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-2 text-sm"
        >
          <option value="">All sources</option>
          {Object.entries(SOURCE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={skillsMatchMin != null ? String(skillsMatchMin) : ''}
          onChange={(event) => setSkillsMatchMin(event.target.value ? Number(event.target.value) : undefined)}
          className="h-9 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-2 text-sm"
        >
          <option value="">Any skills match</option>
          <option value="2">2+ stars</option>
          <option value="3">3+ stars</option>
          <option value="4">4+ stars</option>
          <option value="5">5 stars</option>
        </select>

        <label className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--border-subtle)] px-2 text-sm text-[var(--text-primary)]">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(event) => setIncludeArchived(event.target.checked)}
          />
          Include archived
        </label>

        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
          className="h-9 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-2 text-sm"
        >
          <option value="updatedAt">Last Updated</option>
          <option value="dateApplied">Date Applied</option>
          <option value="companyName">Company Name</option>
        </select>

        <Button size="sm" variant="secondary" onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')} type="button">
          {sortDir === 'asc' ? 'Asc' : 'Desc'}
        </Button>

        <Button size="sm" variant="ghost" onClick={() => clearFilters()} type="button">
          Clear {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
        </Button>

        <div className="flex w-full flex-wrap items-center gap-2 md:ml-auto md:w-auto">
          <Button size="sm" variant="secondary" type="button" onClick={() => setImportOpen(true)}>
            Import CSV
          </Button>
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)]"
            onClick={() => void exportCSV()}
          >
            Export CSV
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)]"
            onClick={() => void downloadSampleCSV()}
          >
            Template
          </button>
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewMode('grid')}
            type="button"
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewMode('list')}
            type="button"
          >
            List
          </Button>
          <Button size="sm" onClick={() => navigate('/applications/new')} type="button">
            Add Application
          </Button>
        </div>
      </div>

      <p className="mb-0 mt-2 text-sm text-[var(--text-secondary)]">
        Showing {visibleCount} of {total} applications
        {activeLabels.length > 0 ? ` - ${activeLabels.join(' | ')}` : ''}
      </p>

      <CsvImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={onImported}
      />
    </div>
  );
}
