import { useState } from "react";
import type { InterviewStage } from "../../types/application";
import { Button, RatingDisplay, Checkbox, ConfirmDialog } from "../ui";
import { formatDate, getTodayDate } from "../../lib/utils";
import { cn } from "../../lib/utils";

interface InterviewStageItemProps {
  stage: InterviewStage;
  onToggleComplete: (isCompleted: boolean, completedDate?: string | null) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function InterviewStageItem({
  stage,
  onToggleComplete,
  onEdit,
  onDelete,
}: InterviewStageItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => {
    if (!stage.isCompleted) {
      onToggleComplete(true, getTodayDate());
    } else {
      onToggleComplete(false, null);
    }
  };

  return (
    <>
      <div
        className={cn(
          "border border-gray-200 dark:border-gray-700 rounded-lg transition-colors",
          stage.isCompleted
            ? "bg-gray-50 dark:bg-gray-800/50"
            : "bg-white dark:bg-gray-800"
        )}
      >
        <div className="flex items-center gap-3 p-3">
          <Checkbox
            checked={stage.isCompleted}
            onChange={handleToggle}
            aria-label={`Mark ${stage.name} as ${
              stage.isCompleted ? "incomplete" : "complete"
            }`}
          />

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex-1 text-left min-w-0"
          >
            <span
              className={cn(
                "font-medium",
                stage.isCompleted
                  ? "text-gray-500 dark:text-gray-400 line-through"
                  : "text-gray-900 dark:text-white"
              )}
            >
              {stage.name}
            </span>
            {stage.completedDate && (
              <span className="ml-2 text-sm text-gray-400 dark:text-gray-500">
                {formatDate(stage.completedDate)}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2">
            {stage.performanceRating && (
              <RatingDisplay value={stage.performanceRating} size="sm" />
            )}

            {stage.notes && (
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-label="Has notes"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
            )}

            <svg
              className={cn(
                "w-4 h-4 text-gray-400 transition-transform",
                expanded && "rotate-180"
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {expanded && (
          <div className="px-3 pb-3 pt-0 border-t border-gray-200 dark:border-gray-700">
            {stage.notes && (
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {stage.notes}
              </p>
            )}

            <div className="flex justify-end gap-2 mt-3">
              <Button variant="ghost" size="sm" onClick={onEdit}>
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Remove
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete();
        }}
        title="Remove Interview Stage"
        message={`Are you sure you want to remove "${stage.name}"?`}
        confirmLabel="Remove"
        isDestructive
      />
    </>
  );
}
