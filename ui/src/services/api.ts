/**
 * API Client Service
 * Handles all HTTP requests to the Express API
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new ApiError(response.status, error || `HTTP ${response.status}`);
    }

    // Handle 204 No Content (e.g., DELETE responses)
    if (response.status === 204) {
      return undefined as T;
    }

    const data = await response.json() as T;
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, error instanceof Error ? error.message : 'Unknown error');
  }
}

// eslint-disable @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiData = any;

export interface ListApplicationsParams {
  status?: string[];
  companyCategory?: string[];
  jobSource?: string[];
  includeArchived?: boolean;
  page?: number;
  limit?: number;
}

function buildQueryString(params: ListApplicationsParams): string {
  const searchParams = new URLSearchParams();

  // For array params, join with comma (server expects single string)
  if (params.status && params.status.length > 0) {
    searchParams.set('status', params.status.join(','));
  }
  if (params.companyCategory && params.companyCategory.length > 0) {
    searchParams.set('companyCategory', params.companyCategory.join(','));
  }
  if (params.jobSource && params.jobSource.length > 0) {
    searchParams.set('jobSource', params.jobSource.join(','));
  }
  if (params.includeArchived !== undefined) {
    searchParams.set('includeArchived', String(params.includeArchived));
  }
  if (params.page !== undefined) {
    searchParams.set('page', String(params.page));
  }
  if (params.limit !== undefined) {
    searchParams.set('limit', String(params.limit));
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// Applications endpoints
export const applicationsApi = {
  list: (params?: ListApplicationsParams): Promise<ApiData> =>
    apiCall<ApiData>(`/applications${params ? buildQueryString(params) : ''}`),

  get: (id: string): Promise<ApiData> =>
    apiCall<ApiData>(`/applications/${id}`),

  create: (data: ApiData): Promise<ApiData> =>
    apiCall<ApiData>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: ApiData): Promise<ApiData> =>
    apiCall<ApiData>(`/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<ApiData> =>
    apiCall<ApiData>(`/applications/${id}`, {
      method: 'DELETE',
    }),

  archive: (id: string): Promise<ApiData> =>
    apiCall<ApiData>(`/applications/${id}/archive`, {
      method: 'POST',
    }),

  restore: (id: string): Promise<ApiData> =>
    apiCall<ApiData>(`/applications/${id}/restore`, {
      method: 'POST',
    }),

  getHistory: (id: string, page: number = 1, limit: number = 50): Promise<ApiData> =>
    apiCall<ApiData>(`/applications/${id}/history?page=${page}&limit=${limit}`),

  restoreToVersion: (id: string, sequence: number): Promise<ApiData> =>
    apiCall<ApiData>(`/applications/${id}/history/restore`, {
      method: 'POST',
      body: JSON.stringify({ sequence }),
    }),
};

// Interview Stages endpoints
export const stagesApi = {
  list: (applicationId: string): Promise<ApiData> =>
    apiCall<ApiData>(`/applications/${applicationId}/interview-stages`),

  create: (applicationId: string, data: ApiData): Promise<ApiData> =>
    apiCall<ApiData>(`/applications/${applicationId}/interview-stages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (applicationId: string, stageId: string, data: ApiData): Promise<ApiData> =>
    apiCall<ApiData>(`/applications/${applicationId}/interview-stages/${stageId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (applicationId: string, stageId: string): Promise<ApiData> =>
    apiCall<ApiData>(`/applications/${applicationId}/interview-stages/${stageId}`, {
      method: 'DELETE',
    }),
};
