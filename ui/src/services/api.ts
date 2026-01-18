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

// Applications endpoints
export const applicationsApi = {
  list: (): Promise<ApiData> =>
    apiCall<ApiData>('/applications'),

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
      method: 'PATCH',
    }),

  restore: (id: string): Promise<ApiData> =>
    apiCall<ApiData>(`/applications/${id}/restore`, {
      method: 'PATCH',
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
