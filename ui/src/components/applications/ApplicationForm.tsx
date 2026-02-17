'use client';

import { useState, type FormEvent, type ChangeEvent } from 'react';
import type { CreateApplicationInput, UpdateApplicationInput, ApplicationStatus } from '@/types/application';
import { getCurrentDateISO } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { validateApplication } from '@/services/validation';
import {
  COMPANY_CATEGORIES,
  CATEGORY_LABELS,
  JOB_SOURCES,
  SOURCE_LABELS,
  SKILLS_MATCH_LABELS,
  APPLICATION_STATUSES,
  STATUS_LABELS,
} from '@/lib/constants';

export interface ApplicationFormProps {
  initialData?: Partial<CreateApplicationInput & { status?: string; offerDueDate?: string }>;
  onSubmit: (data: CreateApplicationInput | UpdateApplicationInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

const categoryOptions: SelectOption[] = [
  { value: '', label: 'Select a category' },
  ...COMPANY_CATEGORIES.map((cat) => ({
    value: cat,
    label: CATEGORY_LABELS[cat],
  })),
];

const sourceOptions: SelectOption[] = [
  { value: '', label: 'Select a source' },
  ...JOB_SOURCES.map((source) => ({
    value: source,
    label: SOURCE_LABELS[source],
  })),
];

const skillsMatchOptions: SelectOption[] = [
  { value: '', label: 'Rate skills match' },
  ...Object.entries(SKILLS_MATCH_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

const statusOptions: SelectOption[] = APPLICATION_STATUSES.map((status) => ({
  value: status,
  label: STATUS_LABELS[status],
}));

export function ApplicationForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create',
}: ApplicationFormProps): React.ReactElement {
  const [formData, setFormData] = useState<CreateApplicationInput & { status?: string; offerDueDate?: string }>({
    companyName: initialData?.companyName ?? '',
    positionTitle: initialData?.positionTitle ?? '',
    dateApplied: initialData?.dateApplied ?? '',
    companyUrl: initialData?.companyUrl ?? '',
    jobPostingUrl: initialData?.jobPostingUrl ?? '',
    companyCareerUrl: initialData?.companyCareerUrl ?? '',
    companyCategory: initialData?.companyCategory,
    skillsMatch: initialData?.skillsMatch,
    jobSource: initialData?.jobSource,
    coverLetterRequired: initialData?.coverLetterRequired ?? false,
    specialRequirements: initialData?.specialRequirements ?? '',
    salaryMin: initialData?.salaryMin,
    salaryMax: initialData?.salaryMax,
    notes: initialData?.notes ?? '',
    status: initialData?.status,
    offerDueDate: initialData?.offerDueDate,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void => {
    const { name, value, type } = e.target;

    let parsedValue: string | number | boolean | undefined = value;

    if (type === 'checkbox') {
      parsedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      parsedValue = value === '' ? undefined : Number(value);
    } else if (name === 'skillsMatch') {
      parsedValue = value === '' ? undefined : Number(value);
    }

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: parsedValue,
      };

      // Handle status change: sync dateApplied with unsubmitted status
      if (name === 'status') {
        if (value === 'unsubmitted') {
          updated.dateApplied = '';
        } else if (prev.status === 'unsubmitted' && !prev.dateApplied) {
          // Transitioning FROM unsubmitted: auto-fill today's date
          updated.dateApplied = getCurrentDateISO();
        }
      }

      return updated;
    });

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();

    const validation = validateApplication(formData, mode === 'create');

    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach((err) => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);
      return;
    }

    // Clean up empty optional fields
    const baseData: CreateApplicationInput = {
      companyName: formData.companyName,
      positionTitle: formData.positionTitle,
      dateApplied: formData.dateApplied || null,
      companyUrl: formData.companyUrl || undefined,
      jobPostingUrl: formData.jobPostingUrl || undefined,
      companyCareerUrl: formData.companyCareerUrl || undefined,
      companyCategory: formData.companyCategory || undefined,
      skillsMatch: formData.skillsMatch || undefined,
      jobSource: formData.jobSource || undefined,
      coverLetterRequired: formData.coverLetterRequired || undefined,
      specialRequirements: formData.specialRequirements || undefined,
      salaryMin: formData.salaryMin || undefined,
      salaryMax: formData.salaryMax || undefined,
      notes: formData.notes || undefined,
    };

    // For edit mode, include status and offerDueDate if provided
    if (mode === 'edit') {
      const cleanData: UpdateApplicationInput = {
        ...baseData,
        status: formData.status ? (formData.status as ApplicationStatus) : undefined,
        offerDueDate: formData.offerDueDate || undefined,
      };
      onSubmit(cleanData);
    } else {
      onSubmit(baseData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Required Fields */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-slate-50 border-b dark:border-slate-700 pb-2">
          Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Company Name"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            error={errors.companyName}
            required
            placeholder="e.g., Acme Corp"
          />

          <Input
            label="Position Title"
            name="positionTitle"
            value={formData.positionTitle}
            onChange={handleChange}
            error={errors.positionTitle}
            required
            placeholder="e.g., Software Engineer"
          />
        </div>

        {mode === 'edit' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Status"
              name="status"
              value={formData.status ?? ''}
              onChange={handleChange}
              options={statusOptions}
              error={errors.status}
            />

            <Input
              label="Date Applied"
              name="dateApplied"
              type="date"
              value={formData.dateApplied ?? ''}
              onChange={handleChange}
              error={errors.dateApplied}
              disabled={formData.status === 'unsubmitted'}
            />
          </div>
        )}

        {mode === 'create' && (
          <Input
            label="Date Applied"
            name="dateApplied"
            type="date"
            value={formData.dateApplied ?? ''}
            onChange={handleChange}
            error={errors.dateApplied}
            disabled={formData.status === 'unsubmitted'}
          />
        )}

        {mode === 'edit' && formData.status === 'given offer' && (
          <Input
            label="Offer Due Date"
            name="offerDueDate"
            type="date"
            value={formData.offerDueDate ?? ''}
            onChange={handleChange}
            error={errors.offerDueDate}
            placeholder="When is the decision deadline?"
          />
        )}
      </div>

      {/* URLs */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-slate-50 border-b dark:border-slate-700 pb-2">URLs</h3>

        <Input
          label="Company Website"
          name="companyUrl"
          type="url"
          value={formData.companyUrl}
          onChange={handleChange}
          error={errors.companyUrl}
          placeholder="https://company.com"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Job Posting URL"
            name="jobPostingUrl"
            type="url"
            value={formData.jobPostingUrl}
            onChange={handleChange}
            error={errors.jobPostingUrl}
            placeholder="https://linkedin.com/jobs/..."
          />

          <Input
            label="Company Career Page"
            name="companyCareerUrl"
            type="url"
            value={formData.companyCareerUrl}
            onChange={handleChange}
            error={errors.companyCareerUrl}
            placeholder="https://company.com/careers"
          />
        </div>
      </div>

      {/* Classification */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-slate-50 border-b dark:border-slate-700 pb-2">
          Classification
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Company Category"
            name="companyCategory"
            value={formData.companyCategory ?? ''}
            onChange={handleChange}
            options={categoryOptions}
            error={errors.companyCategory}
          />

          <Select
            label="Job Source"
            name="jobSource"
            value={formData.jobSource ?? ''}
            onChange={handleChange}
            options={sourceOptions}
            error={errors.jobSource}
          />

          <Select
            label="Skills Match"
            name="skillsMatch"
            value={formData.skillsMatch?.toString() ?? ''}
            onChange={handleChange}
            options={skillsMatchOptions}
            error={errors.skillsMatch}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="coverLetterRequired"
            name="coverLetterRequired"
            checked={formData.coverLetterRequired ?? false}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="coverLetterRequired" className="text-sm text-gray-700 dark:text-slate-200">
            Cover letter required
          </label>
        </div>
      </div>

      {/* Salary */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-slate-50 border-b dark:border-slate-700 pb-2">
          Compensation (Optional)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Maximum Salary"
            name="salaryMax"
            type="number"
            value={formData.salaryMax ?? ''}
            onChange={handleChange}
            error={errors.salaryMax}
            placeholder="e.g., 150000"
            min={0}
          />

          <Input
            label="Minimum Salary"
            name="salaryMin"
            type="number"
            value={formData.salaryMin ?? ''}
            onChange={handleChange}
            error={errors.salaryMin}
            placeholder="e.g., 100000"
            min={0}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-slate-50 border-b dark:border-slate-700 pb-2">Notes</h3>

        <div>
          <label htmlFor="specialRequirements" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
            Special Requirements
          </label>
          <textarea
            id="specialRequirements"
            name="specialRequirements"
            rows={2}
            value={formData.specialRequirements}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:focus:border-blue-400 dark:focus:ring-blue-400 px-3 py-2 text-gray-900 bg-white dark:text-slate-100 dark:bg-slate-800 placeholder:text-gray-400 dark:placeholder:text-slate-500"
            placeholder="e.g., Portfolio required, code samples needed..."
          />
          {errors.specialRequirements && (
            <p className="mt-1 text-sm text-red-600">{errors.specialRequirements}</p>
          )}
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
            General Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:focus:border-blue-400 dark:focus:ring-blue-400 px-3 py-2 text-gray-900 bg-white dark:text-slate-100 dark:bg-slate-800 placeholder:text-gray-400 dark:placeholder:text-slate-500"
            placeholder="Any additional notes about this application..."
          />
          {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes}</p>}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {mode === 'create' ? 'Add Application' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
