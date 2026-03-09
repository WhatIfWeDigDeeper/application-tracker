import type { ApplicationStatus } from '../../types/application.js';

const statusColors: Record<ApplicationStatus, string> = {
  wishlist: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  applied: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  interviewing: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  offer: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  withdrawn: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  archived: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
};

interface BadgeProps {
  status: ApplicationStatus;
}

export function Badge({ status }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[status]}`}>
      {status}
    </span>
  );
}
