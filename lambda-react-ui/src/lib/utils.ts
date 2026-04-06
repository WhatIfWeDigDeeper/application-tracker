export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsed =
    year && month && day
      ? new Date(year, month - 1, day)
      : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatSalaryRange(min: number | null, max: number | null): string {
  if (min == null && max == null) {
    return '—';
  }

  const formatK = (value: number): string => `$${Math.round(value / 1000)}K`;

  if (min != null && max != null) {
    return `${formatK(min)}-$${Math.round(max / 1000)}K`;
  }

  if (min != null) {
    return `${formatK(min)}+`;
  }

  return `Up to ${formatK(max as number)}`;
}

export function getTodayDate(): string {
  const [datePart] = new Date().toISOString().split('T');
  return datePart ?? '';
}

export function getDaysUntil(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const target = new Date(`${value}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = target.getTime() - today.getTime();

  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function isOverdue(value: string | null | undefined): boolean {
  const days = getDaysUntil(value);
  return days != null && days < 0;
}
