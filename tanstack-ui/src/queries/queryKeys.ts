export const applicationKeys = {
  all: ["applications"] as const,
  lists: () => [...applicationKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...applicationKeys.lists(), params] as const,
  details: () => [...applicationKeys.all, "detail"] as const,
  detail: (id: string) => [...applicationKeys.details(), id] as const,
  histories: () => [...applicationKeys.all, "history"] as const,
  history: (id: string) => [...applicationKeys.histories(), id] as const,
};
