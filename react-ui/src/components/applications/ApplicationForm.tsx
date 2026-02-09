import { useState, useEffect } from "react";
import type {
  Application,
  CreateApplicationInput,
  UpdateApplicationInput,
  ApplicationStatus,
  CompanyCategory,
  JobSource,
} from "../../types/application";
import { Button, Input, TextArea, Select, RatingInput, Checkbox } from "../ui";
import {
  APPLICATION_STATUSES,
  COMPANY_CATEGORIES,
  JOB_SOURCES,
} from "../../lib/constants";
import { getTodayDate } from "../../lib/utils";

interface ApplicationFormProps {
  application?: Application | null;
  onSubmit: (data: CreateApplicationInput | UpdateApplicationInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormData {
  companyName: string;
  positionTitle: string;
  dateApplied: string;
  status: ApplicationStatus;
  companyUrl: string;
  jobPostingUrl: string;
  companyCareerUrl: string;
  companyCategory: string;
  skillsMatch: number | null;
  jobSource: string;
  coverLetterRequired: boolean;
  specialRequirements: string;
  salaryMin: string;
  salaryMax: string;
  notes: string;
  offerDueDate: string;
}

interface FormErrors {
  [key: string]: string;
}

export function ApplicationForm({
  application,
  onSubmit,
  onCancel,
  isLoading = false,
}: ApplicationFormProps) {
  const isEdit = !!application;

  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    positionTitle: "",
    dateApplied: getTodayDate(),
    status: "applied",
    companyUrl: "",
    jobPostingUrl: "",
    companyCareerUrl: "",
    companyCategory: "",
    skillsMatch: null,
    jobSource: "",
    coverLetterRequired: false,
    specialRequirements: "",
    salaryMin: "",
    salaryMax: "",
    notes: "",
    offerDueDate: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (application) {
      setFormData({
        companyName: application.companyName,
        positionTitle: application.positionTitle,
        dateApplied: application.dateApplied,
        status: application.status,
        companyUrl: application.companyUrl || "",
        jobPostingUrl: application.jobPostingUrl || "",
        companyCareerUrl: application.companyCareerUrl || "",
        companyCategory: application.companyCategory || "",
        skillsMatch: application.skillsMatch,
        jobSource: application.jobSource || "",
        coverLetterRequired: application.coverLetterRequired || false,
        specialRequirements: application.specialRequirements || "",
        salaryMin: application.salaryMin?.toString() || "",
        salaryMax: application.salaryMax?.toString() || "",
        notes: application.notes || "",
        offerDueDate: application.offerDueDate || "",
      });
    }
  }, [application]);

  const handleChange = (
    field: keyof FormData,
    value: string | number | boolean | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    // Clear error when field changes
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateUrl = (url: string): boolean => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    } else if (formData.companyName.length > 200) {
      newErrors.companyName = "Company name must not exceed 200 characters";
    }

    if (!formData.positionTitle.trim()) {
      newErrors.positionTitle = "Position title is required";
    } else if (formData.positionTitle.length > 200) {
      newErrors.positionTitle = "Position title must not exceed 200 characters";
    }

    if (formData.companyUrl && !validateUrl(formData.companyUrl)) {
      newErrors.companyUrl = "Invalid URL format";
    }

    if (formData.jobPostingUrl && !validateUrl(formData.jobPostingUrl)) {
      newErrors.jobPostingUrl = "Invalid URL format";
    }

    if (formData.companyCareerUrl && !validateUrl(formData.companyCareerUrl)) {
      newErrors.companyCareerUrl = "Invalid URL format";
    }

