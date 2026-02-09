import { ref } from 'vue';
import { defineStore } from 'pinia';
import { toRaw } from 'vue';
import { applyPatches } from 'immer';
import type {
  ImmerPatch,
  FieldChange,
  Application,
  InterviewStage,
  UpdateApplicationInput,
} from '@/types';
import { applicationService, interviewStageService, eventService } from '@/services/api';
import { useApplicationDetailStore } from './applicationDetail';

export interface Commit {
  id: string;
  sequence: number;
  timestamp: number;
  description: string;
  changes: FieldChange[];
  patches: ImmerPatch[];
  inversePatches: ImmerPatch[];
  deletedState?: Application;
}

export const useHistoryStore = defineStore('history', () => {
  // Per-application history
  const commitsByApp = ref<Map<string, Commit[]>>(new Map());
  const cursorByApp = ref<Map<string, number>>(new Map());
  const loadingHistory = ref(false);

  function getCommits(appId: string): Commit[] {
    return commitsByApp.value.get(appId) || [];
  }

  function getCursor(appId: string): number {
    const cursor = cursorByApp.value.get(appId);
    if (cursor === undefined) return -1;
    return cursor;
  }

  function canUndo(appId: string): boolean {
    return getCursor(appId) >= 0;
  }

  function canRedo(appId: string): boolean {
    const commits = getCommits(appId);
    const cursor = getCursor(appId);
    return cursor < commits.length - 1;
  }

  function addCommit(appId: string, commit: Commit) {
    const commits = getCommits(appId);
    const cursor = getCursor(appId);

    // Truncate any commits after cursor (discards redo stack)
    const truncated = commits.slice(0, cursor + 1);

    // Push new commit
    truncated.push(commit);

    // Update map
    commitsByApp.value.set(appId, truncated);
    // Set cursor to end
    cursorByApp.value.set(appId, truncated.length - 1);
  }

  async function undo(appId: string) {
    const detailStore = useApplicationDetailStore();
    const commits = getCommits(appId);
    const cursor = getCursor(appId);

    if (cursor < 0) return;
    const commit = commits[cursor];

    // Special case: undo a delete (application is null, we need to recreate)
    if (commit.deletedState) {
      detailStore.isUndoRedoInProgress = true;
      try {
        const recreated = await applicationService.recreate(commit.deletedState);
        detailStore.application = recreated;
        cursorByApp.value.set(appId, cursor - 1);
      } finally {
        detailStore.isUndoRedoInProgress = false;
      }
      return;
    }

    if (!detailStore.application) return;

    detailStore.isUndoRedoInProgress = true;
    try {
      const currentState = toRaw(detailStore.application);
      const previousState = applyPatches(currentState, commit.inversePatches as never[]) as Application;

      // Sync changes to server
      await syncStateToServer(appId, currentState, previousState);

      // Update local state
      detailStore.application = previousState;
      cursorByApp.value.set(appId, cursor - 1);
    } finally {
      detailStore.isUndoRedoInProgress = false;
    }
  }

  async function redo(appId: string) {
    const detailStore = useApplicationDetailStore();
    const commits = getCommits(appId);
    const cursor = getCursor(appId);

    if (cursor >= commits.length - 1) return;
    const commit = commits[cursor + 1];

    // Special case: redo a delete
    if (commit.deletedState) {
      detailStore.isUndoRedoInProgress = true;
      try {
        await applicationService.delete(appId);
        detailStore.application = null;
        cursorByApp.value.set(appId, cursor + 1);
      } finally {
        detailStore.isUndoRedoInProgress = false;
      }
      return;
    }

    if (!detailStore.application) return;

    detailStore.isUndoRedoInProgress = true;
    try {
      const currentState = toRaw(detailStore.application);
      const nextState = applyPatches(currentState, commit.patches as never[]) as Application;

      // Sync changes to server
      await syncStateToServer(appId, currentState, nextState);

      // Update local state
      detailStore.application = nextState;
      cursorByApp.value.set(appId, cursor + 1);
    } finally {
      detailStore.isUndoRedoInProgress = false;
    }
  }

  async function loadHistory(appId: string) {
    loadingHistory.value = true;
    try {
      const result = await eventService.list(appId, 1, 200);
      const commits: Commit[] = result.events
        .sort((a, b) => a.sequence - b.sequence)
        .map((event) => ({
          id: event.id,
          sequence: event.sequence,
          timestamp: new Date(event.createdAt).getTime(),
          description: event.description,
          changes: event.changes,
          patches: event.patches,
          inversePatches: event.inversePatches,
        }));

      commitsByApp.value.set(appId, commits);
      cursorByApp.value.set(appId, commits.length - 1);
    } catch (err) {
      console.error('Failed to load history:', err);
      // Initialize empty history on error
      commitsByApp.value.set(appId, []);
      cursorByApp.value.set(appId, -1);
    } finally {
      loadingHistory.value = false;
    }
  }

  function clearHistory(appId: string) {
    commitsByApp.value.delete(appId);
    cursorByApp.value.delete(appId);
  }

  return {
    commitsByApp,
    cursorByApp,
    loadingHistory,
    getCommits,
    getCursor,
    canUndo,
    canRedo,
    addCommit,
    undo,
    redo,
    loadHistory,
    clearHistory,
  };
});

