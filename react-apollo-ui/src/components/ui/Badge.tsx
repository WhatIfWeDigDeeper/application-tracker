import type { ApplicationStatus } from '../../types/application.js';
import { STATUS_LABELS } from '../../types/application.js';

const statusColors: Record<ApplicationStatus, string> = {
  unsubmitted: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 italic',
  applied: 'bg-sky-500 text-white',
  interviewing: 'bg-amber-400 text-amber-950',
  'given offer': 'bg-emerald-500 text-white',
  'accepted offer': 'bg-emerald-700 text-white',
  'declined offer': 'bg-orange-500 text-white',
  rejected: 'bg-red-500 text-white',
  'no offer': 'bg-purple-500 text-white',
};

interface BadgeProps {
  status: ApplicationStatus;
}

export function Badge({ status }: BadgeProps) {
  const color = statusColors[status] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
