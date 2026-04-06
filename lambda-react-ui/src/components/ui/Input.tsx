import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className, required, ...props }: InputProps) {
  const inputId = id ?? `input-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <label className="block" htmlFor={inputId}>
      <div className="mb-1 text-sm font-medium text-[var(--text-primary)]">
        {label}
        {required ? <span className="ml-1 text-[var(--status-rejected)]">*</span> : null}
      </div>
      <input
        id={inputId}
        required={required}
        className={cn(
          'h-10 w-full rounded-md border bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]',
          error ? 'border-[var(--status-rejected)]' : 'border-[var(--border-subtle)]',
          className
        )}
        {...props}
      />
      {error ? <div className="mt-1 text-xs text-[var(--status-rejected)]">{error}</div> : null}
    </label>
  );
}
