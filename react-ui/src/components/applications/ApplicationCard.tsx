import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Application } from "../../types/application";
import { Card, Badge, RatingDisplay, ConfirmDialog } from "../ui";
import { formatDate, getDaysUntil, isOverdue } from "../../lib/utils";
import { COMPANY_CATEGORIES } from "../../lib/constants";
import { cn } from "../../lib/utils";

interface ApplicationCardProps {
  application: Application;
  onArchive: () => void;
  onDelete: () => void;
}

export function ApplicationCard({
  application,
  onArchive,
  onDelete,
}: ApplicationCardProps) {
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

  const categoryLabel = application.companyCategory
    ? COMPANY_CATEGORIES.find((c) => c.value === application.companyCategory)
        ?.label
    : null;

  const completedStages = application.interviewStages.filter(
    (s) => s.isCompleted
  ).length;
  const totalStages = application.interviewStages.length;

  const daysUntil = getDaysUntil(application.offerDueDate);
  const offerOverdue = isOverdue(application.offerDueDate);

  return (
    <>
      <Card
        hoverable
        className={cn(
          "overflow-hidden",
          application.isArchived && "opacity-60"
        )}
      >
        <div className="flex items-start p-4 min-w-0">
          <Link to={`/applications/${application.id}`} className="flex-1 min-w-0 block">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {application.companyName}
              </h3>
              <Badge status={application.status} />
              {application.isArchived && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300 whitespace-nowrap">
                  Archived
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {application.positionTitle}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-gray-500 dark:text-gray-400">
              <span>Applied: {formatDate(application.dateApplied)}</span>

              {categoryLabel && <span>{categoryLabel}</span>}

              {application.skillsMatch && (
                <RatingDisplay value={application.skillsMatch} size="sm" />
              )}

              {application.status === "interviewing" && totalStages > 0 && (
                <span className="text-purple-600 dark:text-purple-400">
                  {completedStages}/{totalStages} stages
                </span>
              )}

              {application.status === "given offer" &&
                application.offerDueDate && (
                  <span
                    className={cn(
                      "font-medium",
                      offerOverdue
                        ? "text-red-600 dark:text-red-400"
                        : daysUntil !== null && daysUntil <= 3
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-green-600 dark:text-green-400"
                    )}
                  >
                    {offerOverdue
                      ? "Overdue!"
                      : daysUntil === 0
                      ? "Due today"
                      : `${daysUntil} days left`}
                  </span>
                )}
            </div>
          </Link>

          {/* Actions Menu */}
          <div
            className="relative ml-4 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={menuButtonRef}
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
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
            className="fixed z-20 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1"
            style={{ top: menuPosition.top, right: menuPosition.right }}
          >
            <button
              onClick={() => {
                setShowMenu(false);
                onArchive();
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {application.isArchived ? "Restore" : "Archive"}
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                setShowDeleteConfirm(true);
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Delete
            </button>
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete();
        }}
        title="Delete Application"
        message={`Are you sure you want to delete the application for ${application.positionTitle} at ${application.companyName}? This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive
      />
    </>
  );
}
