'use client';

import type { SortOptions, SortField } from '@/types/application';
import { Select, type SelectOption } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { SortAscIcon, SortDescIcon } from '@/assets/icons/SortIcon';

export interface SortControlsProps {
  sort: SortOptions;
  onSortChange: (sort: SortOptions) => void;
}

const sortFieldOptions: SelectOption[] = [
  { value: 'dateApplied', label: 'Date Applied' },
  { value: 'companyName', label: 'Company Name' },
  { value: 'status', label: 'Status' },
  { value: 'updatedAt', label: 'Last Updated' },
];

export function SortControls({
  sort,
  onSortChange,
}: SortControlsProps): React.ReactElement {
  const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    onSortChange({
      ...sort,
      field: e.target.value as SortField,
    });
  };

  const toggleDirection = (): void => {
    onSortChange({
      ...sort,
      direction: sort.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Sort by:</span>
      <Select
        options={sortFieldOptions}
        value={sort.field}
        onChange={handleFieldChange}
        className="w-40"
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleDirection}
        aria-label={`Sort ${sort.direction === 'asc' ? 'descending' : 'ascending'}`}
      >
        {sort.direction === 'asc' ? (
          <SortAscIcon className="w-4 h-4" />
        ) : (
          <SortDescIcon className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
