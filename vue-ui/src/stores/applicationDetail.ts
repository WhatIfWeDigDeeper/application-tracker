import { ref, toRaw } from 'vue';
import { defineStore } from 'pinia';
import { produceWithPatches } from 'immer';
import type {
  Application,
  UpdateApplicationInput,
  CreateInterviewStageInput,
  UpdateInterviewStageInput,
  ImmerPatch,
} from '@/types';
import { applicationService, interviewStageService, eventService } from '@/services/api';
import { generateFieldChanges, generateDescription } from '@/utils/eventDescriptions';
import { useHistoryStore } from './history';

export const useApplicationDetailStore = defineStore('applicationDetail', () => {
  const application = ref<Application | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const isUndoRedoInProgress = ref(false);

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

  /**
   * Helper: records an event on the server and adds a local commit.
   * Uses the server-assigned sequence number for the commit.
   */
  async function recordEvent(
    appId: string,
    description: string,
    changes: ReturnType<typeof generateFieldChanges>,
    patches: ImmerPatch[],
    inversePatches: ImmerPatch[],
  ) {
    let sequence = 0;

    try {
      const serverEvent = await eventService.append(appId, {
        description,
        changes,
        patches,
        inversePatches,
      });
      sequence = serverEvent.sequence;
    } catch (eventErr) {
      console.error('Failed to record event:', eventErr);
    }

    const historyStore = useHistoryStore();
    historyStore.addCommit(appId, {
      id: crypto.randomUUID(),
      sequence,
      timestamp: Date.now(),
      description,
      changes,
      patches,
      inversePatches,
    });
  }

  async function updateApplication(input: UpdateApplicationInput) {
    if (!application.value) return;
    error.value = null;

    const oldState = toRaw(application.value);

    try {
      const updated = await applicationService.update(oldState.id, input);

      const [nextState, patches, inversePatches] = produceWithPatches(oldState, (draft) => {
        Object.assign(draft, updated);
      });

      application.value = nextState;

      if (!isUndoRedoInProgress.value) {
        const changes = generateFieldChanges(oldState, nextState, Object.keys(input));
        const description = generateDescription('update', oldState, input as Record<string, unknown>);
        await recordEvent(oldState.id, description, changes, patches as ImmerPatch[], inversePatches as ImmerPatch[]);
      }

      return application.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update application';
      throw err;
    }
  }

  async function deleteApplication() {
    if (!application.value) return;
    error.value = null;

    const oldState = toRaw(application.value);

    try {
      // Capture full state BEFORE delete for undo support
      const description = generateDescription('delete', oldState);

      const [, patches, inversePatches] = produceWithPatches(oldState, (draft) => {
        draft.isArchived = true;
      });

      // Delete the application (CASCADE will wipe events too)
      await applicationService.delete(oldState.id);

      // Don't try to append an event on the server - CASCADE already deleted it.
      // Instead, add a local-only commit with the full state for undo.
      if (!isUndoRedoInProgress.value) {
        const historyStore = useHistoryStore();
        historyStore.addCommit(oldState.id, {
          id: crypto.randomUUID(),
          sequence: 0,
          timestamp: Date.now(),
          description,
          changes: [],
          patches: patches as ImmerPatch[],
          inversePatches: inversePatches as ImmerPatch[],
          deletedState: oldState,
        });
      }

      application.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete application';
      throw err;
    }
  }

  async function archiveApplication() {
    if (!application.value) return;
    error.value = null;

    const oldState = toRaw(application.value);

    try {
      const updated = await applicationService.archive(oldState.id);

      const [nextState, patches, inversePatches] = produceWithPatches(oldState, (draft) => {
        Object.assign(draft, updated);
      });

      application.value = nextState;

      if (!isUndoRedoInProgress.value) {
        const description = generateDescription('archive', oldState);
        const changes = generateFieldChanges(oldState, nextState, ['isArchived']);
        await recordEvent(oldState.id, description, changes, patches as ImmerPatch[], inversePatches as ImmerPatch[]);
      }

      return application.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to archive application';
      throw err;
    }
  }

  async function restoreApplication() {
    if (!application.value) return;
    error.value = null;

    const oldState = toRaw(application.value);

    try {
      const updated = await applicationService.restore(oldState.id);

      const [nextState, patches, inversePatches] = produceWithPatches(oldState, (draft) => {
        Object.assign(draft, updated);
      });

      application.value = nextState;

      if (!isUndoRedoInProgress.value) {
        const description = generateDescription('restore', oldState);
        const changes = generateFieldChanges(oldState, nextState, ['isArchived']);
        await recordEvent(oldState.id, description, changes, patches as ImmerPatch[], inversePatches as ImmerPatch[]);
      }

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

    const oldState = toRaw(application.value);

    try {
      const stage = await interviewStageService.create(oldState.id, input);
      // Refresh application to get updated stages
      const refreshed = await applicationService.get(oldState.id);

      const [nextState, patches, inversePatches] = produceWithPatches(oldState, (draft) => {
        Object.assign(draft, refreshed);
      });

      application.value = nextState;

      if (!isUndoRedoInProgress.value) {
        const description = generateDescription('addStage', oldState, undefined, input.name);
        await recordEvent(oldState.id, description, [], patches as ImmerPatch[], inversePatches as ImmerPatch[]);
      }

      return stage;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add interview stage';
      throw err;
    }
  }

  async function updateInterviewStage(stageId: string, input: UpdateInterviewStageInput) {
    if (!application.value) return;
    error.value = null;

    const oldState = toRaw(application.value);

    try {
      const updatedStage = await interviewStageService.update(oldState.id, stageId, input);

      const [nextState, patches, inversePatches] = produceWithPatches(oldState, (draft) => {
        const index = draft.interviewStages.findIndex((s) => s.id === stageId);
        if (index !== -1) {
          Object.assign(draft.interviewStages[index], updatedStage);
        }
      });

      application.value = nextState;

      if (!isUndoRedoInProgress.value) {
        const stageName =
          oldState.interviewStages.find((s) => s.id === stageId)?.name || 'Unknown';
        const description = generateDescription('updateStage', oldState, undefined, stageName);
        await recordEvent(oldState.id, description, [], patches as ImmerPatch[], inversePatches as ImmerPatch[]);
      }

      return updatedStage;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update interview stage';
      throw err;
    }
  }

  async function deleteInterviewStage(stageId: string) {
    if (!application.value) return;
    error.value = null;

    const oldState = toRaw(application.value);

    try {
      await interviewStageService.delete(oldState.id, stageId);

      const [nextState, patches, inversePatches] = produceWithPatches(oldState, (draft) => {
        draft.interviewStages = draft.interviewStages.filter((s) => s.id !== stageId);
      });

      application.value = nextState;

      if (!isUndoRedoInProgress.value) {
        const stageName =
          oldState.interviewStages.find((s) => s.id === stageId)?.name || 'Unknown';
        const description = generateDescription('deleteStage', oldState, undefined, stageName);
        await recordEvent(oldState.id, description, [], patches as ImmerPatch[], inversePatches as ImmerPatch[]);
      }
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

  function $reset() {
    application.value = null;
    loading.value = false;
    error.value = null;
    isUndoRedoInProgress.value = false;
  }

  return {
    // State
    application,
    loading,
    error,
    isUndoRedoInProgress,

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

    // Utility
    $reset,
  };
});
