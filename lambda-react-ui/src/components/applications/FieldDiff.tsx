interface FieldDiffProps {
  label: string;
  oldValue: unknown;
  newValue: unknown;
}

function formatValue(value: unknown): string {
  if (value == null) {
    return '—';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

export function FieldDiff({ label, oldValue, newValue }: FieldDiffProps) {
  return (
    <div data-testid="field-diff" className="rounded border border-[var(--border-subtle)] px-2 py-1 text-xs">
      <span className="font-medium text-[var(--text-primary)]">{label}: </span>
      <span className="line-through text-[var(--text-tertiary)]">{formatValue(oldValue)}</span>
      <span className="mx-1 text-[var(--text-secondary)]">→</span>
      <span className="font-semibold text-green-600">{formatValue(newValue)}</span>
    </div>
  );
}
