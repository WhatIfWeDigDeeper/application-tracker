import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TextArea } from '@/components/ui/TextArea';
import { CATEGORY_LABELS, SOURCE_LABELS, STATUS_LABELS, TERMINAL_STATUSES } from '@/lib/constants';
import { getTodayDate } from '@/lib/utils';
import { InterviewStageForm } from '@/components/interviews/InterviewStageForm';
import type {
  Application,
  ApplicationStatus,
  CompanyCategory,
  CreateApplicationInput,
  JobSource,
  UpdateApplicationInput,
} from '@/types/application';

interface ApplicationFormValues {
  companyName: string;
  positionTitle: string;
  dateApplied: string;
  status: ApplicationStatus;
  companyCategory: string;
  jobSource: string;
  companyUrl: string;
  jobPostingUrl: string;
  companyCareerUrl: string;
  skillsMatch: string;
  coverLetterRequired: boolean;
  specialRequirements: string;
  salaryMin: string;
  salaryMax: string;
  notes: string;
  offerDueDate: string;
}

interface ApplicationFormProps {
  initialValues?: Partial<Application>;
  mode: 'create' | 'edit';
  saving?: boolean;
  onSubmit: (payload: CreateApplicationInput | UpdateApplicationInput) => Promise<void>;
  onTransitionToInterviewing?: () => Promise<void>;
  onCancel?: (isDirty: boolean) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onCreateStagesDraftChange?: (stageNames: string[]) => void;
}

function normalizeInitialValues(values?: Partial<Application>): ApplicationFormValues {
  return {
    companyName: values?.companyName ?? '',
    positionTitle: values?.positionTitle ?? '',
    dateApplied: values?.dateApplied ?? '',
    status: values?.status ?? 'unsubmitted',
    companyCategory: values?.companyCategory ?? '',
    jobSource: values?.jobSource ?? '',
    companyUrl: values?.companyUrl ?? '',
    jobPostingUrl: values?.jobPostingUrl ?? '',
    companyCareerUrl: values?.companyCareerUrl ?? '',
    skillsMatch: values?.skillsMatch != null ? String(values.skillsMatch) : '',
    coverLetterRequired: values?.coverLetterRequired ?? false,
    specialRequirements: values?.specialRequirements ?? '',
    salaryMin: values?.salaryMin != null ? String(values.salaryMin) : '',
    salaryMax: values?.salaryMax != null ? String(values.salaryMax) : '',
    notes: values?.notes ?? '',
    offerDueDate: values?.offerDueDate ?? '',
  };
}

