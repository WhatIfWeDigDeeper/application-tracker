import type { ErrorResponse } from "../types/application";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:5160";

export class ServerApiError extends Error {
  constructor(
    public status: number,
    public response: ErrorResponse
  ) {
    super(response.message);
    this.name = "ServerApiError";
  }
}

export async function serverFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${FASTAPI_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      code: "internal_error",
      message: "An unexpected error occurred",
    }));
    throw new ServerApiError(response.status, errorData as ErrorResponse);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  }

  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}
