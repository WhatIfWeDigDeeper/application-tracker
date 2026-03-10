import type { ApplicationStatus } from '../../types/application.js';
import { STATUS_LABELS } from '../../types/application.js';

const statusColors: Record<ApplicationStatus, string> = {
  unsubmitted: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  applied: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  interviewing: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  'given offer': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'accepted offer': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  'declined offer': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  'no offer': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
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
