import type {
  Application,
  CreateApplicationInput,
  UpdateApplicationInput,
  CreateInterviewStageInput,
  UpdateInterviewStageInput,
  InterviewStage,
  PaginatedResponse,
  FilterState,
} from '$lib/types';

const API_BASE = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

export const api = {
  // Applications
  async listApplications(filters: FilterState): Promise<PaginatedResponse<Application>> {
    const params = new URLSearchParams();

    if (filters.status) params.set('status', filters.status);
    if (filters.companyCategory) params.set('companyCategory', filters.companyCategory);
    if (filters.jobSource) params.set('jobSource', filters.jobSource);
    if (filters.skillsMatchMin) params.set('skillsMatchMin', filters.skillsMatchMin.toString());
    if (filters.includeArchived) params.set('includeArchived', 'true');
    params.set('sortBy', filters.sortBy);
    params.set('sortDir', filters.sortDir);
    params.set('page', filters.page.toString());
    params.set('limit', filters.limit.toString());

    const response = await fetch(`${API_BASE}/applications?${params}`);
    return handleResponse<PaginatedResponse<Application>>(response);
  },

  async getApplication(id: string): Promise<Application> {
    const response = await fetch(`${API_BASE}/applications/${id}`);
    return handleResponse<Application>(response);
  },

  async createApplication(input: CreateApplicationInput): Promise<Application> {
    const response = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return handleResponse<Application>(response);
  },

  async updateApplication(id: string, input: UpdateApplicationInput): Promise<Application> {
    const response = await fetch(`${API_BASE}/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return handleResponse<Application>(response);
  },

  async deleteApplication(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/applications/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },

  async archiveApplication(id: string): Promise<Application> {
    const response = await fetch(`${API_BASE}/applications/${id}/archive`, {
      method: 'POST',
    });
    return handleResponse<Application>(response);
  },

  async restoreApplication(id: string): Promise<Application> {
    const response = await fetch(`${API_BASE}/applications/${id}/restore`, {
      method: 'POST',
    });
    return handleResponse<Application>(response);
  },

  // Interview Stages
  async createInterviewStage(applicationId: string, input: CreateInterviewStageInput): Promise<InterviewStage> {
    const response = await fetch(`${API_BASE}/applications/${applicationId}/interview-stages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return handleResponse<InterviewStage>(response);
  },

  async updateInterviewStage(
    applicationId: string,
    stageId: string,
    input: UpdateInterviewStageInput
  ): Promise<InterviewStage> {
    const response = await fetch(`${API_BASE}/applications/${applicationId}/interview-stages/${stageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return handleResponse<InterviewStage>(response);
  },

  async deleteInterviewStage(applicationId: string, stageId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/applications/${applicationId}/interview-stages/${stageId}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },
};
