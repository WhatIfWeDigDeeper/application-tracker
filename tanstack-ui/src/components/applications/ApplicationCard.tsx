import { useState } from "react";
import { Link } from "@tanstack/react-router";
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
          "relative",
          application.isArchived && "opacity-60"
        )}
      >
        <Link to="/applications/$id" params={{ id: application.id }} className="block p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {application.companyName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {application.positionTitle}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <Badge status={application.status} />
            </div>
          </div>

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

            {application.isArchived && (
              <span className="text-gray-400 dark:text-gray-500 italic">
                Archived
              </span>
            )}
          </div>
        </Link>

        {/* Actions Menu */}
        <div
          className="absolute top-4 right-4"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Actions"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-1 z-20 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
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
        </div>
      </Card>

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
