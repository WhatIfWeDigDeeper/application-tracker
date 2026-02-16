import { useQuery } from "@tanstack/react-query";
import * as api from "../services/api";
import type { ListApplicationsParams } from "../types/application";
import { applicationKeys } from "./queryKeys";

export function useApplications(params: ListApplicationsParams = {}) {
  return useQuery({
    queryKey: applicationKeys.list(params as Record<string, unknown>),
    queryFn: () => api.listApplications(params),
  });
}

export function useApplication(id: string | undefined) {
  return useQuery({
    queryKey: applicationKeys.detail(id!),
    queryFn: () => api.getApplication(id!),
    enabled: !!id,
  });
}

export function useApplicationHistory(
  id: string | undefined,
  page: number = 1,
  limit: number = 50
) {
  return useQuery({
    queryKey: [...applicationKeys.history(id!), { page, limit }],
    queryFn: () => api.getHistory(id!, page, limit),
    enabled: !!id,
  });
}
