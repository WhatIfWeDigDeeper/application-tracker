import type {
  Application,
  CreateApplicationInput,
  CreateInterviewStageInput,
  CursorPaginatedApplicationsResponse,
  ImportResult,
  PaginatedApplicationsResponse,
  PaginatedHistoryResponse,
  UpdateApplicationInput,
  UpdateInterviewStageInput,
} from '@/types/application';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  public readonly status: number;

  constructor(
    status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function buildQueryString(params: Record<string, unknown>): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value == null) {
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length > 0) {
        query.set(key, value.join(','));
      }
      continue;
    }

    query.set(key, String(value));
  }

  const output = query.toString();
  return output.length > 0 ? `?${output}` : '';
}

export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = response.statusText;

    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) {
        message = body.message;
      }
    } catch {
      // Intentionally ignored; status text fallback is enough.
    }

    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function listApplications(params: Record<string, unknown>): Promise<PaginatedApplicationsResponse | CursorPaginatedApplicationsResponse> {
  const res = await fetch(`${API_BASE}/applications${buildQueryString(params)}`);
  return handleResponse(res);
}

export async function getApplication(id: string): Promise<Application> {
  const res = await fetch(`${API_BASE}/applications/${id}`);
  return handleResponse(res);
}

export async function createApplication(input: CreateApplicationInput): Promise<Application> {
  const res = await fetch(`${API_BASE}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse(res);
}

export async function updateApplication(id: string, input: UpdateApplicationInput): Promise<Application> {
  const res = await fetch(`${API_BASE}/applications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse(res);
}

export async function deleteApplication(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/applications/${id}`, { method: 'DELETE' });
  return handleResponse(res);
}

export async function archiveApplication(id: string): Promise<Application> {
  const res = await fetch(`${API_BASE}/applications/${id}/archive`, { method: 'POST' });
  return handleResponse(res);
}

export async function restoreApplication(id: string): Promise<Application> {
  const res = await fetch(`${API_BASE}/applications/${id}/restore`, { method: 'POST' });
  return handleResponse(res);
}

export async function listHistory(id: string, page = 1, limit = 50): Promise<PaginatedHistoryResponse> {
  const res = await fetch(`${API_BASE}/applications/${id}/history${buildQueryString({ page, limit })}`);
  return handleResponse(res);
}

export async function restoreToVersion(id: string, sequence: number): Promise<Application> {
  const res = await fetch(`${API_BASE}/applications/${id}/history/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sequence }),
  });
  return handleResponse(res);
}

export async function createStage(id: string, input: CreateInterviewStageInput) {
  const res = await fetch(`${API_BASE}/applications/${id}/interview-stages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse(res);
}

export async function updateStage(id: string, stageId: string, input: UpdateInterviewStageInput) {
  const res = await fetch(`${API_BASE}/applications/${id}/interview-stages/${stageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse(res);
}

export async function deleteStage(id: string, stageId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/applications/${id}/interview-stages/${stageId}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
}

export async function exportCSV(): Promise<void> {
  const res = await fetch(`${API_BASE}/applications/export`);
  if (!res.ok) {
    throw new ApiError(res.status, 'Failed to export CSV');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const today = new Date().toISOString().split('T')[0];
  const link = document.createElement('a');
  link.href = url;
  link.download = `applications-${today}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function importCSV(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/applications/import`, {
    method: 'POST',
    body: formData,
  });

  return handleResponse<ImportResult>(res);
}

export async function downloadSampleCSV(): Promise<void> {
  const res = await fetch(`${API_BASE}/applications/sample-csv`);
  if (!res.ok) {
    throw new ApiError(res.status, 'Failed to download sample CSV');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'applications-template.csv';
  link.click();
  URL.revokeObjectURL(url);
}
