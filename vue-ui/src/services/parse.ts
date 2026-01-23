import Parse from 'parse';
import type {
  Application,
  InterviewStage,
  CreateApplicationInput,
  UpdateApplicationInput,
  CreateInterviewStageInput,
  UpdateInterviewStageInput,
  PaginatedResponse,
  FilterState,
} from '@/types';

// Application Service
export const applicationService = {
  async list(filters: FilterState): Promise<PaginatedResponse<Application>> {
    const result = await Parse.Cloud.run('listApplications', {
      status: filters.status,
      companyCategory: filters.companyCategory,
      jobSource: filters.jobSource,
      skillsMatchMin: filters.skillsMatchMin,
      includeArchived: filters.includeArchived,
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
      page: filters.page,
      limit: filters.limit,
    });
    return result as PaginatedResponse<Application>;
  },

  async get(id: string): Promise<Application> {
    const result = await Parse.Cloud.run('getApplication', { id });
    return result as Application;
  },

  async create(input: CreateApplicationInput): Promise<Application> {
    const result = await Parse.Cloud.run('createApplication', input);
    return result as Application;
  },

  async update(id: string, input: UpdateApplicationInput): Promise<Application> {
    const result = await Parse.Cloud.run('updateApplication', { id, ...input });
    return result as Application;
  },

  async delete(id: string): Promise<void> {
    await Parse.Cloud.run('deleteApplication', { id });
  },

  async archive(id: string): Promise<Application> {
    const result = await Parse.Cloud.run('archiveApplication', { id });
    return result as Application;
  },

  async restore(id: string): Promise<Application> {
    const result = await Parse.Cloud.run('restoreApplication', { id });
    return result as Application;
  },
};

// Interview Stage Service
export const interviewStageService = {
  async create(applicationId: string, input: CreateInterviewStageInput): Promise<InterviewStage> {
    const result = await Parse.Cloud.run('createInterviewStage', { applicationId, ...input });
    return result as InterviewStage;
  },

  async update(
    applicationId: string,
    stageId: string,
    input: UpdateInterviewStageInput
  ): Promise<InterviewStage> {
    const result = await Parse.Cloud.run('updateInterviewStage', {
      applicationId,
      stageId,
      ...input,
    });
    return result as InterviewStage;
  },

  async delete(applicationId: string, stageId: string): Promise<void> {
    await Parse.Cloud.run('deleteInterviewStage', { applicationId, stageId });
  },
};

// Health check
export async function checkHealth(): Promise<{ status: string; timestamp: string }> {
  const result = await Parse.Cloud.run('health');
  return result as { status: string; timestamp: string };
}