function normalizeUrl(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function ApplicationForm({
  initialValues,
  mode,
  saving = false,
  onSubmit,
  onTransitionToInterviewing,
  onCancel,
  onDirtyChange,
  onCreateStagesDraftChange,
}: ApplicationFormProps) {
  const baselineValues = useMemo(() => normalizeInitialValues(initialValues), [initialValues]);
  const [values, setValues] = useState<ApplicationFormValues>(baselineValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stageFormOpen, setStageFormOpen] = useState(false);
  const [draftStages, setDraftStages] = useState<string[]>([]);
  const [hasUserEdits, setHasUserEdits] = useState(false);
  const dirty = JSON.stringify(values) !== JSON.stringify(baselineValues);

  useEffect(() => {
    if (mode !== 'create') {
      return;
    }

    setValues(baselineValues);
    setHasUserEdits(false);
  }, [baselineValues, mode]);

  useEffect(() => {
    if (mode !== 'edit' || hasUserEdits) {
      return;
    }

    setValues(baselineValues);
  }, [baselineValues, hasUserEdits, mode]);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    onCreateStagesDraftChange?.(draftStages);
  }, [draftStages, onCreateStagesDraftChange]);

  const statusIsTerminal = TERMINAL_STATUSES.includes(baselineValues.status);

  const setField = <K extends keyof ApplicationFormValues>(field: K, value: ApplicationFormValues[K]) => {
    setHasUserEdits(true);
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleStatusChange = (nextStatus: ApplicationStatus) => {
    if (statusIsTerminal && nextStatus !== baselineValues.status) {
      return;
    }

    setValues((current) => {
      setHasUserEdits(true);
      const next = { ...current, status: nextStatus };
      if (current.status === 'unsubmitted' && nextStatus !== 'unsubmitted' && !current.dateApplied) {
        next.dateApplied = getTodayDate();
      }
      if (nextStatus === 'unsubmitted') {
        next.dateApplied = '';
      }
      return next;
    });
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!values.companyName.trim()) {
      nextErrors.companyName = 'Company name is required.';
    }
    if (!values.positionTitle.trim()) {
      nextErrors.positionTitle = 'Position title is required.';
    }

    const urlFields: Array<keyof Pick<ApplicationFormValues, 'companyUrl' | 'jobPostingUrl' | 'companyCareerUrl'>> = [
      'companyUrl',
      'jobPostingUrl',
      'companyCareerUrl',
    ];

    for (const field of urlFields) {
      const value = values[field].trim();
      if (value && !/^https?:\/\//.test(value)) {
        nextErrors[field] = 'URL must start with http:// or https://';
      }
    }

    const skillsMatchNum = values.skillsMatch ? Number(values.skillsMatch) : null;
    if (skillsMatchNum !== null && (!Number.isInteger(skillsMatchNum) || skillsMatchNum < 1 || skillsMatchNum > 5)) {
      nextErrors.skillsMatch = 'Skills match must be a whole number between 1 and 5';
    }

    const min = values.salaryMin ? Number(values.salaryMin) : null;
    const max = values.salaryMax ? Number(values.salaryMax) : null;
    if (min !== null && (!Number.isFinite(min) || !Number.isInteger(min) || min < 0)) {
      nextErrors.salaryMin = 'Salary must be a non-negative whole number';
    }
    if (max !== null && (!Number.isFinite(max) || !Number.isInteger(max) || max < 0)) {
      nextErrors.salaryMax = 'Salary must be a non-negative whole number';
    }
    if (min !== null && max !== null && !nextErrors.salaryMin && !nextErrors.salaryMax && min > max) {
      nextErrors.salaryMax = 'Minimum salary must not exceed maximum';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    const payload: CreateApplicationInput = {
      companyName: values.companyName.trim(),
      positionTitle: values.positionTitle.trim(),
      status: values.status,
      dateApplied: values.dateApplied || undefined,
      companyCategory: (values.companyCategory || undefined) as CompanyCategory | undefined,
      jobSource: (values.jobSource || undefined) as JobSource | undefined,
      companyUrl: normalizeUrl(values.companyUrl),
      jobPostingUrl: normalizeUrl(values.jobPostingUrl),
      companyCareerUrl: normalizeUrl(values.companyCareerUrl),
      skillsMatch: values.skillsMatch ? Number(values.skillsMatch) : undefined,
      coverLetterRequired: values.coverLetterRequired,
      specialRequirements: values.specialRequirements.trim() || undefined,
      salaryMin: values.salaryMin ? Number(values.salaryMin) : undefined,
      salaryMax: values.salaryMax ? Number(values.salaryMax) : undefined,
      notes: values.notes.trim() || undefined,
      offerDueDate: values.offerDueDate || undefined,
    };

    const shouldCreateDefaultStages =
      mode === 'edit' &&
      baselineValues.status !== 'interviewing' &&
      values.status === 'interviewing' &&
      (initialValues?.interviewStages?.length ?? 0) === 0;

    await onSubmit(payload);

    if (shouldCreateDefaultStages && onTransitionToInterviewing) {
      await onTransitionToInterviewing();
    }
  };

  return (
    <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
      <section className="grid gap-3 md:grid-cols-2">
        <Input
          label="Company Name"
          id="companyName"
          placeholder="Company Name *"
          required
          value={values.companyName}
          onChange={(event) => setField('companyName', event.target.value)}
          error={errors.companyName}
        />
        <Input
          label="Position Title"
          id="positionTitle"
          placeholder="Position Title *"
          required
          value={values.positionTitle}
          onChange={(event) => setField('positionTitle', event.target.value)}
          error={errors.positionTitle}
        />
        <Input
          label="Date Applied"
          id="dateApplied"
          type="date"
          value={values.dateApplied}
          disabled={values.status === 'unsubmitted'}
          onChange={(event) => setField('dateApplied', event.target.value)}
        />
        <Select
          label="Status"
          id="status"
          value={values.status}
          onChange={(event) => handleStatusChange(event.target.value as ApplicationStatus)}
          disabled={statusIsTerminal}
          options={[
            ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
          ]}
        />
        {values.status === 'given offer' ? (
          <Input
            label="Offer Due Date"
            id="offerDueDate"
            type="date"
            value={values.offerDueDate}
            onChange={(event) => setField('offerDueDate', event.target.value)}
          />
        ) : null}
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <Select
          label="Company Category"
          id="companyCategory"
          value={values.companyCategory}
          onChange={(event) => setField('companyCategory', event.target.value)}
          options={[
            { value: '', label: 'Select category' },
            ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
          ]}
        />
        <Select
          label="Job Source"
          id="jobSource"
          value={values.jobSource}
          onChange={(event) => setField('jobSource', event.target.value)}
          options={[
            { value: '', label: 'Select source' },
            ...Object.entries(SOURCE_LABELS).map(([value, label]) => ({ value, label })),
          ]}
        />
        <Input
          label="Company URL"
          id="companyUrl"
          placeholder="https://example.com"
          value={values.companyUrl}
          onChange={(event) => setField('companyUrl', event.target.value)}
          error={errors.companyUrl}
        />
        <Input
          label="Job Posting URL"
          id="jobPostingUrl"
          placeholder="https://linkedin.com/jobs/..."
          value={values.jobPostingUrl}
          onChange={(event) => setField('jobPostingUrl', event.target.value)}
          error={errors.jobPostingUrl}
        />
        <Input
          label="Career Page URL"
          id="companyCareerUrl"
          placeholder="https://example.com/careers"
          value={values.companyCareerUrl}
          onChange={(event) => setField('companyCareerUrl', event.target.value)}
          error={errors.companyCareerUrl}
        />
        <Input
          label="Skills Match (1-5)"
          type="number"
          min={1}
          max={5}
          step={1}
          value={values.skillsMatch}
          onChange={(event) => setField('skillsMatch', event.target.value)}
          error={errors.skillsMatch}
        />
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <Input
          label="Salary Min"
          id="salaryMin"
          type="number"
          min={0}
          step={1}
          value={values.salaryMin}
          onChange={(event) => setField('salaryMin', event.target.value)}
          error={errors.salaryMin}
        />
        <Input
          label="Salary Max"
          id="salaryMax"
          type="number"
          min={0}
          step={1}
          value={values.salaryMax}
          onChange={(event) => setField('salaryMax', event.target.value)}
          error={errors.salaryMax}
        />
      </section>

      <section className="space-y-3">
        <label className="inline-flex items-center gap-2 text-sm text-[var(--text-primary)]">
          <input
            type="checkbox"
            checked={values.coverLetterRequired}
            onChange={(event) => setField('coverLetterRequired', event.target.checked)}
          />
          Cover letter required
        </label>
        <TextArea
          label="Special Requirements"
          id="specialRequirements"
          fieldName="specialRequirements"
          value={values.specialRequirements}
          onChange={(event) => setField('specialRequirements', event.target.value)}
        />
        <TextArea
          label="Notes"
          id="notes"
          fieldName="notes"
          value={values.notes}
          onChange={(event) => setField('notes', event.target.value)}
        />

        {mode === 'create' ? (
          <div className="space-y-2 rounded-md border border-[var(--border-subtle)] p-3">
            {!stageFormOpen ? (
              <Button type="button" variant="secondary" onClick={() => setStageFormOpen(true)}>
                Add Stage
              </Button>
            ) : null}
            {stageFormOpen ? (
              <InterviewStageForm
                mode="create"
                defaultOrder={draftStages.length}
                onSave={async (payload) => {
                  const stageName = 'name' in payload ? payload.name : undefined;
                  if (stageName) {
                    setDraftStages((current) => [...current, stageName]);
                  }
                  setStageFormOpen(false);
                }}
                onCancel={() => setStageFormOpen(false)}
              />
            ) : null}
            {draftStages.length > 0 ? (
              <ul className="m-0 list-disc pl-5 text-sm text-[var(--text-secondary)]">
                {draftStages.map((name, index) => (
                  <li key={`${name}-${index}`}>{name}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </section>

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" type="button" disabled={saving} onClick={() => onCancel?.(dirty)}>
          {mode === 'edit' ? 'Discard' : 'Cancel'}
        </Button>
        <Button
          data-testid="application-form-save"
          type="button"
          disabled={mode === 'edit' && !dirty}
          loading={saving}
          onClick={() => {
            void handleSubmit();
          }}
        >
          {mode === 'create' ? 'Create Application' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
