<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useApplication } from '@/composables/useApplication';
import StatusBadge from '@/components/StatusBadge.vue';
import RatingDisplay from '@/components/RatingDisplay.vue';
import InterviewStageItem from '@/components/InterviewStageItem.vue';
import InterviewStageForm from '@/components/InterviewStageForm.vue';
import ApplicationFormModal from '@/components/ApplicationFormModal.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  ArchiveBoxIcon,
  ArchiveBoxXMarkIcon,
  PlusIcon,
  LinkIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  TagIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/vue/24/outline';
import type { InterviewStage, CreateInterviewStageInput, UpdateInterviewStageInput } from '@/types';
import { COMPANY_CATEGORIES, JOB_SOURCES } from '@/types';

const props = defineProps<{
  id: string;
}>();

const router = useRouter();
const {
  application,
  loading,
  error,
  fetchApplication,
  deleteApplication,
  archiveApplication,
  restoreApplication,
  addInterviewStage,
  updateInterviewStage,
  deleteInterviewStage,
  toggleStageCompletion,
} = useApplication();

// UI State
const showEditModal = ref(false);
const showDeleteConfirm = ref(false);
const showAddStageForm = ref(false);
const editingStage = ref<{ id: string; stage: InterviewStage } | null>(null);
const showDeleteStageConfirm = ref(false);
const stageToDelete = ref<string | null>(null);

// Computed values
const categoryLabel = computed(() => {
  if (!application.value?.companyCategory) return null;
  return COMPANY_CATEGORIES.find((c) => c.value === application.value?.companyCategory)?.label;
});

const sourceLabel = computed(() => {
  if (!application.value?.jobSource) return null;
  return JOB_SOURCES.find((s) => s.value === application.value?.jobSource)?.label;
});

const salaryRange = computed(() => {
  if (!application.value) return null;
  const { salaryMin, salaryMax } = application.value;
  if (!salaryMin && !salaryMax) return null;
  if (salaryMin && salaryMax) {
    return `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()}`;
  }
  if (salaryMin) return `$${salaryMin.toLocaleString()}+`;
  return `Up to $${salaryMax?.toLocaleString()}`;
});

const offerDueInfo = computed(() => {
  if (!application.value || application.value.status !== 'given offer' || !application.value.offerDueDate) {
    return null;
  }

  const dueDate = new Date(application.value.offerDueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: 'Overdue', isOverdue: true, isUrgent: true };
  } else if (diffDays === 0) {
    return { text: 'Due today', isOverdue: false, isUrgent: true };
  } else if (diffDays <= 3) {
    return { text: `Due in ${diffDays} days`, isOverdue: false, isUrgent: true };
  } else {
    return { text: `Due: ${formatDate(application.value.offerDueDate)}`, isOverdue: false, isUrgent: false };
  }
});

const sortedStages = computed(() => {
  if (!application.value) return [];
  return [...application.value.interviewStages].sort((a, b) => a.order - b.order);
});

// Lifecycle
onMounted(() => {
  fetchApplication(props.id);
});

// Methods
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function goBack() {
  router.push('/');
}

function handleEditSaved() {
  showEditModal.value = false;
  // The application ref is already updated by the composable
}

async function handleDelete() {
  try {
    await deleteApplication();
    router.push('/');
  } catch (err) {
    console.error('Failed to delete application:', err);
  }
  showDeleteConfirm.value = false;
}

async function handleArchive() {
  try {
    await archiveApplication();
  } catch (err) {
    console.error('Failed to archive application:', err);
  }
}

async function handleRestore() {
  try {
    await restoreApplication();
  } catch (err) {
    console.error('Failed to restore application:', err);
  }
}

// Interview Stage handlers
async function handleAddStage(input: CreateInterviewStageInput | UpdateInterviewStageInput) {
  try {
    await addInterviewStage(input as CreateInterviewStageInput);
    showAddStageForm.value = false;
  } catch (err) {
    console.error('Failed to add interview stage:', err);
  }
}

async function handleUpdateStage(stageId: string, input: UpdateInterviewStageInput) {
  try {
    await updateInterviewStage(stageId, input);
    editingStage.value = null;
  } catch (err) {
    console.error('Failed to update interview stage:', err);
  }
}

function handleEditStage(stageId: string) {
  const stage = application.value?.interviewStages.find((s) => s.id === stageId);
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
    try {
      await deleteInterviewStage(stageToDelete.value);
    } catch (err) {
      console.error('Failed to delete interview stage:', err);
    }
  }
  showDeleteStageConfirm.value = false;
  stageToDelete.value = null;
}

async function handleToggleStageComplete(stageId: string) {
  try {
    await toggleStageCompletion(stageId);
  } catch (err) {
    console.error('Failed to toggle stage completion:', err);
  }
}
</script>

