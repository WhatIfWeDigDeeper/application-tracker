import { createServerFn } from "@tanstack/react-start";
import { serverFetch, buildQueryString } from "./api";
import type {
  PaginatedApplications,
  Application,
  ListApplicationsParams,
} from "../types/application";

export const fetchApplications = createServerFn({ method: "GET" })
  .inputValidator((data: ListApplicationsParams) => data)
  .handler(async ({ data }) => {
    const queryString = buildQueryString(data as Record<string, unknown>);
    return serverFetch<PaginatedApplications>(`/applications/${queryString}`);
  });

export const fetchApplication = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return serverFetch<Application>(`/applications/${data.id}`);
  });
