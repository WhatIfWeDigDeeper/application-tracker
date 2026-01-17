'use client';

import type { JobApplication } from '@/types/application';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate, formatSalaryRange, getDaysRemaining, formatDaysRemaining, cn } from '@/lib/utils';
import { CATEGORY_LABELS, SOURCE_LABELS } from '@/lib/constants';
import { CalendarIcon } from '@/assets/icons/CalendarIcon';

export interface ApplicationCardProps {
  application: JobApplication;
  onClick?: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
}

export function ApplicationCard({
  application,
  onClick,
  onEdit,
  onArchive,
  onDelete,
  onRestore,
}: ApplicationCardProps): React.ReactElement {
  const {
    companyName,
    positionTitle,
    dateApplied,
    status,
    companyCategory,
    skillsMatch,
    jobSource,
    salaryMin,
    salaryMax,
    isArchived,
    interviewStages,
    offerDueDate,
  } = application;

  const completedStages = interviewStages.filter((s) => s.isCompleted).length;
  const totalStages = interviewStages.length;
  const salaryRange = formatSalaryRange(salaryMin, salaryMax);
  const daysRemaining = offerDueDate ? getDaysRemaining(offerDueDate) : null;
  const isOffered = status === 'offered';

  return (
    <Card
      className={cn(
        'hover:shadow-md transition-shadow cursor-pointer',
        isArchived && 'opacity-60'
      )}
      onClick={onClick}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50 truncate">
                {companyName}
              </h3>
              <p className="text-gray-600 dark:text-slate-400 truncate">{positionTitle}</p>
            </div>
            <StatusBadge status={status} size="sm" />
          </div>

          {/* Meta Info */}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-slate-400">
            <span>Applied: {formatDate(dateApplied)}</span>

            {companyCategory && (
              <span>{CATEGORY_LABELS[companyCategory]}</span>
            )}

            {jobSource && (
              <span>via {SOURCE_LABELS[jobSource]}</span>
            )}

            {skillsMatch && (
              <span>Match: {skillsMatch}/5</span>
            )}
          </div>

          {/* Interview Progress */}
          {status === 'interviewing' && totalStages > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600 dark:text-slate-400">
                  Interview Progress: {completedStages}/{totalStages}
                </span>
              </div>
              <div className="mt-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-status-interviewing transition-all"
                  style={{ width: `${(completedStages / totalStages) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Offer Deadline */}
          {isOffered && offerDueDate && daysRemaining !== null && (
            <div
              className={cn(
                'mt-3 flex items-center gap-2 text-sm px-2 py-1 rounded',
                daysRemaining < 0
                  ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-200'
                  : daysRemaining <= 3
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-200'
                    : 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-200'
              )}
            >
              <CalendarIcon className="w-4 h-4" />
              <span className="font-medium">{formatDaysRemaining(daysRemaining)}</span>
            </div>
          )}

          {/* Salary Range */}
          {salaryRange && (
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">{salaryRange}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:flex-col">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Edit application"
              title="Edit"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}

          {!isArchived && onArchive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive();
              }}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              aria-label="Archive application"
              title="Archive"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
            </button>
          )}

          {isArchived && onRestore && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRestore();
              }}
              className="p-2 text-gray-400 hover:text-green-600 rounded-md hover:bg-gray-100"
              aria-label="Restore application"
              title="Restore"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          )}

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-gray-100"
              aria-label="Delete application"
              title="Delete"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