<template>
  <div>
    <!-- Loading State -->
    <div
      v-if="loading && !application"
      class="flex justify-center py-12"
    >
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400"
    >
      {{ error }}
      <button
        type="button"
        class="mt-2 text-primary-600 dark:text-primary-400 hover:underline"
        @click="goBack"
      >
        Go back to list
      </button>
    </div>

    <!-- Application Detail -->
    <div
      v-else-if="application"
      class="space-y-6"
    >
      <!-- Back Button and Actions -->
      <div class="flex items-center justify-between">
        <button
          type="button"
          class="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          @click="goBack"
        >
          <ArrowLeftIcon class="h-5 w-5 mr-1" />
          Back to List
        </button>

        <div class="flex items-center space-x-2">
          <button
            type="button"
            class="btn btn-secondary flex items-center"
            @click="showEditModal = true"
          >
            <PencilIcon class="h-4 w-4 mr-1" />
            Edit
          </button>

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

          <button
            type="button"
            class="btn btn-danger flex items-center"
            @click="showDeleteConfirm = true"
          >
            <TrashIcon class="h-4 w-4 mr-1" />
            Delete
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="card p-6">
        <!-- Header -->
        <div class="flex items-start justify-between mb-6">
          <div>
            <div class="flex items-center space-x-3">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ application.companyName }}
              </h1>
              <StatusBadge :status="application.status" />
              <span
                v-if="application.isArchived"
                class="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300"
              >
                Archived
              </span>
            </div>
            <p class="text-lg text-gray-600 dark:text-gray-400 mt-1">
              {{ application.positionTitle }}
            </p>
          </div>

          <div class="text-right text-sm text-gray-500 dark:text-gray-400">
            <p>Applied: {{ formatDate(application.dateApplied) }}</p>
            <p>Updated: {{ formatDate(application.updatedAt) }}</p>
          </div>
        </div>

        <!-- Offer Due Date Alert -->
        <div
          v-if="offerDueInfo"
          :class="[
            'mb-6 p-4 rounded-lg flex items-center',
            offerDueInfo.isOverdue
              ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              : offerDueInfo.isUrgent
                ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
          ]"
        >
          <CalendarIcon class="h-5 w-5 mr-2" />
          Offer Decision: {{ offerDueInfo.text }}
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <!-- Company Info -->
          <div class="space-y-4">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Company Info
            </h3>

            <div
              v-if="categoryLabel"
              class="flex items-center text-gray-700 dark:text-gray-300"
            >
              <TagIcon class="h-5 w-5 mr-2 text-gray-400" />
              {{ categoryLabel }}
            </div>

            <div
              v-if="application.companyUrl"
              class="flex items-center"
            >
              <LinkIcon class="h-5 w-5 mr-2 text-gray-400" />
              <a
                :href="application.companyUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary-600 dark:text-primary-400 hover:underline"
              >
                Company Website
              </a>
            </div>

            <div
              v-if="application.companyCareerUrl"
              class="flex items-center"
            >
              <LinkIcon class="h-5 w-5 mr-2 text-gray-400" />
              <a
                :href="application.companyCareerUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary-600 dark:text-primary-400 hover:underline"
              >
                Career Page
              </a>
            </div>

            <div
              v-if="application.jobPostingUrl"
              class="flex items-center"
            >
              <LinkIcon class="h-5 w-5 mr-2 text-gray-400" />
              <a
                :href="application.jobPostingUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary-600 dark:text-primary-400 hover:underline"
              >
                Job Posting
              </a>
            </div>
          </div>

          <!-- Application Details -->
          <div class="space-y-4">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Application Details
            </h3>

            <div
              v-if="sourceLabel"
              class="flex items-center text-gray-700 dark:text-gray-300"
            >
              <ClipboardDocumentListIcon class="h-5 w-5 mr-2 text-gray-400" />
              Source: {{ sourceLabel }}
            </div>

            <div
              v-if="application.skillsMatch"
              class="flex items-center text-gray-700 dark:text-gray-300"
            >
              <span class="mr-2 text-gray-600 dark:text-gray-400">Skills Match:</span>
              <RatingDisplay
                :value="application.skillsMatch"
                show-numeric
              />
            </div>

            <div
              v-if="salaryRange"
              class="flex items-center text-gray-700 dark:text-gray-300"
            >
              <CurrencyDollarIcon class="h-5 w-5 mr-2 text-gray-400" />
              {{ salaryRange }}
            </div>

            <div
              v-if="application.coverLetterRequired"
              class="flex items-center text-gray-700 dark:text-gray-300"
            >
              <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                Cover Letter Required
              </span>
            </div>
          </div>
        </div>

        <!-- Special Requirements -->
        <div
          v-if="application.specialRequirements"
          class="mb-6"
        >
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Special Requirements
          </h3>
          <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {{ application.specialRequirements }}
          </p>
        </div>

        <!-- Notes -->
        <div
          v-if="application.notes"
          class="mb-6"
        >
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Notes
          </h3>
          <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {{ application.notes }}
          </p>
        </div>
      </div>

      <!-- Interview Stages -->
      <div class="card p-6">
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

    <!-- Edit Application Modal -->
    <ApplicationFormModal
      v-if="showEditModal && application"
      :application="application"
      @close="showEditModal = false"
      @saved="handleEditSaved"
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
  </div>
</template>
