import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../services/api";
import type {
  CreateApplicationInput,
  UpdateApplicationInput,
  CreateInterviewStageInput,
  UpdateInterviewStageInput,
} from "../types/application";
import { applicationKeys } from "./queryKeys";

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateApplicationInput) =>
      api.createApplication(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
    },
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateApplicationInput }) =>
      api.updateApplication(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: applicationKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: applicationKeys.history(variables.id),
      });
    },
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
    },
  });
}

export function useArchiveApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.archiveApplication(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({
        queryKey: applicationKeys.detail(id),
      });
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
    },
  });
}

export function useRestoreApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.restoreApplication(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({
        queryKey: applicationKeys.detail(id),
      });
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
    },
  });
}

export function useRestoreToVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sequence }: { id: string; sequence: number }) =>
      api.restoreToVersion(id, sequence),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: applicationKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: applicationKeys.history(variables.id),
      });
    },
  });
}

export function useCreateStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      input,
    }: {
      applicationId: string;
      input: CreateInterviewStageInput;
    }) => api.createInterviewStage(applicationId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: applicationKeys.detail(variables.applicationId),
      });
      queryClient.invalidateQueries({
        queryKey: applicationKeys.history(variables.applicationId),
      });
    },
  });
}

export function useUpdateStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      stageId,
      input,
    }: {
      applicationId: string;
      stageId: string;
      input: UpdateInterviewStageInput;
    }) => api.updateInterviewStage(applicationId, stageId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: applicationKeys.detail(variables.applicationId),
      });
      queryClient.invalidateQueries({
        queryKey: applicationKeys.history(variables.applicationId),
      });
    },
  });
}

export function useDeleteStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      stageId,
    }: {
      applicationId: string;
      stageId: string;
    }) => api.deleteInterviewStage(applicationId, stageId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: applicationKeys.detail(variables.applicationId),
      });
      queryClient.invalidateQueries({
        queryKey: applicationKeys.history(variables.applicationId),
      });
    },
  });
}
