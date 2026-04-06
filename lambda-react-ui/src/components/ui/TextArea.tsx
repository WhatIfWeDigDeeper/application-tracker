import { useEffect, useRef } from 'react';
import type { MouseEventHandler, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  fieldName?: string;
}

export function TextArea({
  label,
  error,
  fieldName,
  id,
  className,
  required,
  rows = 4,
  ...props
}: TextAreaProps) {
  const textAreaId = id ?? `textarea-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!fieldName || !textareaRef.current || typeof window === 'undefined') {
      return;
    }

    const saved = localStorage.getItem(`textarea-height-${fieldName}`);
    if (saved) {
      textareaRef.current.style.height = saved;
    }
  }, [fieldName]);

  const handleMouseUp: MouseEventHandler<HTMLTextAreaElement> = (event) => {
    if (fieldName && typeof window !== 'undefined') {
      localStorage.setItem(`textarea-height-${fieldName}`, event.currentTarget.style.height);
    }
    props.onMouseUp?.(event);
  };

  return (
    <label className="block" htmlFor={textAreaId}>
      <div className="mb-1 text-sm font-medium text-[var(--text-primary)]">
        {label}
        {required ? <span className="ml-1 text-[var(--status-rejected)]">*</span> : null}
      </div>
      <textarea
        ref={textareaRef}
        id={textAreaId}
        required={required}
        rows={rows}
        onMouseUp={handleMouseUp}
        className={cn(
          'w-full resize-y rounded-md border bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]',
          error ? 'border-[var(--status-rejected)]' : 'border-[var(--border-subtle)]',
          className
        )}
        {...props}
      />
      {error ? <div className="mt-1 text-xs text-[var(--status-rejected)]">{error}</div> : null}
    </label>
  );
}
