import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: SelectOption[];
}

export function Select({ label, error, options, id, className, required, ...props }: SelectProps) {
  const selectId = id ?? `select-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <label className="block" htmlFor={selectId}>
      <div className="mb-1 text-sm font-medium text-[var(--text-primary)]">
        {label}
        {required ? <span className="ml-1 text-[var(--status-rejected)]">*</span> : null}
      </div>
      <select
        id={selectId}
        required={required}
        className={cn(
          'h-10 w-full rounded-md border bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]',
          error ? 'border-[var(--status-rejected)]' : 'border-[var(--border-subtle)]',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <div className="mt-1 text-xs text-[var(--status-rejected)]">{error}</div> : null}
    </label>
  );
}
