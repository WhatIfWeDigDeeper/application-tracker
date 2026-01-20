'use client';

import { useState } from 'react';
import type {
  JobApplication,
  InterviewStage,
  UpdateApplicationInput,
  UpdateInterviewStageInput,
} from '@/types/application';
import { InterviewChecklist } from '@/components/interviews/InterviewChecklist';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { Select, type SelectOption } from '@/components/ui/Select';
import { formatDate, formatSalaryRange, getDaysRemaining, formatDaysRemaining, cn } from '@/lib/utils';
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  CATEGORY_LABELS,
  SOURCE_LABELS,
  SKILLS_MATCH_LABELS,
} from '@/lib/constants';
import { EditIcon } from '@/assets/icons/EditIcon';
import { CalendarIcon } from '@/assets/icons/CalendarIcon';

export interface ApplicationDetailProps {
  application: JobApplication;
  onUpdate: (id: string, data: UpdateApplicationInput) => void;
  onAddStage: (stage: InterviewStage) => Promise<void>;
  onUpdateStage: (stageId: string, stage: UpdateInterviewStageInput) => Promise<void>;
  onRemoveStage: (stageId: string) => Promise<void>;
  onEdit: () => void;
  onClose: () => void;
}

const statusOptions: SelectOption[] = APPLICATION_STATUSES.map((status) => ({
  value: status,
  label: STATUS_LABELS[status],
}));

function DetailRow({
  label,
  value,
  isLink = false,
}: {
  label: string;
  value: React.ReactNode;
  isLink?: boolean;
}): React.ReactElement | null {
  if (!value) return null;

  return (
    <div className="py-2 flex justify-between items-start gap-4">
      <dt className="text-sm font-medium text-gray-500 dark:text-slate-400 flex-shrink-0">{label}</dt>
      <dd className="text-sm text-gray-900 dark:text-slate-100 text-right">
        {isLink && typeof value === 'string' ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline break-all"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

export function ApplicationDetail({
  application,
  onUpdate,
  onAddStage,
  onUpdateStage,
  onRemoveStage,
  onEdit,
  onClose,
}: ApplicationDetailProps): React.ReactElement {
  const [isStatusChanging, setIsStatusChanging] = useState(false);
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [dueDateValue, setDueDateValue] = useState(application.offerDueDate ?? '');

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const newStatus = e.target.value as JobApplication['status'];
    onUpdate(application.id, { status: newStatus });
    setIsStatusChanging(false);
  };

  const handleDueDateSave = (): void => {
    onUpdate(application.id, { offerDueDate: dueDateValue || undefined });
    setIsEditingDueDate(false);
  };

  const handleDueDateCancel = (): void => {
    setDueDateValue(application.offerDueDate ?? '');
    setIsEditingDueDate(false);
  };

  const salaryRange = formatSalaryRange(application.salaryMin, application.salaryMax);
  const showInterviewSection =
    application.status === 'interviewing' ||
    application.status === 'given offer' ||
    application.status === 'accepted offer' ||
    application.interviewStages.length > 0;

  const isOffered = application.status === 'given offer';
  const daysRemaining = application.offerDueDate ? getDaysRemaining(application.offerDueDate) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-50">{application.positionTitle}</h2>
          <p className="text-lg text-gray-600 dark:text-slate-300">{application.companyName}</p>
        </div>
        <div className="flex items-center gap-2">
          {isStatusChanging ? (
            <Select
              value={application.status}
              onChange={handleStatusChange}
              options={statusOptions}
              className="w-36"
              aria-label="Change application status"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsStatusChanging(true)}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Click to change status"
            >
              <StatusBadge status={application.status} size="md" />
            </button>
          )}
          <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Edit application">
            <EditIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Details Section */}
      <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 sticky top-0 z-10">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-50 mb-3">Application Details</h3>
        <dl className="divide-y divide-gray-200 dark:divide-slate-600">
          <DetailRow label="Date Applied" value={formatDate(application.dateApplied)} />
          <DetailRow
            label="Category"
            value={
              application.companyCategory
                ? CATEGORY_LABELS[application.companyCategory]
                : undefined
            }
          />
          <DetailRow
            label="Source"
            value={application.jobSource ? SOURCE_LABELS[application.jobSource] : undefined}
          />
          <DetailRow
            label="Skills Match"
            value={
              application.skillsMatch
                ? SKILLS_MATCH_LABELS[application.skillsMatch]
                : undefined
            }
          />
          <DetailRow label="Salary Range" value={salaryRange} />
          <DetailRow
            label="Cover Letter"
            value={application.coverLetterRequired ? 'Required' : undefined}
          />
        </dl>
      </div>

      {/* URLs Section */}
      {(application.companyUrl || application.jobPostingUrl || application.companyCareerUrl) && (
        <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-50 mb-3">Links</h3>
          <dl className="divide-y divide-gray-200 dark:divide-slate-600">
            <DetailRow label="Company Website" value={application.companyUrl} isLink />
            <DetailRow label="Job Posting" value={application.jobPostingUrl} isLink />
            <DetailRow label="Career Page" value={application.companyCareerUrl} isLink />
          </dl>
        </div>
      )}

      {/* Notes Section */}
      {(application.specialRequirements || application.notes) && (
        <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-50 mb-3">Notes</h3>
          {application.specialRequirements && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Special Requirements</p>
              <p className="text-sm text-gray-900 dark:text-slate-100 whitespace-pre-wrap">
                {application.specialRequirements}
              </p>
            </div>
          )}
          {application.notes && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">General Notes</p>
              <p className="text-sm text-gray-900 dark:text-slate-100 whitespace-pre-wrap">{application.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Offer Due Date Section */}
      {isOffered && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-amber-600 dark:text-amber-500" />
              <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-300">Offer Decision Deadline</h3>
            </div>
            {!isEditingDueDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingDueDate(true)}
              >
                {application.offerDueDate ? 'Edit' : 'Set Deadline'}
              </Button>
            )}
          </div>

          {isEditingDueDate ? (
            <div className="mt-3 flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label="Due Date"
                  type="date"
                  value={dueDateValue}
                  onChange={(e) => setDueDateValue(e.target.value)}
                />
              </div>
              <Button size="sm" onClick={handleDueDateSave}>
                Save
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDueDateCancel}>
                Cancel
              </Button>
            </div>
          ) : application.offerDueDate ? (
            <div className="mt-2">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <span className="font-medium">Due: </span>
                {formatDate(application.offerDueDate)}
              </p>
              {daysRemaining !== null && (
                <p
                  className={cn(
                    'text-sm font-medium mt-1',
                    daysRemaining < 0
                      ? 'text-red-600 dark:text-red-400'
                      : daysRemaining <= 3
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-green-600 dark:text-green-400'
                  )}
                >
                  {formatDaysRemaining(daysRemaining)}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
              No deadline set. Click &quot;Set Deadline&quot; to add one.
            </p>
          )}
        </div>
      )}

      {/* Interview Progress Section */}
      {showInterviewSection && (
        <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
          <InterviewChecklist
            stages={application.interviewStages}
            onAddStage={onAddStage}
            onUpdateStage={onUpdateStage}
            onRemoveStage={onRemoveStage}
            isEditable={application.status === 'interviewing'}
          />
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-gray-400 border-t pt-4">
        <p>Created: {formatDate(application.createdAt)}</p>
        <p>Last updated: {formatDate(application.updatedAt)}</p>
        {application.isArchived && (
          <p className={cn('mt-1 font-medium text-amber-600')}>This application is archived</p>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onEdit}>Edit Application</Button>
      </div>
    </div>
  );
}
