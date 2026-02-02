import { ref } from 'vue';
import type {
  Application,
  UpdateApplicationInput,
  CreateInterviewStageInput,
  UpdateInterviewStageInput,
} from '@/types';
import { applicationService, interviewStageService } from '@/services/parse';

export function useApplication() {
  const application = ref<Application | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchApplication(id: string) {
    loading.value = true;
    error.value = null;

    try {
      application.value = await applicationService.get(id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch application';
      console.error('Failed to fetch application:', err);
    } finally {
      loading.value = false;
    }
  }

  async function updateApplication(input: UpdateApplicationInput) {
    if (!application.value) return;

    error.value = null;

    try {
      application.value = await applicationService.update(application.value.id, input);
      return application.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update application';
      throw err;
    }
  }

  async function deleteApplication() {
    if (!application.value) return;

    error.value = null;

    try {
      await applicationService.delete(application.value.id);
      application.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete application';
      throw err;
    }
  }

  async function archiveApplication() {
    if (!application.value) return;

    error.value = null;

    try {
      application.value = await applicationService.archive(application.value.id);
      return application.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to archive application';
      throw err;
    }
  }

  async function restoreApplication() {
    if (!application.value) return;

    error.value = null;

    try {
      application.value = await applicationService.restore(application.value.id);
      return application.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to restore application';
      throw err;
    }
  }

  // Interview Stage methods
  async function addInterviewStage(input: CreateInterviewStageInput) {
    if (!application.value) return;

    error.value = null;

    try {
      const stage = await interviewStageService.create(application.value.id, input);
      // Refresh application to get updated stages
      await fetchApplication(application.value.id);
      return stage;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add interview stage';
      throw err;
    }
  }

  async function updateInterviewStage(stageId: string, input: UpdateInterviewStageInput) {
    if (!application.value) return;

    error.value = null;

    try {
      const stage = await interviewStageService.update(application.value.id, stageId, input);
      // Update local state
      const index = application.value.interviewStages.findIndex((s) => s.id === stageId);
      if (index !== -1) {
        application.value.interviewStages[index] = stage;
      }
      return stage;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update interview stage';
      throw err;
    }
  }

  async function deleteInterviewStage(stageId: string) {
    if (!application.value) return;

    error.value = null;

    try {
      await interviewStageService.delete(application.value.id, stageId);
      // Remove from local state
      application.value.interviewStages = application.value.interviewStages.filter(
        (s) => s.id !== stageId
      );
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete interview stage';
      throw err;
    }
  }

  async function toggleStageCompletion(stageId: string) {
    if (!application.value) return;

    const stage = application.value.interviewStages.find((s) => s.id === stageId);
    if (!stage) return;

    const newIsCompleted = !stage.isCompleted;
    await updateInterviewStage(stageId, {
      isCompleted: newIsCompleted,
      completedDate: newIsCompleted ? new Date().toISOString().split('T')[0] : null,
    });
  }

  return {
    // State
    application,
    loading,
    error,

    // Application methods
    fetchApplication,
    updateApplication,
    deleteApplication,
    archiveApplication,
    restoreApplication,

    // Interview Stage methods
    addInterviewStage,
    updateInterviewStage,
    deleteInterviewStage,
    toggleStageCompletion,
  };
}
