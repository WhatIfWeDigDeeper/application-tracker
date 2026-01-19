/**
 * Unit tests for validation service
 */

import {
  validateApplication,
  validateInterviewStage,
  getFieldError,
  hasFieldError,
} from '@/services/validation';
import type { CreateApplicationInput, InterviewStageInput } from '@/types/application';

describe('Validation Service', () => {
  describe('validateApplication', () => {
    describe('required fields (create mode)', () => {
      it('returns error when company name is missing', () => {
        const input = { companyName: '', positionTitle: 'Engineer' } as CreateApplicationInput;

        const result = validateApplication(input, true);

        expect(result.isValid).toBe(false);
        expect(hasFieldError(result, 'companyName')).toBe(true);
        expect(getFieldError(result, 'companyName')).toBe('Company name is required');
      });

      it('returns error when position title is missing', () => {
        const input = { companyName: 'Acme', positionTitle: '' } as CreateApplicationInput;

        const result = validateApplication(input, true);

        expect(result.isValid).toBe(false);
        expect(hasFieldError(result, 'positionTitle')).toBe(true);
      });

      it('returns error when company name is only whitespace', () => {
        const input = { companyName: '   ', positionTitle: 'Engineer' } as CreateApplicationInput;

        const result = validateApplication(input, true);

        expect(result.isValid).toBe(false);
        expect(hasFieldError(result, 'companyName')).toBe(true);
      });

      it('passes with valid required fields', () => {
        const input: CreateApplicationInput = {
          companyName: 'Acme Corp',
          positionTitle: 'Software Engineer',
        };

        const result = validateApplication(input, true);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('company name length', () => {
      it('returns error when company name exceeds max length', () => {
        const input: CreateApplicationInput = {
          companyName: 'A'.repeat(201),
          positionTitle: 'Engineer',
        };

        const result = validateApplication(input, true);

        expect(result.isValid).toBe(false);
        expect(getFieldError(result, 'companyName')).toBe('Company name is too long');
      });
    });

    describe('URL validation', () => {
      it('returns error for invalid company URL', () => {
        const input: CreateApplicationInput = {
          companyName: 'Acme',
          positionTitle: 'Engineer',
          companyUrl: 'not-a-valid-url',
        };

        const result = validateApplication(input, true);

        expect(result.isValid).toBe(false);
        expect(getFieldError(result, 'companyUrl')).toBe('Invalid company URL format');
      });

      it('returns error for invalid job posting URL', () => {
        const input: CreateApplicationInput = {
          companyName: 'Acme',
          positionTitle: 'Engineer',
          jobPostingUrl: 'ftp://invalid',
        };

        const result = validateApplication(input, true);

        expect(result.isValid).toBe(false);
        expect(hasFieldError(result, 'jobPostingUrl')).toBe(true);
      });

      it('passes with valid URLs', () => {
        const input: CreateApplicationInput = {
          companyName: 'Acme',
          positionTitle: 'Engineer',
          companyUrl: 'https://acme.com',
          jobPostingUrl: 'https://linkedin.com/jobs/123',
          companyCareerUrl: 'https://acme.com/careers',
        };

        const result = validateApplication(input, true);

        expect(result.isValid).toBe(true);
      });

      it('allows empty URLs', () => {
        const input: CreateApplicationInput = {
          companyName: 'Acme',
          positionTitle: 'Engineer',
          companyUrl: '',
        };

        const result = validateApplication(input, true);

        expect(result.isValid).toBe(true);
      });
    });

    describe('skills match validation', () => {
      it('returns error when skills match is below minimum', () => {
        const input: CreateApplicationInput = {
          companyName: 'Acme',
          positionTitle: 'Engineer',
          skillsMatch: 0,
        };

        const result = validateApplication(input, true);

        expect(result.isValid).toBe(false);
        expect(getFieldError(result, 'skillsMatch')).toBe('Skills match must be between 1 and 5');
      });

      it('returns error when skills match is above maximum', () => {
        const input: CreateApplicationInput = {
          companyName: 'Acme',
          positionTitle: 'Engineer',
          skillsMatch: 6,
        };

        const result = validateApplication(input, true);

        expect(result.isValid).toBe(false);
      });

      it('passes with valid skills match', () => {
        const input: CreateApplicationInput = {
          companyName: 'Acme',
          positionTitle: 'Engineer',
          skillsMatch: 3,
        };

        const result = validateApplication(input, true);

        expect(result.isValid).toBe(true);
      });
    });

    describe('salary validation', () => {
      it('returns error when salary min is negative', () => {
        const input: CreateApplicationInput = {
          companyName: 'Acme',
          positionTitle: 'Engineer',
          salaryMin: -1000,
        };

        const result = validateApplication(input, true);

        expect(result.isValid).toBe(false);
        expect(getFieldError(result, 'salaryMin')).toBe('Minimum salary must be a positive number');
      });

      it('returns error when salary max is less than min', () => {
        const input: CreateApplicationInput = {
          companyName: 'Acme',
          positionTitle: 'Engineer',
          salaryMin: 100000,
          salaryMax: 50000,
        };

        const result = validateApplication(input, true);

        expect(result.isValid).toBe(false);
        expect(getFieldError(result, 'salaryMax')).toBe(
          'Maximum salary must be greater than or equal to minimum'
        );
      });

      it('passes with valid salary range', () => {
        const input: CreateApplicationInput = {
          companyName: 'Acme',
          positionTitle: 'Engineer',
          salaryMin: 100000,
          salaryMax: 150000,
        };

        const result = validateApplication(input, true);

        expect(result.isValid).toBe(true);
      });
    });

    describe('text length validation', () => {
      it('returns error when special requirements exceed max length', () => {
        const input: CreateApplicationInput = {
          companyName: 'Acme',
          positionTitle: 'Engineer',
          specialRequirements: 'A'.repeat(1001),
        };

        const result = validateApplication(input, true);

        expect(result.isValid).toBe(false);
        expect(getFieldError(result, 'specialRequirements')).toBe(
          'Special requirements text is too long'
        );
      });

      it('returns error when notes exceed max length', () => {
        const input: CreateApplicationInput = {
          companyName: 'Acme',
          positionTitle: 'Engineer',
          notes: 'A'.repeat(5001),
        };

        const result = validateApplication(input, true);

        expect(result.isValid).toBe(false);
        expect(getFieldError(result, 'notes')).toBe('Notes text is too long');
      });
    });
  });

  describe('validateInterviewStage', () => {
    it('returns error when stage name is missing', () => {
      const input: InterviewStageInput = { name: '' };

      const result = validateInterviewStage(input);

      expect(result.isValid).toBe(false);
      expect(getFieldError(result, 'name')).toBe('Stage name is required');
    });

    it('returns error when stage name exceeds max length', () => {
      const input: InterviewStageInput = { name: 'A'.repeat(101) };

      const result = validateInterviewStage(input);

      expect(result.isValid).toBe(false);
      expect(getFieldError(result, 'name')).toBe('Stage name is too long');
    });

    it('returns error when performance rating is out of range', () => {
      const input: InterviewStageInput = { name: 'Stage 1', performanceRating: 6 };

      const result = validateInterviewStage(input);

      expect(result.isValid).toBe(false);
      expect(getFieldError(result, 'performanceRating')).toBe(
        'Performance rating must be between 1 and 5'
      );
    });

    it('returns error when notes exceed max length', () => {
      const input: InterviewStageInput = { name: 'Stage 1', notes: 'A'.repeat(2001) };

      const result = validateInterviewStage(input);

      expect(result.isValid).toBe(false);
      expect(getFieldError(result, 'notes')).toBe('Stage notes text is too long');
    });

    it('passes with valid stage input', () => {
      const input: InterviewStageInput = {
        name: 'Technical Interview',
        isCompleted: true,
        completedDate: '2026-01-16',
        notes: 'Went well',
        performanceRating: 4,
      };

      const result = validateInterviewStage(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('utility functions', () => {
    it('getFieldError returns undefined for non-existent field', () => {
      const result = validateApplication(
        { companyName: 'Acme', positionTitle: 'Engineer' },
        true
      );

      expect(getFieldError(result, 'nonExistent')).toBeUndefined();
    });

    it('hasFieldError returns false for non-existent field', () => {
      const result = validateApplication(
        { companyName: 'Acme', positionTitle: 'Engineer' },
        true
      );

      expect(hasFieldError(result, 'nonExistent')).toBe(false);
    });
  });
});
