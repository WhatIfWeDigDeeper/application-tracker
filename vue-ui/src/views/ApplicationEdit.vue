<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useApplicationDetailStore } from '@/stores/applicationDetail';
import { useApplicationsListStore } from '@/stores/applicationsList';
import { useHistoryStore } from '@/stores/history';
import type {
  Application,
  ApplicationStatus,
  CompanyCategory,
  JobSource,
  InterviewStage,
  CreateApplicationInput,
  CreateInterviewStageInput,
  UpdateInterviewStageInput,
} from '@/types';
import { APPLICATION_STATUSES, COMPANY_CATEGORIES, JOB_SOURCES } from '@/types';
import RatingInput from '@/components/RatingInput.vue';
import UrlFieldInput from '@/components/UrlFieldInput.vue';
import InterviewStageForm from '@/components/InterviewStageForm.vue';
import InterviewStageItem from '@/components/InterviewStageItem.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import UndoRedoBar from '@/components/UndoRedoBar.vue';
import HistoryPanel from '@/components/HistoryPanel.vue';
import {
  ArrowLeftIcon,
  TrashIcon,
  ArchiveBoxIcon,
  ArchiveBoxXMarkIcon,
  PlusIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline';

const props = defineProps<{
  id?: string;
}>();

const router = useRouter();
const detailStore = useApplicationDetailStore();
const listStore = useApplicationsListStore();
const historyStore = useHistoryStore();
const { application, loading: detailLoading, error: detailError } = storeToRefs(detailStore);

const isEditMode = computed(() => !!props.id);

// ---------------------------------------------------------------------------
// Form state (individual refs)
// ---------------------------------------------------------------------------
const companyName = ref('');
const positionTitle = ref('');
const dateApplied = ref('');
const status = ref<ApplicationStatus>('unsubmitted');
const companyUrl = ref('');
const jobPostingUrl = ref('');
const companyCareerUrl = ref('');
const companyCategory = ref('');
const skillsMatch = ref<number | null>(null);
const jobSource = ref('');
const coverLetterRequired = ref(false);
const salaryMin = ref('');
const salaryMax = ref('');
const specialRequirements = ref('');
const notes = ref('');
const offerDueDate = ref('');

// ---------------------------------------------------------------------------
// UI state
// ---------------------------------------------------------------------------
const saving = ref(false);
const skipNavGuard = ref(false);
const errors = ref<Record<string, string>>({});
const showDiscardConfirm = ref(false);
const showDeleteConfirm = ref(false);
const showAddStageForm = ref(false);
const editingStage = ref<{ id: string; stage: InterviewStage } | null>(null);
const showDeleteStageConfirm = ref(false);
const stageToDelete = ref<string | null>(null);
const showHistoryPanel = ref(false);

// Local stages for create mode
const localStages = ref<InterviewStage[]>([]);

// ---------------------------------------------------------------------------
// Snapshot-based dirty tracking
// ---------------------------------------------------------------------------
function captureSnapshot(): string {
  return JSON.stringify({
    companyName: companyName.value,
    positionTitle: positionTitle.value,
    dateApplied: dateApplied.value,
    status: status.value,
    companyUrl: companyUrl.value,
    jobPostingUrl: jobPostingUrl.value,
    companyCareerUrl: companyCareerUrl.value,
    companyCategory: companyCategory.value,
    skillsMatch: skillsMatch.value,
    jobSource: jobSource.value,
    coverLetterRequired: coverLetterRequired.value,
    salaryMin: salaryMin.value,
    salaryMax: salaryMax.value,
    specialRequirements: specialRequirements.value,
    notes: notes.value,
    offerDueDate: offerDueDate.value,
  });
}

const snapshot = ref('');

const isDirty = computed(() => {
  return captureSnapshot() !== snapshot.value;
});

function recaptureSnapshot() {
  snapshot.value = captureSnapshot();
}

// ---------------------------------------------------------------------------
// Populate form from application
// ---------------------------------------------------------------------------
function populateFromApplication(app: Application) {
  companyName.value = app.companyName;
  positionTitle.value = app.positionTitle;
  dateApplied.value = app.dateApplied || '';
  status.value = app.status;
  companyUrl.value = app.companyUrl || '';
  jobPostingUrl.value = app.jobPostingUrl || '';
  companyCareerUrl.value = app.companyCareerUrl || '';
  companyCategory.value = app.companyCategory || '';
  skillsMatch.value = app.skillsMatch;
  jobSource.value = app.jobSource || '';
  coverLetterRequired.value = app.coverLetterRequired || false;
  salaryMin.value = app.salaryMin?.toString() || '';
  salaryMax.value = app.salaryMax?.toString() || '';
  specialRequirements.value = app.specialRequirements || '';
  notes.value = app.notes || '';
  offerDueDate.value = app.offerDueDate || '';
}

// ---------------------------------------------------------------------------
// Sorted stages (edit mode uses store, create mode uses localStages)
// ---------------------------------------------------------------------------
const sortedStages = computed(() => {
  if (isEditMode.value && application.value) {
    return [...application.value.interviewStages].sort((a, b) => a.order - b.order);
  }
  return [...localStages.value].sort((a, b) => a.order - b.order);
});

// ---------------------------------------------------------------------------
// Validation (reused from ApplicationFormModal)
// ---------------------------------------------------------------------------
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function validate(): boolean {
  errors.value = {};

  if (!companyName.value.trim()) {
    errors.value.companyName = 'Company name is required';
  } else if (companyName.value.length > 200) {
    errors.value.companyName = 'Company name must be at most 200 characters';
  }

  if (!positionTitle.value.trim()) {
    errors.value.positionTitle = 'Position title is required';
  } else if (positionTitle.value.length > 200) {
    errors.value.positionTitle = 'Position title must be at most 200 characters';
  }

  if (companyUrl.value && !isValidUrl(companyUrl.value)) {
    errors.value.companyUrl = 'Invalid URL';
  }

  if (jobPostingUrl.value && !isValidUrl(jobPostingUrl.value)) {
    errors.value.jobPostingUrl = 'Invalid URL';
  }

  if (companyCareerUrl.value && !isValidUrl(companyCareerUrl.value)) {
    errors.value.companyCareerUrl = 'Invalid URL';
  }

  if (salaryMin.value && isNaN(parseInt(salaryMin.value, 10))) {
    errors.value.salaryMin = 'Invalid number';
  }

  if (salaryMax.value && isNaN(parseInt(salaryMax.value, 10))) {
    errors.value.salaryMax = 'Invalid number';
  }

  if (salaryMin.value && salaryMax.value) {
    const min = parseInt(salaryMin.value, 10);
    const max = parseInt(salaryMax.value, 10);
    if (!isNaN(min) && !isNaN(max) && min > max) {
      errors.value.salaryMin = 'Minimum salary must not exceed maximum';
    }
  }

  return Object.keys(errors.value).length === 0;
}

// ---------------------------------------------------------------------------
// Build input from form state
// ---------------------------------------------------------------------------
function buildInput(): CreateApplicationInput & { status?: ApplicationStatus; offerDueDate?: string | null } {
  return {
    companyName: companyName.value.trim(),
    positionTitle: positionTitle.value.trim(),
    dateApplied: dateApplied.value || null,
    status: status.value,
    companyUrl: companyUrl.value || undefined,
    jobPostingUrl: jobPostingUrl.value || undefined,
    companyCareerUrl: companyCareerUrl.value || undefined,
    companyCategory: (companyCategory.value || undefined) as CompanyCategory | undefined,
    skillsMatch: skillsMatch.value || undefined,
    jobSource: (jobSource.value || undefined) as JobSource | undefined,
    coverLetterRequired: coverLetterRequired.value || undefined,
    salaryMin: salaryMin.value ? parseInt(salaryMin.value, 10) : undefined,
    salaryMax: salaryMax.value ? parseInt(salaryMax.value, 10) : undefined,
    specialRequirements: specialRequirements.value || undefined,
    notes: notes.value || undefined,
    offerDueDate: offerDueDate.value || null,
  };
}

// ---------------------------------------------------------------------------
// Save handlers
// ---------------------------------------------------------------------------
async function handleSave() {
  if (!validate()) return;

  saving.value = true;
  errors.value = {};

  try {
    if (isEditMode.value && application.value) {
      // Edit mode: call detailStore.updateApplication with changed fields
      const input = buildInput();
      await detailStore.updateApplication(input);
      recaptureSnapshot();
    } else {
      // Create mode: call listStore.createApplication, then create stages
      const input = buildInput();
      const created = await listStore.createApplication(input);

      if (created) {
        // Create any local stages
        for (const stage of localStages.value) {
          await fetch(`/api/applications/${created.id}/interview-stages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: stage.name,
              order: stage.order,
              isCompleted: stage.isCompleted,
              completedDate: stage.completedDate || undefined,
              notes: stage.notes || undefined,
              performanceRating: stage.performanceRating || undefined,
            }),
          });
        }

        skipNavGuard.value = true;
        router.push(`/applications/${created.id}`);
      }
    }
  } catch (err) {
    console.error('Failed to save application:', err);
    errors.value.general = err instanceof Error ? err.message : 'Failed to save application';
  } finally {
    saving.value = false;
  }
}

// ---------------------------------------------------------------------------
// Discard
// ---------------------------------------------------------------------------
function handleDiscardClick() {
  if (!isDirty.value) {
    if (isEditMode.value) {
      revertToSnapshot();
    } else {
      skipNavGuard.value = true;
      router.push('/');
    }
    return;
  }
  showDiscardConfirm.value = true;
}

function handleConfirmDiscard() {
  showDiscardConfirm.value = false;
  if (isEditMode.value) {
    revertToSnapshot();
  } else {
    skipNavGuard.value = true;
    router.push('/');
  }
}

function revertToSnapshot() {
  if (application.value) {
    populateFromApplication(application.value);
    recaptureSnapshot();
  }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------
async function handleDelete() {
  try {
    await detailStore.deleteApplication();
    skipNavGuard.value = true;
    router.push('/');
  } catch (err) {
    console.error('Failed to delete application:', err);
  }
  showDeleteConfirm.value = false;
}

// ---------------------------------------------------------------------------
// Archive / Restore
// ---------------------------------------------------------------------------
async function handleArchive() {
  try {
    await detailStore.archiveApplication();
  } catch (err) {
    console.error('Failed to archive application:', err);
  }
}

async function handleRestore() {
  try {
    await detailStore.restoreApplication();
  } catch (err) {
    console.error('Failed to restore application:', err);
  }
}

// ---------------------------------------------------------------------------
// Interview Stage handlers (edit mode: use store; create mode: use local)
// ---------------------------------------------------------------------------
async function handleAddStage(input: CreateInterviewStageInput | UpdateInterviewStageInput) {
  if (isEditMode.value) {
    try {
      await detailStore.addInterviewStage(input as CreateInterviewStageInput);
      showAddStageForm.value = false;
    } catch (err) {
      console.error('Failed to add interview stage:', err);
    }
  } else {
    // Create mode: store locally
    const stageInput = input as CreateInterviewStageInput;
    const newStage: InterviewStage = {
      id: crypto.randomUUID(),
      name: stageInput.name,
      order: stageInput.order,
      isCompleted: stageInput.isCompleted || false,
      completedDate: stageInput.completedDate || null,
      notes: stageInput.notes || null,
      performanceRating: stageInput.performanceRating || null,
    };
    localStages.value.push(newStage);
    showAddStageForm.value = false;
  }
}

async function handleUpdateStage(stageId: string, input: UpdateInterviewStageInput) {
  if (isEditMode.value) {
    try {
      await detailStore.updateInterviewStage(stageId, input);
      editingStage.value = null;
    } catch (err) {
      console.error('Failed to update interview stage:', err);
    }
  } else {
    // Create mode: update locally
    const idx = localStages.value.findIndex((s) => s.id === stageId);
    if (idx !== -1) {
      localStages.value[idx] = { ...localStages.value[idx], ...input } as InterviewStage;
    }
    editingStage.value = null;
  }
}

function handleEditStage(stageId: string) {
  const stages = isEditMode.value ? application.value?.interviewStages : localStages.value;
  const stage = stages?.find((s) => s.id === stageId);
  if (stage) {
    editingStage.value = { id: stageId, stage };
  }
}

function handleDeleteStageRequest(stageId: string) {
  stageToDelete.value = stageId;
  showDeleteStageConfirm.value = true;
}

async function handleConfirmDeleteStage() {
  if (stageToDelete.value) {
    if (isEditMode.value) {
      try {
        await detailStore.deleteInterviewStage(stageToDelete.value);
      } catch (err) {
        console.error('Failed to delete interview stage:', err);
      }
    } else {
      // Create mode: remove locally
      localStages.value = localStages.value.filter((s) => s.id !== stageToDelete.value);
    }
  }
  showDeleteStageConfirm.value = false;
  stageToDelete.value = null;
}

async function handleToggleStageComplete(stageId: string) {
  if (isEditMode.value) {
    try {
      await detailStore.toggleStageCompletion(stageId);
    } catch (err) {
      console.error('Failed to toggle stage completion:', err);
    }
  } else {
    // Create mode: toggle locally
    const idx = localStages.value.findIndex((s) => s.id === stageId);
    if (idx !== -1) {
      const stage = localStages.value[idx];
      const newIsCompleted = !stage.isCompleted;
      localStages.value[idx] = {
        ...stage,
        isCompleted: newIsCompleted,
        completedDate: newIsCompleted ? new Date().toISOString().split('T')[0] : null,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Undo/redo keyboard shortcuts (edit mode only)
// ---------------------------------------------------------------------------
function handleKeyDown(e: KeyboardEvent) {
  if (!isEditMode.value || !props.id) return;
  const isCtrlOrCmd = e.ctrlKey || e.metaKey;
  if (isCtrlOrCmd && e.key === 'z' && !e.shiftKey) {
    e.preventDefault();
    historyStore.undo(props.id);
  } else if (isCtrlOrCmd && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
    e.preventDefault();
    historyStore.redo(props.id);
  }
}

// ---------------------------------------------------------------------------
// Watch status for date↔status logic
// ---------------------------------------------------------------------------
watch(status, (newStatus, oldStatus) => {
  if (newStatus === 'unsubmitted') {
    dateApplied.value = '';
  } else if (oldStatus === 'unsubmitted' && !dateApplied.value) {
    dateApplied.value = new Date().toISOString().split('T')[0];
  }
});

// ---------------------------------------------------------------------------
// Watch detailStore.application for undo/redo sync
// ---------------------------------------------------------------------------
watch(
  () => detailStore.application,
  (newApp) => {
    if (newApp && detailStore.isUndoRedoInProgress) {
      populateFromApplication(newApp);
      recaptureSnapshot();
    }
  },
);

// ---------------------------------------------------------------------------
// Navigation guard
// ---------------------------------------------------------------------------
onBeforeRouteLeave((_to, _from, next) => {
  if (skipNavGuard.value) {
    next();
    return;
  }
  if (isDirty.value) {
    const leave = window.confirm('You have unsaved changes. Are you sure you want to leave?');
    if (!leave) {
      next(false);
      return;
    }
  }
  next();
});

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
async function loadApplication() {
  if (isEditMode.value && props.id) {
    skipNavGuard.value = false;
    await detailStore.fetchApplication(props.id);
    historyStore.loadHistory(props.id);

    if (application.value) {
      populateFromApplication(application.value);
    }
  }

  recaptureSnapshot();
}

// Re-load when navigating from /applications/new → /applications/:id
// (Vue Router reuses the component, so onMounted won't re-fire)
watch(
  () => props.id,
  async (newId, oldId) => {
    if (newId && newId !== oldId) {
      await loadApplication();
    }
  },
);

onMounted(async () => {
  await loadApplication();
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <div>
    <!-- Loading State (edit mode) -->
    <div
      v-if="isEditMode && detailLoading && !application"
      class="flex justify-center py-12"
    >
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>

    <!-- Error State (edit mode) -->
    <div
      v-else-if="isEditMode && detailError"
      class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400"
    >
      {{ detailError }}
      <button
        type="button"
        class="mt-2 text-primary-600 dark:text-primary-400 hover:underline"
        @click="router.push('/')"
      >
        Go back to list
      </button>
    </div>

    <!-- Main Content -->
    <div
      v-else
      class="space-y-6"
    >
      <!-- Header area -->
      <div class="flex items-center justify-between">
        <!-- Left: Back to list -->
        <router-link
          to="/"
          class="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeftIcon class="h-5 w-5 mr-1" />
          Back to List
        </router-link>

        <!-- Right: Action buttons -->
        <div class="flex items-center space-x-2">
          <!-- Save -->
          <button
            type="button"
            class="btn btn-primary"
            :disabled="saving || (isEditMode && !isDirty)"
            @click="handleSave"
          >
            {{ saving ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Application') }}
          </button>

          <!-- Discard -->
          <button
            v-if="isDirty"
            type="button"
            class="btn btn-secondary"
            :disabled="saving"
            @click="handleDiscardClick"
          >
            Discard
          </button>

          <!-- Archive / Restore (edit mode only) -->
          <template v-if="isEditMode && application">
            <button
              v-if="!application.isArchived"
              type="button"
              class="btn btn-secondary flex items-center"
              @click="handleArchive"
            >
              <ArchiveBoxIcon class="h-4 w-4 mr-1" />
              Archive
            </button>
            <button
              v-else
              type="button"
              class="btn btn-secondary flex items-center"
              @click="handleRestore"
            >
              <ArchiveBoxXMarkIcon class="h-4 w-4 mr-1" />
              Restore
            </button>

            <!-- Delete -->
            <button
              type="button"
              class="btn btn-danger flex items-center"
              @click="showDeleteConfirm = true"
            >
              <TrashIcon class="h-4 w-4 mr-1" />
              Delete
            </button>
          </template>
        </div>
      </div>

      <!-- Undo/Redo bar + History toggle (edit mode only) -->
      <div
        v-if="isEditMode && id"
        class="flex items-center justify-between"
      >
        <UndoRedoBar :application-id="id" />
        <button
          type="button"
          class="btn btn-secondary flex items-center"
          @click="showHistoryPanel = !showHistoryPanel"
        >
          <ClockIcon class="h-4 w-4 mr-1" />
          History
        </button>
      </div>

      <!-- Error summary -->
      <div
        v-if="errors.general"
        class="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400"
      >
        {{ errors.general }}
      </div>

      <!-- Main card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <!-- Company Name (large) -->
        <div class="mb-4">
          <input
            id="companyName"
            v-model="companyName"
            type="text"
            class="input text-xl font-semibold"
            :class="errors.companyName && 'border-red-500'"
            placeholder="Company Name *"
          >
          <p
            v-if="errors.companyName"
            class="mt-1 text-sm text-red-600 dark:text-red-400"
          >
            {{ errors.companyName }}
          </p>
        </div>

        <!-- Position Title -->
        <div class="mb-4">
          <input
            id="positionTitle"
            v-model="positionTitle"
            type="text"
            class="input"
            :class="errors.positionTitle && 'border-red-500'"
            placeholder="Position Title *"
          >
          <p
            v-if="errors.positionTitle"
            class="mt-1 text-sm text-red-600 dark:text-red-400"
          >
            {{ errors.positionTitle }}
          </p>
        </div>

        <!-- Date Applied | Status -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label
              for="dateApplied"
              class="label"
            >Date Applied</label>
            <input
              id="dateApplied"
              v-model="dateApplied"
              type="date"
              class="input mt-1"
              :disabled="status === 'unsubmitted'"
            >
          </div>

          <div>
            <label
              for="status"
              class="label"
            >Status</label>
            <select
              id="status"
              v-model="status"
              class="input mt-1"
            >
              <option
                v-for="s in APPLICATION_STATUSES"
                :key="s.value"
                :value="s.value"
              >
                {{ s.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Two-column grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Left column: Company Info -->
          <div class="space-y-4">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Company Info
            </h3>

            <!-- Company Category -->
            <div>
              <label
                for="companyCategory"
                class="label"
              >Company Category</label>
              <select
                id="companyCategory"
                v-model="companyCategory"
                class="input mt-1"
              >
                <option value="">
                  Select category
                </option>
                <option
                  v-for="category in COMPANY_CATEGORIES"
                  :key="category.value"
                  :value="category.value"
                >
                  {{ category.label }}
                </option>
              </select>
            </div>

            <!-- Company Website -->
            <UrlFieldInput
              v-model="companyUrl"
              label="Company Website"
              placeholder="https://example.com"
              :error="errors.companyUrl"
            />

            <!-- Career Page URL -->
            <UrlFieldInput
              v-model="companyCareerUrl"
              label="Career Page URL"
              placeholder="https://example.com/careers"
              :error="errors.companyCareerUrl"
            />

            <!-- Job Posting URL -->
            <UrlFieldInput
              v-model="jobPostingUrl"
              label="Job Posting URL"
              placeholder="https://linkedin.com/jobs/..."
              :error="errors.jobPostingUrl"
            />
          </div>

          <!-- Right column: Application Details -->
          <div class="space-y-4">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Application Details
            </h3>

            <!-- Job Source -->
            <div>
              <label
                for="jobSource"
                class="label"
              >Job Source</label>
              <select
                id="jobSource"
                v-model="jobSource"
                class="input mt-1"
              >
                <option value="">
                  Select source
                </option>
                <option
                  v-for="source in JOB_SOURCES"
                  :key="source.value"
                  :value="source.value"
                >
                  {{ source.label }}
                </option>
              </select>
            </div>

            <!-- Skills Match -->
            <div>
              <label class="label">Skills Match</label>
              <div class="mt-1">
                <RatingInput
                  v-model="skillsMatch"
                  allow-clear
                />
              </div>
            </div>

            <!-- Salary range -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label
                  for="salaryMin"
                  class="label"
                >Min Salary</label>
                <input
                  id="salaryMin"
                  v-model="salaryMin"
                  type="number"
                  class="input mt-1"
                  placeholder="180000"
                  :class="errors.salaryMin && 'border-red-500'"
                >
                <p
                  v-if="errors.salaryMin"
                  class="mt-1 text-sm text-red-600 dark:text-red-400"
                >
                  {{ errors.salaryMin }}
                </p>
              </div>

              <div>
                <label
                  for="salaryMax"
                  class="label"
                >Max Salary</label>
                <input
                  id="salaryMax"
                  v-model="salaryMax"
                  type="number"
                  class="input mt-1"
                  placeholder="235000"
                  :class="errors.salaryMax && 'border-red-500'"
                >
                <p
                  v-if="errors.salaryMax"
                  class="mt-1 text-sm text-red-600 dark:text-red-400"
                >
                  {{ errors.salaryMax }}
                </p>
              </div>
            </div>

            <!-- Cover Letter Required -->
            <div>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  v-model="coverLetterRequired"
                  type="checkbox"
                  class="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                >
                <span class="text-sm text-gray-700 dark:text-gray-300">Cover letter required</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Full-width fields below the grid -->
        <div class="mt-6 space-y-4">
          <!-- Special Requirements -->
          <div>
            <label
              for="specialRequirements"
              class="label"
            >Special Requirements</label>
            <textarea
              id="specialRequirements"
              v-model="specialRequirements"
              rows="3"
              class="input mt-1"
              placeholder="Portfolio required, specific skills..."
            />
          </div>

          <!-- Notes -->
          <div>
            <label
              for="notes"
              class="label"
            >Notes</label>
            <textarea
              id="notes"
              v-model="notes"
              rows="4"
              class="input mt-1"
              placeholder="Referral info, interview prep notes..."
            />
          </div>

          <!-- Offer Due Date (only when status is 'given offer') -->
          <div v-if="status === 'given offer'">
            <label
              for="offerDueDate"
              class="label"
            >Offer Due Date</label>
            <input
              id="offerDueDate"
              v-model="offerDueDate"
              type="date"
              class="input mt-1"
            >
          </div>
        </div>
      </div>

      <!-- Interview Stages card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Interview Stages
          </h2>
          <button
            type="button"
            class="btn btn-primary flex items-center"
            @click="showAddStageForm = true"
          >
            <PlusIcon class="h-4 w-4 mr-1" />
            Add Stage
          </button>
        </div>

        <!-- Add Stage Form -->
        <InterviewStageForm
          v-if="showAddStageForm"
          :next-order="sortedStages.length"
          @save="handleAddStage"
          @cancel="showAddStageForm = false"
        />

        <!-- Stage List -->
        <div
          v-if="sortedStages.length > 0"
          class="space-y-3 mt-4"
        >
          <template
            v-for="stage in sortedStages"
            :key="stage.id"
          >
            <!-- Edit Form -->
            <InterviewStageForm
              v-if="editingStage?.id === stage.id"
              :stage="stage"
              @save="(input) => handleUpdateStage(stage.id, input)"
              @cancel="editingStage = null"
            />
            <!-- Stage Item -->
            <InterviewStageItem
              v-else
              :stage="stage"
              @toggle-complete="handleToggleStageComplete(stage.id)"
              @edit="handleEditStage(stage.id)"
              @delete="handleDeleteStageRequest(stage.id)"
            />
          </template>
        </div>

        <p
          v-else-if="!showAddStageForm"
          class="text-gray-500 dark:text-gray-400 text-center py-6"
        >
          No interview stages added yet.
        </p>
      </div>
    </div>

    <!-- Discard Confirmation Dialog -->
    <ConfirmDialog
      v-if="showDiscardConfirm"
      title="Discard changes?"
      message="You have unsaved changes. Are you sure you want to discard them?"
      confirm-label="Discard"
      :is-destructive="true"
      @confirm="handleConfirmDiscard"
      @cancel="showDiscardConfirm = false"
    />

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-if="showDeleteConfirm"
      title="Delete Application"
      message="Are you sure you want to delete this application? This action cannot be undone and all interview stages will be deleted."
      confirm-label="Delete"
      :is-destructive="true"
      @confirm="handleDelete"
      @cancel="showDeleteConfirm = false"
    />

    <!-- Delete Stage Confirmation Dialog -->
    <ConfirmDialog
      v-if="showDeleteStageConfirm"
      title="Delete Interview Stage"
      message="Are you sure you want to delete this interview stage?"
      confirm-label="Delete"
      :is-destructive="true"
      @confirm="handleConfirmDeleteStage"
      @cancel="showDeleteStageConfirm = false; stageToDelete = null"
    />

    <!-- History Panel (edit mode only) -->
    <HistoryPanel
      v-if="showHistoryPanel && isEditMode && id && application"
      :application-id="id"
      @close="showHistoryPanel = false"
      @restored="populateFromApplication(application!); recaptureSnapshot()"
    />
  </div>
</template>
