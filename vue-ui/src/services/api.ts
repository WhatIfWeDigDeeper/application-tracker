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

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || error.statusMessage || `Request failed: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Application Service
export const applicationService = {
  async list(filters: FilterState): Promise<PaginatedResponse<Application>> {
    const params = new URLSearchParams();

    if (filters.status) params.set('status', filters.status);
    if (filters.companyCategory) params.set('companyCategory', filters.companyCategory);
    if (filters.jobSource) params.set('jobSource', filters.jobSource);
    if (filters.skillsMatchMin) params.set('skillsMatchMin', String(filters.skillsMatchMin));
    params.set('includeArchived', String(filters.includeArchived));
    params.set('sortBy', filters.sortBy);
    params.set('sortDir', filters.sortDir);
    params.set('page', String(filters.page));
    params.set('limit', String(filters.limit));

    return request<PaginatedResponse<Application>>(`/applications?${params.toString()}`);
  },

  async get(id: string): Promise<Application> {
    return request<Application>(`/applications/${id}`);
  },

  async create(input: CreateApplicationInput): Promise<Application> {
    return request<Application>('/applications', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async update(id: string, input: UpdateApplicationInput): Promise<Application> {
    return request<Application>(`/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  async delete(id: string): Promise<void> {
    return request<void>(`/applications/${id}`, { method: 'DELETE' });
  },

  async archive(id: string): Promise<Application> {
    return request<Application>(`/applications/${id}/archive`, { method: 'POST' });
  },

  async restore(id: string): Promise<Application> {
    return request<Application>(`/applications/${id}/restore`, { method: 'POST' });
  },
};

// Interview Stage Service
export const interviewStageService = {
  async create(applicationId: string, input: CreateInterviewStageInput): Promise<InterviewStage> {
    return request<InterviewStage>(`/applications/${applicationId}/interview-stages`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async update(
    applicationId: string,
    stageId: string,
    input: UpdateInterviewStageInput,
  ): Promise<InterviewStage> {
    return request<InterviewStage>(`/applications/${applicationId}/interview-stages/${stageId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  async delete(applicationId: string, stageId: string): Promise<void> {
    return request<void>(`/applications/${applicationId}/interview-stages/${stageId}`, {
      method: 'DELETE',
    });
  },
};

// Health check
export async function checkHealth(): Promise<{ status: string; timestamp: string }> {
  return request<{ status: string; timestamp: string }>('/health');
}
