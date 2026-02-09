import type { Application, FieldChange } from '@/types';
import { APPLICATION_STATUSES } from '@/types';

const FIELD_LABELS: Record<string, string> = {
  companyName: 'Company Name',
  positionTitle: 'Position Title',
  dateApplied: 'Date Applied',
  status: 'Status',
  companyUrl: 'Company URL',
  jobPostingUrl: 'Job Posting URL',
  companyCareerUrl: 'Career Page URL',
  companyCategory: 'Company Category',
  skillsMatch: 'Skills Match',
  jobSource: 'Job Source',
  coverLetterRequired: 'Cover Letter Required',
  specialRequirements: 'Special Requirements',
  salaryMin: 'Minimum Salary',
  salaryMax: 'Maximum Salary',
  notes: 'Notes',
  offerDueDate: 'Offer Due Date',
  isArchived: 'Archived',
};

export { FIELD_LABELS };

export function generateFieldChanges(
  oldState: Application,
  newState: Application,
  changedKeys: string[]
): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const key of changedKeys) {
    const oldVal = (oldState as unknown as Record<string, unknown>)[key];
    const newVal = (newState as unknown as Record<string, unknown>)[key];
    if (oldVal !== newVal) {
      changes.push({
        field: key,
        label: FIELD_LABELS[key] || key,
        oldValue: oldVal,
        newValue: newVal,
      });
    }
  }
  return changes;
}

export function generateDescription(
  action: string,
  application: Application,
  input?: Record<string, unknown>,
  stageName?: string
): string {
  const appLabel = `${application.companyName} - ${application.positionTitle}`;
  switch (action) {
    case 'create':
      return `Created application "${appLabel}"`;
    case 'update': {
      const keys = input ? Object.keys(input) : [];
      if (keys.length === 1 && keys[0] === 'status') {
        const statusLabel =
          APPLICATION_STATUSES.find((s) => s.value === input!.status)?.label || input!.status;
        return `Changed status to "${statusLabel}"`;
      }
      if (keys.length === 1) return `Updated ${FIELD_LABELS[keys[0]] || keys[0]}`;
      return `Updated ${keys.length} fields`;
    }
    case 'delete':
      return `Deleted application "${appLabel}"`;
    case 'archive':
      return `Archived application "${appLabel}"`;
    case 'restore':
      return `Restored application "${appLabel}"`;
    case 'addStage':
      return `Added interview stage "${stageName}"`;
    case 'updateStage':
      return `Updated interview stage "${stageName}"`;
    case 'deleteStage':
      return `Removed interview stage "${stageName}"`;
    case 'toggleStage':
      return `Toggled completion for "${stageName}"`;
    default:
      return 'Modified application';
  }
}
