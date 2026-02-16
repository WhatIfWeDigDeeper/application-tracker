import type {
  Application,
  PaginatedApplications,
  CreateApplicationInput,
  UpdateApplicationInput,
  InterviewStage,
  CreateInterviewStageInput,
  UpdateInterviewStageInput,
  ListApplicationsParams,
  ErrorResponse,
  PaginatedHistoryResponse,
} from "../types/application";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

class ApiError extends Error {
  constructor(
    public status: number,
    public response: ErrorResponse
  ) {
    super(response.message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      code: "internal_error",
      message: "An unexpected error occurred",
    }));
    throw new ApiError(response.status, errorData as ErrorResponse);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

// Health check
export async function checkHealth(): Promise<{ status: string; timestamp: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  return handleResponse(response);
}

// Applications API
export async function listApplications(
  params: ListApplicationsParams = {}
): Promise<PaginatedApplications> {
  const queryParams: Record<string, unknown> = {
    ...params,
    status: params.status,
  };

  const queryString = buildQueryString(queryParams);
  const response = await fetch(`${API_BASE_URL}/applications${queryString}`);
  return handleResponse(response);
}

export async function getApplication(id: string): Promise<Application> {
  const response = await fetch(`${API_BASE_URL}/applications/${id}`);
  return handleResponse(response);
}

export async function createApplication(
  input: CreateApplicationInput
): Promise<Application> {
  const response = await fetch(`${API_BASE_URL}/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse(response);
}

export async function updateApplication(
  id: string,
  input: UpdateApplicationInput
): Promise<Application> {
  const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse(response);
}

export async function deleteApplication(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
    method: "DELETE",
  });
  return handleResponse(response);
}

export async function archiveApplication(id: string): Promise<Application> {
  const response = await fetch(`${API_BASE_URL}/applications/${id}/archive`, {
    method: "POST",
  });
  return handleResponse(response);
}

export async function restoreApplication(id: string): Promise<Application> {
  const response = await fetch(`${API_BASE_URL}/applications/${id}/restore`, {
    method: "POST",
  });
  return handleResponse(response);
}

// Interview Stages API
export async function createInterviewStage(
  applicationId: string,
  input: CreateInterviewStageInput
): Promise<InterviewStage> {
  const response = await fetch(
    `${API_BASE_URL}/applications/${applicationId}/interview-stages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );
  return handleResponse(response);
}

export async function updateInterviewStage(
  applicationId: string,
  stageId: string,
  input: UpdateInterviewStageInput
): Promise<InterviewStage> {
  const response = await fetch(
    `${API_BASE_URL}/applications/${applicationId}/interview-stages/${stageId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );
  return handleResponse(response);
}

export async function deleteInterviewStage(
  applicationId: string,
  stageId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/applications/${applicationId}/interview-stages/${stageId}`,
    {
      method: "DELETE",
    }
  );
  return handleResponse(response);
}

// History API
export async function getHistory(
  id: string,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedHistoryResponse> {
  const response = await fetch(
    `${API_BASE_URL}/applications/${id}/history?page=${page}&limit=${limit}`
  );
  if (!response.ok) throw new Error("Failed to fetch history");
  return response.json();
}

export async function restoreToVersion(
  id: string,
  sequence: number
): Promise<Application> {
  const response = await fetch(
    `${API_BASE_URL}/applications/${id}/history/restore`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sequence }),
    }
  );
  if (!response.ok) throw new Error("Failed to restore version");
  return response.json();
}

export { ApiError };
