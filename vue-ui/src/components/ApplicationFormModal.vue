<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import type { Application, CreateApplicationInput, ApplicationStatus, CompanyCategory, JobSource } from '@/types';
import { APPLICATION_STATUSES, COMPANY_CATEGORIES, JOB_SOURCES } from '@/types';
import { useApplicationDetailStore } from '@/stores/applicationDetail';
import { useApplicationsListStore } from '@/stores/applicationsList';
import RatingInput from './RatingInput.vue';
import ConfirmDialog from './ConfirmDialog.vue';

const props = defineProps<{
  application?: Application;
}>();

const emit = defineEmits<{
  close: [];
  saved: [application: Application];
}>();

// Form state
const companyName = ref('');
const positionTitle = ref('');
const dateApplied = ref('');
const status = ref<ApplicationStatus>('applied');
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

// UI state
const loading = ref(false);
const errors = ref<Record<string, string>>({});
const isDirty = ref(false);
const showCancelConfirm = ref(false);

const isEditMode = computed(() => !!props.application);

// Initialize form with existing data
function initializeForm() {
  if (props.application) {
    companyName.value = props.application.companyName;
    positionTitle.value = props.application.positionTitle;
    dateApplied.value = props.application.dateApplied;
    status.value = props.application.status;
    companyUrl.value = props.application.companyUrl || '';
    jobPostingUrl.value = props.application.jobPostingUrl || '';
    companyCareerUrl.value = props.application.companyCareerUrl || '';
    companyCategory.value = props.application.companyCategory || '';
    skillsMatch.value = props.application.skillsMatch;
    jobSource.value = props.application.jobSource || '';
    coverLetterRequired.value = props.application.coverLetterRequired || false;
    salaryMin.value = props.application.salaryMin?.toString() || '';
    salaryMax.value = props.application.salaryMax?.toString() || '';
    specialRequirements.value = props.application.specialRequirements || '';
    notes.value = props.application.notes || '';
  } else {
    // Default to today's date for new applications
    dateApplied.value = new Date().toISOString().split('T')[0];
  }
}

// Watch for changes to mark form as dirty
watch(
  [companyName, positionTitle, dateApplied, status, companyUrl, jobPostingUrl, companyCareerUrl, companyCategory, skillsMatch, jobSource, coverLetterRequired, salaryMin, salaryMax, specialRequirements, notes],
  () => {
    isDirty.value = true;
  },
  { deep: true }
);

// Validation
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

  return Object.keys(errors.value).length === 0;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Submit handler
async function handleSubmit() {
  if (!validate()) return;

  loading.value = true;

  try {
    const input: CreateApplicationInput & { status?: ApplicationStatus } = {
      companyName: companyName.value.trim(),
      positionTitle: positionTitle.value.trim(),
      dateApplied: dateApplied.value || undefined,
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
    };

    let result: Application | undefined;

    if (isEditMode.value && props.application) {
      input.status = status.value;
      const detailStore = useApplicationDetailStore();
      result = await detailStore.updateApplication(input);
    } else {
      const listStore = useApplicationsListStore();
      result = await listStore.createApplication(input);
    }

    if (result) {
      emit('saved', result);
    }
  } catch (err) {
    console.error('Failed to save application:', err);
    errors.value.general = err instanceof Error ? err.message : 'Failed to save application';
  } finally {
    loading.value = false;
  }
}

// Close handlers
function handleClose() {
  if (isDirty.value) {
    showCancelConfirm.value = true;
  } else {
    emit('close');
  }
}

function handleConfirmClose() {
  showCancelConfirm.value = false;
  emit('close');
}

// Keyboard handler
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    handleClose();
  }
}

