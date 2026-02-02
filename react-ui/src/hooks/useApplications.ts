import { useState, useCallback } from "react";
import type {
  Application,
  ListApplicationsParams,
  CreateApplicationInput,
  UpdateApplicationInput,
  CreateInterviewStageInput,
  UpdateInterviewStageInput,
} from "../types/application";
import * as api from "../services/api";

interface UseApplicationsResult {
  applications: Application[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;
  selectedApplication: Application | null;
  fetchApplications: (params?: ListApplicationsParams) => Promise<void>;
  createApplication: (input: CreateApplicationInput) => Promise<Application>;
  updateApplication: (
    id: string,
    input: UpdateApplicationInput
  ) => Promise<Application>;
  deleteApplication: (id: string) => Promise<void>;
  archiveApplication: (id: string) => Promise<Application>;
  restoreApplication: (id: string) => Promise<Application>;
  selectApplication: (id: string | null) => Promise<void>;
  createStage: (
    applicationId: string,
    input: CreateInterviewStageInput
  ) => Promise<void>;
  updateStage: (
    applicationId: string,
    stageId: string,
    input: UpdateInterviewStageInput
  ) => Promise<void>;
  deleteStage: (applicationId: string, stageId: string) => Promise<void>;
  refreshSelected: () => Promise<void>;
}

export function useApplications(): UseApplicationsResult {
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [lastParams, setLastParams] = useState<ListApplicationsParams>({});

  const fetchApplications = useCallback(
    async (params: ListApplicationsParams = {}) => {
      setLoading(true);
      setError(null);
      setLastParams(params);

      try {
        const result = await api.listApplications(params);
        setApplications(result.items);
        setTotal(result.total);
        setPage(result.page);
        setLimit(result.limit);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch applications"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createApplication = useCallback(
    async (input: CreateApplicationInput): Promise<Application> => {
      const app = await api.createApplication(input);
      await fetchApplications(lastParams);
      return app;
    },
    [fetchApplications, lastParams]
  );

  const updateApplication = useCallback(
    async (id: string, input: UpdateApplicationInput): Promise<Application> => {
      const app = await api.updateApplication(id, input);

      // Update in list
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? app : a))
      );

      // Update selected if it's the same
      if (selectedApplication?.id === id) {
        setSelectedApplication(app);
      }

      return app;
    },
    [selectedApplication]
  );

  const deleteApplication = useCallback(
    async (id: string): Promise<void> => {
      await api.deleteApplication(id);
      setApplications((prev) => prev.filter((a) => a.id !== id));
      setTotal((prev) => prev - 1);

      if (selectedApplication?.id === id) {
        setSelectedApplication(null);
      }
    },
    [selectedApplication]
  );

  const archiveApplication = useCallback(
    async (id: string): Promise<Application> => {
      const app = await api.archiveApplication(id);

      // Refresh list to reflect archive status
      await fetchApplications(lastParams);

      if (selectedApplication?.id === id) {
        setSelectedApplication(app);
      }

      return app;
    },
    [fetchApplications, lastParams, selectedApplication]
  );

  const restoreApplication = useCallback(
    async (id: string): Promise<Application> => {
      const app = await api.restoreApplication(id);

      // Refresh list to reflect restore status
      await fetchApplications(lastParams);

      if (selectedApplication?.id === id) {
        setSelectedApplication(app);
      }

      return app;
    },
    [fetchApplications, lastParams, selectedApplication]
  );

  const selectApplication = useCallback(
    async (id: string | null): Promise<void> => {
      if (!id) {
        setSelectedApplication(null);
        return;
      }

      try {
        const app = await api.getApplication(id);
        setSelectedApplication(app);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch application"
        );
      }
    },
    []
  );

  const refreshSelected = useCallback(async (): Promise<void> => {
    if (selectedApplication) {
      await selectApplication(selectedApplication.id);
    }
  }, [selectedApplication, selectApplication]);

  const createStage = useCallback(
    async (
      applicationId: string,
      input: CreateInterviewStageInput
    ): Promise<void> => {
      await api.createInterviewStage(applicationId, input);
      await refreshSelected();
      await fetchApplications(lastParams);
    },
    [refreshSelected, fetchApplications, lastParams]
  );

  const updateStage = useCallback(
    async (
      applicationId: string,
      stageId: string,
      input: UpdateInterviewStageInput
    ): Promise<void> => {
      await api.updateInterviewStage(applicationId, stageId, input);
      await refreshSelected();
      await fetchApplications(lastParams);
    },
    [refreshSelected, fetchApplications, lastParams]
  );

  const deleteStage = useCallback(
    async (applicationId: string, stageId: string): Promise<void> => {
      await api.deleteInterviewStage(applicationId, stageId);
      await refreshSelected();
      await fetchApplications(lastParams);
    },
    [refreshSelected, fetchApplications, lastParams]
  );

  return {
    applications,
    total,
    page,
    limit,
    loading,
    error,
    selectedApplication,
    fetchApplications,
    createApplication,
    updateApplication,
    deleteApplication,
    archiveApplication,
    restoreApplication,
    selectApplication,
    createStage,
    updateStage,
    deleteStage,
    refreshSelected,
  };
}
