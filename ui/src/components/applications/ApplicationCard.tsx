'use client';

import { useState, useRef, useEffect } from 'react';
import type { JobApplication } from '@/types/application';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
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
  onArchive,
  onDelete,
  onRestore,
}: ApplicationCardProps): React.ReactElement {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (showMenu && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
  }, [showMenu]);

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
  const isOffered = status === 'given offer';

  return (
    <>
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

          {/* Actions Menu */}
          <div
            className="flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={menuButtonRef}
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
              aria-label="Actions"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
        </div>
      </Card>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div
            data-menu-dropdown
            className="fixed z-20 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1"
            style={{ top: menuPosition.top, right: menuPosition.right }}
          >
            {(onArchive || onRestore) && (
              <button
                onClick={() => {
                  setShowMenu(false);
                  if (isArchived) {
                    onRestore?.();
                  } else {
                    onArchive?.();
                  }
                }}
                className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                {isArchived ? (
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.75 7.5h16.5" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.75 7.5h16.5" />
                  </svg>
                )}
                {isArchived ? 'Restore' : 'Archive'}
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowDeleteConfirm(true);
                }}
                className="flex items-center w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
                Delete
              </button>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete?.();
        }}
        title="Delete Application"
        message={`Are you sure you want to delete the application for ${positionTitle} at ${companyName}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}
