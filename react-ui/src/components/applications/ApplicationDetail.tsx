import { useState } from "react";
import type {
  Application,
  UpdateApplicationInput,
  CreateInterviewStageInput,
  UpdateInterviewStageInput,
} from "../../types/application";
import {
  Button,
  Badge,
  RatingDisplay,
  ConfirmDialog,
  Card,
  CardContent,
} from "../ui";
import { ApplicationForm } from "./ApplicationForm";
import { InterviewStageList } from "../interviews/InterviewStageList";
import { formatDate, formatSalaryRange, getDaysUntil, isOverdue } from "../../lib/utils";
import { COMPANY_CATEGORIES, JOB_SOURCES } from "../../lib/constants";
import { cn } from "../../lib/utils";

interface ApplicationDetailProps {
  application: Application;
  onUpdate: (data: UpdateApplicationInput) => Promise<void>;
  onArchive: () => Promise<void>;
  onRestore: () => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
  onAddStage: (input: CreateInterviewStageInput) => Promise<void>;
  onUpdateStage: (stageId: string, input: UpdateInterviewStageInput) => Promise<void>;
  onDeleteStage: (stageId: string) => Promise<void>;
  isLoading?: boolean;
}

export function ApplicationDetail({
  application,
  onUpdate,
  onArchive,
  onRestore,
  onDelete,
  onClose,
  onAddStage,
  onUpdateStage,
  onDeleteStage,
  isLoading = false,
}: ApplicationDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const categoryLabel = application.companyCategory
    ? COMPANY_CATEGORIES.find((c) => c.value === application.companyCategory)
        ?.label
    : null;

  const sourceLabel = application.jobSource
    ? JOB_SOURCES.find((s) => s.value === application.jobSource)?.label
    : null;

  const daysUntil = getDaysUntil(application.offerDueDate);
  const offerOverdue = isOverdue(application.offerDueDate);
  const salaryRange = formatSalaryRange(
    application.salaryMin,
    application.salaryMax
  );

  const handleUpdate = async (data: UpdateApplicationInput) => {
    await onUpdate(data);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Edit Application
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <ApplicationForm
            application={application}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            isLoading={isLoading}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
              {application.companyName}
            </h2>
            <Badge status={application.status} />
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {application.positionTitle}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Close"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Offer Due Date Warning */}
        {application.status === "given offer" && application.offerDueDate && (
          <Card
            className={cn(
              "border-2",
              offerOverdue
                ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                : daysUntil !== null && daysUntil <= 3
                ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                : "border-green-500 bg-green-50 dark:bg-green-900/20"
            )}
          >
            <CardContent className="py-3">
              <div className="flex items-center gap-2">
                <svg
                  className={cn(
                    "w-5 h-5",
                    offerOverdue
                      ? "text-red-500"
                      : daysUntil !== null && daysUntil <= 3
                      ? "text-yellow-500"
                      : "text-green-500"
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span
                  className={cn(
                    "font-medium",
                    offerOverdue
                      ? "text-red-700 dark:text-red-300"
                      : daysUntil !== null && daysUntil <= 3
                      ? "text-yellow-700 dark:text-yellow-300"
                      : "text-green-700 dark:text-green-300"
                  )}
                >
                  {offerOverdue
                    ? "Offer response overdue!"
                    : daysUntil === 0
                    ? "Offer response due today"
                    : `${daysUntil} days left to respond`}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-auto text-sm">
                  Due: {formatDate(application.offerDueDate)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">
              Date Applied
            </span>
            <p className="font-medium text-gray-900 dark:text-white">
              {formatDate(application.dateApplied)}
            </p>
          </div>

          {categoryLabel && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Category</span>
              <p className="font-medium text-gray-900 dark:text-white">
                {categoryLabel}
              </p>
            </div>
          )}

          {sourceLabel && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">
                Job Source
              </span>
              <p className="font-medium text-gray-900 dark:text-white">
                {sourceLabel}
              </p>
            </div>
          )}

          {application.skillsMatch && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">
                Skills Match
              </span>
              <div className="mt-1">
                <RatingDisplay value={application.skillsMatch} showNumeric />
              </div>
            </div>
          )}

          {salaryRange && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">
                Salary Range
              </span>
              <p className="font-medium text-gray-900 dark:text-white">
                {salaryRange}
              </p>
            </div>
          )}

          {application.coverLetterRequired !== null && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">
                Cover Letter
              </span>
              <p className="font-medium text-gray-900 dark:text-white">
                {application.coverLetterRequired ? "Required" : "Not required"}
              </p>
            </div>
          )}
        </div>

        {/* Links */}
        {(application.companyUrl ||
          application.jobPostingUrl ||
          application.companyCareerUrl) && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Links
            </h3>
            <div className="flex flex-wrap gap-2">
              {application.companyUrl && (
                <a
                  href={application.companyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 text-sm text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/40"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"
                    />
                  </svg>
                  Website
                </a>
              )}
              {application.jobPostingUrl && (
                <a
                  href={application.jobPostingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 text-sm text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/40"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Job Posting
                </a>
              )}
              {application.companyCareerUrl && (
                <a
                  href={application.companyCareerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 text-sm text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/40"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Careers
                </a>
              )}
            </div>
          </div>
        )}

        {/* Special Requirements */}
        {application.specialRequirements && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Special Requirements
            </h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {application.specialRequirements}
            </p>
          </div>
        )}

        {/* Interview Stages */}
        {application.status === "interviewing" && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Interview Stages
            </h3>
            <InterviewStageList
              stages={application.interviewStages}
              onAdd={onAddStage}
              onUpdate={onUpdateStage}
              onRemove={onDeleteStage}
            />
          </div>
        )}

        {/* Notes */}
        {application.notes && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Notes
            </h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {application.notes}
            </p>
          </div>
        )}

        {/* Timestamps */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
          <p>Created: {formatDate(application.createdAt.split("T")[0])}</p>
          <p>Last updated: {formatDate(application.updatedAt.split("T")[0])}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={application.isArchived ? onRestore : onArchive}
            disabled={isLoading}
          >
            {application.isArchived ? "Restore" : "Archive"}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isLoading}
          >
            Delete
          </Button>
        </div>
        <Button onClick={() => setIsEditing(true)} disabled={isLoading}>
          Edit
        </Button>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          setShowDeleteConfirm(false);
          await onDelete();
        }}
        title="Delete Application"
        message={`Are you sure you want to delete the application for ${application.positionTitle} at ${application.companyName}? This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive
        isLoading={isLoading}
      />
    </div>
  );
}
