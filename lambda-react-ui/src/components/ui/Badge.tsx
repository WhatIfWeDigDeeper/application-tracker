import type { ApplicationStatus } from '@/types/application';
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants';

interface BadgeProps {
  status: ApplicationStatus;
}

export function Badge({ status }: BadgeProps) {
  const colors = STATUS_COLORS[status];
  return (
    <span
      data-testid="status-badge"
      style={{
        color: colors.text,
        backgroundColor: colors.background,
        border: `1px solid ${colors.text}`,
      }}
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
