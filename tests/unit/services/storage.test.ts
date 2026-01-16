/**
 * Unit tests for storage service
 */

import {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
  archiveApplicationById,
  restoreApplication,
  addInterviewStage,
  updateInterviewStage,
  removeInterviewStage,
  reorderInterviewStages,
  clearAllData,
  exportData,
  importData,
} from '@/services/storage';
import type { CreateApplicationInput, StorageSchema } from '@/types/application';
import { STORAGE_KEY } from '@/lib/constants';

describe('Storage Service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('createApplication', () => {
    it('creates a new application with required fields', () => {
      const input: CreateApplicationInput = {
        companyName: 'Acme Corp',
        positionTitle: 'Software Engineer',
      };

      const result = createApplication(input);

      expect(result.id).toBeDefined();
      expect(result.companyName).toBe('Acme Corp');
      expect(result.positionTitle).toBe('Software Engineer');
      expect(result.status).toBe('applied');
      expect(result.isArchived).toBe(false);
      expect(result.interviewStages).toEqual([]);
    });

    it('creates application with all optional fields', () => {
      const input: CreateApplicationInput = {
        companyName: 'Tech Inc',
        positionTitle: 'Senior Developer',
        dateApplied: '2026-01-15',
        companyUrl: 'https://tech.com',
        jobPostingUrl: 'https://linkedin.com/jobs/123',
        companyCareerUrl: 'https://tech.com/careers',
        companyCategory: 'ai',
        skillsMatch: 4,
        jobSource: 'linkedin',
        coverLetterRequired: true,
        specialRequirements: 'Portfolio required',
        salaryMin: 100000,
        salaryMax: 150000,
        notes: 'Great opportunity',
      };

      const result = createApplication(input);

      expect(result.companyUrl).toBe('https://tech.com');
      expect(result.companyCategory).toBe('ai');
      expect(result.skillsMatch).toBe(4);
      expect(result.jobSource).toBe('linkedin');
      expect(result.salaryMin).toBe(100000);
      expect(result.salaryMax).toBe(150000);
    });

    it('trims whitespace from string fields', () => {
      const input: CreateApplicationInput = {
        companyName: '  Acme Corp  ',
        positionTitle: '  Engineer  ',
      };

      const result = createApplication(input);

      expect(result.companyName).toBe('Acme Corp');
      expect(result.positionTitle).toBe('Engineer');
    });
  });

  describe('getApplications', () => {
    it('returns empty array when no applications exist', () => {
      const result = getApplications();
      expect(result).toEqual([]);
    });

    it('returns all non-archived applications by default', () => {
      createApplication({ companyName: 'A', positionTitle: 'P1' });
      createApplication({ companyName: 'B', positionTitle: 'P2' });

      const result = getApplications();

      expect(result).toHaveLength(2);
    });

    it('filters by status', () => {
      const app1 = createApplication({ companyName: 'A', positionTitle: 'P1' });
      createApplication({ companyName: 'B', positionTitle: 'P2' });
      updateApplication(app1.id, { status: 'interviewing' });

      const result = getApplications({ status: ['interviewing'] });

      expect(result).toHaveLength(1);
      expect(result[0]?.companyName).toBe('A');
    });

    it('excludes archived applications by default', () => {
      const app = createApplication({ companyName: 'A', positionTitle: 'P1' });
      archiveApplicationById(app.id);

      const result = getApplications();

      expect(result).toHaveLength(0);
    });

    it('includes archived applications when requested', () => {
      const app = createApplication({ companyName: 'A', positionTitle: 'P1' });
      archiveApplicationById(app.id);

      const result = getApplications({ includeArchived: true });

      expect(result).toHaveLength(1);
    });

    it('sorts by date applied descending by default', () => {
      createApplication({ companyName: 'B', positionTitle: 'P', dateApplied: '2026-01-10' });
      createApplication({ companyName: 'A', positionTitle: 'P', dateApplied: '2026-01-15' });

      const result = getApplications();

      expect(result[0]?.companyName).toBe('A');
      expect(result[1]?.companyName).toBe('B');
    });

    it('sorts by company name', () => {
      createApplication({ companyName: 'Zebra', positionTitle: 'P' });
      createApplication({ companyName: 'Alpha', positionTitle: 'P' });

      const result = getApplications(undefined, { field: 'companyName', direction: 'asc' });

      expect(result[0]?.companyName).toBe('Alpha');
      expect(result[1]?.companyName).toBe('Zebra');
    });
  });

  describe('getApplicationById', () => {
    it('returns application by id', () => {
      const app = createApplication({ companyName: 'A', positionTitle: 'P' });

      const result = getApplicationById(app.id);

      expect(result).toBeDefined();
      expect(result?.companyName).toBe('A');
    });

    it('returns null for non-existent id', () => {
      const result = getApplicationById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('updateApplication', () => {
    it('updates application fields', () => {
      const app = createApplication({ companyName: 'A', positionTitle: 'P' });

      const result = updateApplication(app.id, { companyName: 'B' });

      expect(result.companyName).toBe('B');
      expect(result.positionTitle).toBe('P');
    });

    it('populates default interview stages when transitioning to interviewing', () => {
      const app = createApplication({ companyName: 'A', positionTitle: 'P' });

      const result = updateApplication(app.id, { status: 'interviewing' });

      expect(result.interviewStages).toHaveLength(6);
      expect(result.interviewStages[0]?.name).toBe('Contacted by Recruiter');
    });

    it('throws error for non-existent application', () => {
      expect(() => {
        updateApplication('non-existent', { companyName: 'B' });
      }).toThrow('Application with id non-existent not found');
    });
  });

  describe('deleteApplication', () => {
    it('removes application from storage', () => {
      const app = createApplication({ companyName: 'A', positionTitle: 'P' });

      deleteApplication(app.id);

      const result = getApplicationById(app.id);
      expect(result).toBeNull();
    });

    it('throws error for non-existent application', () => {
      expect(() => {
        deleteApplication('non-existent');
      }).toThrow();
    });
  });

  describe('archiveApplicationById and restoreApplication', () => {
    it('archives application', () => {
      const app = createApplication({ companyName: 'A', positionTitle: 'P' });

      const result = archiveApplicationById(app.id);

      expect(result.isArchived).toBe(true);
    });

    it('restores archived application', () => {
      const app = createApplication({ companyName: 'A', positionTitle: 'P' });
      archiveApplicationById(app.id);

      const result = restoreApplication(app.id);

      expect(result.isArchived).toBe(false);
    });
  });

  describe('Interview Stage Operations', () => {
    it('adds interview stage', () => {
      const app = createApplication({ companyName: 'A', positionTitle: 'P' });
      updateApplication(app.id, { status: 'interviewing' });

      const stage = addInterviewStage(app.id, { name: 'Custom Stage' });

      expect(stage.name).toBe('Custom Stage');
      expect(stage.order).toBe(6); // After 6 default stages
    });

    it('updates interview stage', () => {
      const app = createApplication({ companyName: 'A', positionTitle: 'P' });
      updateApplication(app.id, { status: 'interviewing' });
      const updatedApp = getApplicationById(app.id);
      const stageId = updatedApp?.interviewStages[0]?.id;

      if (stageId) {
        const result = updateInterviewStage(app.id, stageId, {
          name: 'Updated Stage',
          isCompleted: true,
          completedDate: '2026-01-16',
          performanceRating: 4,
        });

        expect(result.name).toBe('Updated Stage');
        expect(result.isCompleted).toBe(true);
        expect(result.performanceRating).toBe(4);
      }
    });

    it('removes interview stage', () => {
      const app = createApplication({ companyName: 'A', positionTitle: 'P' });
      updateApplication(app.id, { status: 'interviewing' });
      const updatedApp = getApplicationById(app.id);
      const stageId = updatedApp?.interviewStages[0]?.id;

      if (stageId) {
        removeInterviewStage(app.id, stageId);

        const finalApp = getApplicationById(app.id);
        expect(finalApp?.interviewStages).toHaveLength(5);
      }
    });

    it('reorders interview stages', () => {
      const app = createApplication({ companyName: 'A', positionTitle: 'P' });
      updateApplication(app.id, { status: 'interviewing' });
      const updatedApp = getApplicationById(app.id);
      const stageIds = updatedApp?.interviewStages.map((s) => s.id) ?? [];

      // Reverse the order
      const newOrder = [...stageIds].reverse();
      reorderInterviewStages(app.id, newOrder);

      const finalApp = getApplicationById(app.id);
      expect(finalApp?.interviewStages[0]?.id).toBe(newOrder[0]);
    });
  });

  describe('Storage Management', () => {
    it('exports all data', () => {
      createApplication({ companyName: 'A', positionTitle: 'P' });

      const exported = exportData();

      expect(exported.version).toBe(1);
      expect(exported.applications).toHaveLength(1);
    });

    it('imports data', () => {
      const data: StorageSchema = {
        version: 1,
        applications: [
          {
            id: 'test-id',
            companyName: 'Imported',
            positionTitle: 'Test',
            dateApplied: '2026-01-01',
            status: 'applied',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
            interviewStages: [],
            isArchived: false,
          },
        ],
        lastModified: '2026-01-01T00:00:00Z',
      };

      importData(data);

      const result = getApplicationById('test-id');
      expect(result?.companyName).toBe('Imported');
    });

    it('clears all data', () => {
      createApplication({ companyName: 'A', positionTitle: 'P' });

      clearAllData();

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });
});