    if (formData.salaryMin && formData.salaryMax) {
      const min = parseInt(formData.salaryMin);
      const max = parseInt(formData.salaryMax);
      if (min > max) {
        newErrors.salaryMax = "Maximum salary must be greater than minimum";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const data: CreateApplicationInput | UpdateApplicationInput = {
      companyName: formData.companyName.trim(),
      positionTitle: formData.positionTitle.trim(),
      dateApplied: formData.dateApplied || undefined,
      companyUrl: formData.companyUrl || undefined,
      jobPostingUrl: formData.jobPostingUrl || undefined,
      companyCareerUrl: formData.companyCareerUrl || undefined,
      companyCategory: (formData.companyCategory as CompanyCategory) || undefined,
      skillsMatch: formData.skillsMatch || undefined,
      jobSource: (formData.jobSource as JobSource) || undefined,
      coverLetterRequired: formData.coverLetterRequired || undefined,
      specialRequirements: formData.specialRequirements || undefined,
      salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
      salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : undefined,
      notes: formData.notes || undefined,
    };

    if (isEdit) {
      (data as UpdateApplicationInput).status = formData.status;
      (data as UpdateApplicationInput).offerDueDate =
        formData.offerDueDate || null;
    }

    await onSubmit(data);
  };

  const handleCancel = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to cancel?"
      );
      if (!confirmed) return;
    }
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Company Name"
            value={formData.companyName}
            onChange={(e) => handleChange("companyName", e.target.value)}
            error={errors.companyName}
            required
          />

          <Input
            label="Position Title"
            value={formData.positionTitle}
            onChange={(e) => handleChange("positionTitle", e.target.value)}
            error={errors.positionTitle}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Date Applied"
            type="date"
            value={formData.dateApplied}
            onChange={(e) => handleChange("dateApplied", e.target.value)}
          />

          {isEdit && (
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) =>
                handleChange("status", e.target.value as ApplicationStatus)
              }
              options={APPLICATION_STATUSES}
            />
          )}
        </div>

        {isEdit && formData.status === "given offer" && (
          <Input
            label="Offer Due Date"
            type="date"
            value={formData.offerDueDate}
            onChange={(e) => handleChange("offerDueDate", e.target.value)}
          />
        )}
      </div>

      {/* Company Details */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Company Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Company Category"
            value={formData.companyCategory}
            onChange={(e) => handleChange("companyCategory", e.target.value)}
            options={COMPANY_CATEGORIES}
            placeholder="Select category..."
          />

          <Select
            label="Job Source"
            value={formData.jobSource}
            onChange={(e) => handleChange("jobSource", e.target.value)}
            options={JOB_SOURCES}
            placeholder="Select source..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Company Website"
            type="url"
            value={formData.companyUrl}
            onChange={(e) => handleChange("companyUrl", e.target.value)}
            error={errors.companyUrl}
            placeholder="https://..."
          />

          <Input
            label="Job Posting URL"
            type="url"
            value={formData.jobPostingUrl}
            onChange={(e) => handleChange("jobPostingUrl", e.target.value)}
            error={errors.jobPostingUrl}
            placeholder="https://..."
          />

          <Input
            label="Careers Page URL"
            type="url"
            value={formData.companyCareerUrl}
            onChange={(e) => handleChange("companyCareerUrl", e.target.value)}
            error={errors.companyCareerUrl}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Assessment */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Assessment
        </h3>

        <div className="flex flex-wrap items-center gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Skills Match
            </label>
            <RatingInput
              value={formData.skillsMatch}
              onChange={(value) => handleChange("skillsMatch", value)}
            />
          </div>

          <Checkbox
            label="Cover Letter Required"
            checked={formData.coverLetterRequired}
            onChange={(e) =>
              handleChange("coverLetterRequired", e.target.checked)
            }
          />
        </div>

        <TextArea
          label="Special Requirements"
          value={formData.specialRequirements}
          onChange={(e) => handleChange("specialRequirements", e.target.value)}
          rows={2}
          placeholder="Any special requirements or qualifications..."
        />
      </div>

      {/* Compensation */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Compensation
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Minimum Salary"
            type="number"
            value={formData.salaryMin}
            onChange={(e) => handleChange("salaryMin", e.target.value)}
            placeholder="e.g., 80000"
          />

          <Input
            label="Maximum Salary"
            type="number"
            value={formData.salaryMax}
            onChange={(e) => handleChange("salaryMax", e.target.value)}
            error={errors.salaryMax}
            placeholder="e.g., 120000"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Notes
        </h3>

        <TextArea
          label="General Notes"
          value={formData.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          rows={4}
          placeholder="Additional notes about this application..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="secondary"
          onClick={handleCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Saving..."
            : isEdit
            ? "Save Changes"
            : "Add Application"}
        </Button>
      </div>
    </form>
  );
}