/**
 * Syncs the difference between oldState and newState to the server.
 * Handles top-level fields, archive/restore, and interview stage changes.
 */
async function syncStateToServer(
  appId: string,
  oldState: Application,
  newState: Application,
) {
  // 1. Handle archive/restore toggling
  if (oldState.isArchived !== newState.isArchived) {
    if (newState.isArchived) {
      await applicationService.archive(appId);
    } else {
      await applicationService.restore(appId);
    }
  }

  // 2. Handle top-level field changes
  const fieldChanges = extractChangedFields(oldState, newState);
  if (Object.keys(fieldChanges).length > 0) {
    await applicationService.update(appId, fieldChanges);
  }

  // 3. Handle interview stage changes
  await syncInterviewStages(appId, oldState.interviewStages, newState.interviewStages);
}

/**
 * Syncs interview stage differences to the server via individual API calls.
 */
async function syncInterviewStages(
  appId: string,
  oldStages: InterviewStage[],
  newStages: InterviewStage[],
) {
  const oldById = new Map(oldStages.map((s) => [s.id, s]));
  const newById = new Map(newStages.map((s) => [s.id, s]));

  // Delete stages that were removed
  for (const [id] of oldById) {
    if (!newById.has(id)) {
      await interviewStageService.delete(appId, id);
    }
  }

  // Create stages that were added (with original ID for undo consistency)
  for (const [id, stage] of newById) {
    if (!oldById.has(id)) {
      await interviewStageService.create(appId, {
        id: stage.id,
        name: stage.name,
        order: stage.order,
        isCompleted: stage.isCompleted,
        completedDate: stage.completedDate ?? undefined,
        notes: stage.notes ?? undefined,
        performanceRating: stage.performanceRating ?? undefined,
      });
    }
  }

  // Update stages that changed
  for (const [id, newStage] of newById) {
    const oldStage = oldById.get(id);
    if (oldStage && !stagesEqual(oldStage, newStage)) {
      await interviewStageService.update(appId, id, {
        name: newStage.name,
        order: newStage.order,
        isCompleted: newStage.isCompleted,
        completedDate: newStage.completedDate,
        notes: newStage.notes,
        performanceRating: newStage.performanceRating,
      });
    }
  }
}

function stagesEqual(a: InterviewStage, b: InterviewStage): boolean {
  return (
    a.name === b.name &&
    a.order === b.order &&
    a.isCompleted === b.isCompleted &&
    a.completedDate === b.completedDate &&
    a.notes === b.notes &&
    a.performanceRating === b.performanceRating
  );
}

/**
 * Compares two Application objects and returns only the top-level fields
 * that differ as an UpdateApplicationInput.
 */
function extractChangedFields(
  oldState: Application,
  newState: Application,
): UpdateApplicationInput {
  const fields: UpdateApplicationInput = {};
  const keys: (keyof UpdateApplicationInput)[] = [
    'companyName',
    'positionTitle',
    'dateApplied',
    'status',
    'companyUrl',
    'jobPostingUrl',
    'companyCareerUrl',
    'companyCategory',
    'skillsMatch',
    'jobSource',
    'coverLetterRequired',
    'specialRequirements',
    'salaryMin',
    'salaryMax',
    'notes',
    'offerDueDate',
  ];

  for (const key of keys) {
    const oldVal = (oldState as unknown as Record<string, unknown>)[key];
    const newVal = (newState as unknown as Record<string, unknown>)[key];
    if (oldVal !== newVal) {
      (fields as Record<string, unknown>)[key] = newVal;
    }
  }

  return fields;
}