onMounted(async () => {
  initializeForm();
  await nextTick();
  isDirty.value = false;
  document.addEventListener('keydown', handleKeyDown);
  document.body.style.overflow = 'hidden';
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ isEditMode ? 'Edit Application' : 'Add New Application' }}
          </h2>
          <button
            type="button"
            class="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            @click="handleClose"
          >
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>

        <!-- Form -->
        <form
          class="flex-1 overflow-y-auto p-6"
          @submit.prevent="handleSubmit"
        >
          <!-- Error summary -->
          <div
            v-if="errors.general"
            class="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400"
          >
            {{ errors.general }}
          </div>

          <!-- Required Fields -->
          <div class="space-y-4 mb-6">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Required Fields
            </h3>

            <div>
              <label
                for="companyName"
                class="label"
              >Company Name *</label>
              <input
                id="companyName"
                v-model="companyName"
                type="text"
                class="input mt-1"
                :class="errors.companyName && 'border-red-500'"
              >
              <p
                v-if="errors.companyName"
                class="mt-1 text-sm text-red-600 dark:text-red-400"
              >
                {{ errors.companyName }}
              </p>
            </div>

            <div>
              <label
                for="positionTitle"
                class="label"
              >Position Title *</label>
              <input
                id="positionTitle"
                v-model="positionTitle"
                type="text"
                class="input mt-1"
                :class="errors.positionTitle && 'border-red-500'"
              >
              <p
                v-if="errors.positionTitle"
                class="mt-1 text-sm text-red-600 dark:text-red-400"
              >
                {{ errors.positionTitle }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-4">
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
                >
              </div>

              <div v-if="isEditMode">
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
          </div>

          <!-- Company Details -->
          <div class="space-y-4 mb-6">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Company Details
            </h3>

            <div>
              <label
                for="companyUrl"
                class="label"
              >Company Website</label>
              <input
                id="companyUrl"
                v-model="companyUrl"
                type="url"
                class="input mt-1"
                placeholder="https://example.com"
                :class="errors.companyUrl && 'border-red-500'"
              >
              <p
                v-if="errors.companyUrl"
                class="mt-1 text-sm text-red-600 dark:text-red-400"
              >
                {{ errors.companyUrl }}
              </p>
            </div>

            <div>
              <label
                for="companyCareerUrl"
                class="label"
              >Career Page URL</label>
              <input
                id="companyCareerUrl"
                v-model="companyCareerUrl"
                type="url"
                class="input mt-1"
                placeholder="https://example.com/careers"
                :class="errors.companyCareerUrl && 'border-red-500'"
              >
            </div>

            <div>
              <label
                for="jobPostingUrl"
                class="label"
              >Job Posting URL</label>
              <input
                id="jobPostingUrl"
                v-model="jobPostingUrl"
                type="url"
                class="input mt-1"
                placeholder="https://linkedin.com/jobs/..."
                :class="errors.jobPostingUrl && 'border-red-500'"
              >
            </div>

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
          </div>

          <!-- Application Details -->
          <div class="space-y-4 mb-6">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Application Details
            </h3>

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

            <div>
              <label class="label">Skills Match</label>
              <div class="mt-1">
                <RatingInput
                  v-model="skillsMatch"
                  allow-clear
                />
              </div>
            </div>

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

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label
                  for="salaryMin"
                  class="label"
                >Minimum Salary</label>
                <input
                  id="salaryMin"
                  v-model="salaryMin"
                  type="number"
                  class="input mt-1"
                  placeholder="120000"
                  :class="errors.salaryMin && 'border-red-500'"
                >
              </div>

              <div>
                <label
                  for="salaryMax"
                  class="label"
                >Maximum Salary</label>
                <input
                  id="salaryMax"
                  v-model="salaryMax"
                  type="number"
                  class="input mt-1"
                  placeholder="150000"
                  :class="errors.salaryMax && 'border-red-500'"
                >
              </div>
            </div>
          </div>

          <!-- Additional Info -->
          <div class="space-y-4">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Additional Info
            </h3>

            <div>
              <label
                for="specialRequirements"
                class="label"
              >Special Requirements</label>
              <textarea
                id="specialRequirements"
                v-model="specialRequirements"
                rows="2"
                class="input mt-1"
                placeholder="Portfolio required, specific skills..."
              />
            </div>

            <div>
              <label
                for="notes"
                class="label"
              >General Notes</label>
              <textarea
                id="notes"
                v-model="notes"
                rows="3"
                class="input mt-1"
                placeholder="Referral info, interview prep notes..."
              />
            </div>
          </div>
        </form>

        <!-- Footer -->
        <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            type="button"
            class="btn btn-secondary"
            :disabled="loading"
            @click="handleClose"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="loading"
            @click="handleSubmit"
          >
            {{ loading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Add Application') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Cancel Confirmation -->
    <ConfirmDialog
      v-if="showCancelConfirm"
      title="Discard changes?"
      message="You have unsaved changes. Are you sure you want to discard them?"
      confirm-label="Discard"
      :is-destructive="true"
      @confirm="handleConfirmClose"
      @cancel="showCancelConfirm = false"
    />
  </Teleport>
</template>
