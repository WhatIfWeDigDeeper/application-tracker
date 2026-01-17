/**
 * Validation service for job application data
 * Implements validation rules from data-model.md
 */

import type {
  CreateApplicationInput,
  UpdateApplicationInput,
  InterviewStageInput,
  ValidationResult,
  ValidationError,
} from '@/types/application';
import { VALIDATION_LIMITS } from '@/lib/constants';
import { isValidUrl } from '@/lib/utils';

/**
 * Validate a job application input (create or update)
 */
export function validateApplication(
  input: CreateApplicationInput | UpdateApplicationInput,
  isCreate = false
): ValidationResult {
  const errors: ValidationError[] = [];

  // Company name validation
  if (isCreate || 'companyName' in input) {
    const companyName = (input as CreateApplicationInput).companyName;
    if (isCreate && (!companyName || !companyName.trim())) {
      errors.push({ field: 'companyName', message: 'Company name is required' });
    } else if (companyName && companyName.length > VALIDATION_LIMITS.companyName.max) {
      errors.push({ field: 'companyName', message: 'Company name is too long' });
    }
  }

  // Position title validation
  if (isCreate || 'positionTitle' in input) {
    const positionTitle = (input as CreateApplicationInput).positionTitle;
    if (isCreate && (!positionTitle || !positionTitle.trim())) {
      errors.push({ field: 'positionTitle', message: 'Position title is required' });
    } else if (positionTitle && positionTitle.length > VALIDATION_LIMITS.positionTitle.max) {
      errors.push({ field: 'positionTitle', message: 'Position title is too long' });
    }
  }

  // URL validations
  if (input.companyUrl && !isValidUrl(input.companyUrl)) {
    errors.push({ field: 'companyUrl', message: 'Invalid company URL format' });
  }

  if (input.jobPostingUrl && !isValidUrl(input.jobPostingUrl)) {
    errors.push({ field: 'jobPostingUrl', message: 'Invalid job posting URL format' });
  }

  if (input.companyCareerUrl && !isValidUrl(input.companyCareerUrl)) {
    errors.push({ field: 'companyCareerUrl', message: 'Invalid company career page URL format' });
  }

  // Skills match validation
  if (input.skillsMatch !== undefined) {
    if (
      input.skillsMatch < VALIDATION_LIMITS.skillsMatch.min ||
      input.skillsMatch > VALIDATION_LIMITS.skillsMatch.max
    ) {
      errors.push({ field: 'skillsMatch', message: 'Skills match must be between 1 and 5' });
    }
  }

  // Salary range validation
  if (input.salaryMin !== undefined && input.salaryMin < 0) {
    errors.push({ field: 'salaryMin', message: 'Minimum salary must be a positive number' });
  }

  if (input.salaryMax !== undefined && input.salaryMax < 0) {
    errors.push({ field: 'salaryMax', message: 'Maximum salary must be a positive number' });
  }

  if (
    input.salaryMin !== undefined &&
    input.salaryMax !== undefined &&
    input.salaryMax < input.salaryMin
  ) {
    errors.push({
      field: 'salaryMax',
      message: 'Maximum salary must be greater than or equal to minimum',
    });
  }

  // Special requirements validation
  if (
    input.specialRequirements &&
    input.specialRequirements.length > VALIDATION_LIMITS.specialRequirements.max
  ) {
    errors.push({ field: 'specialRequirements', message: 'Special requirements text is too long' });
  }

  // Notes validation
  if (input.notes && input.notes.length > VALIDATION_LIMITS.notes.max) {
    errors.push({ field: 'notes', message: 'Notes text is too long' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate an interview stage input
 */
export function validateInterviewStage(input: InterviewStageInput): ValidationResult {
  const errors: ValidationError[] = [];

  // Stage name validation
  if (!input.name || !input.name.trim()) {
    errors.push({ field: 'name', message: 'Stage name is required' });
  } else if (input.name.length > VALIDATION_LIMITS.stageName.max) {
    errors.push({ field: 'name', message: 'Stage name is too long' });
  }

  // Performance rating validation
  if (input.performanceRating !== undefined) {
    if (
      input.performanceRating < VALIDATION_LIMITS.performanceRating.min ||
      input.performanceRating > VALIDATION_LIMITS.performanceRating.max
    ) {
      errors.push({ field: 'performanceRating', message: 'Performance rating must be between 1 and 5' });
    }
  }

  // Notes validation
  if (input.notes && input.notes.length > VALIDATION_LIMITS.stageNotes.max) {
    errors.push({ field: 'notes', message: 'Stage notes text is too long' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get error message for a specific field from validation result
 */
export function getFieldError(result: ValidationResult, field: string): string | undefined {
  const error = result.errors.find((e) => e.field === field);
  return error?.message;
}

/**
 * Check if a specific field has an error
 */
export function hasFieldError(result: ValidationResult, field: string): boolean {
  return result.errors.some((e) => e.field === field);
}
