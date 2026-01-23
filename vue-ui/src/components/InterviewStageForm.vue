<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { InterviewStage, CreateInterviewStageInput, UpdateInterviewStageInput } from '@/types';
import RatingInput from './RatingInput.vue';

const props = defineProps<{
  stage?: InterviewStage;
  nextOrder?: number;
}>();

const emit = defineEmits<{
  save: [input: CreateInterviewStageInput | UpdateInterviewStageInput];
  cancel: [];
}>();

// Form state
const name = ref('');
const order = ref(0);
const isCompleted = ref(false);
const completedDate = ref('');
const notes = ref('');
const performanceRating = ref<number | null>(null);

// UI state
const errors = ref<Record<string, string>>({});
const isEditMode = computed(() => !!props.stage);

// Initialize form
onMounted(() => {
  if (props.stage) {
    name.value = props.stage.name;
    order.value = props.stage.order;
    isCompleted.value = props.stage.isCompleted;
    completedDate.value = props.stage.completedDate || '';
    notes.value = props.stage.notes || '';
    performanceRating.value = props.stage.performanceRating;
  } else if (props.nextOrder !== undefined) {
    order.value = props.nextOrder;
  }
});

// Validation
function validate(): boolean {
  errors.value = {};

  if (!name.value.trim()) {
    errors.value.name = 'Stage name is required';
  } else if (name.value.length > 100) {
    errors.value.name = 'Stage name must be at most 100 characters';
  }

  if (order.value < 0) {
    errors.value.order = 'Order must be at least 0';
  }

  return Object.keys(errors.value).length === 0;
}

// Submit handler
function handleSubmit() {
  if (!validate()) return;

  const input: CreateInterviewStageInput | UpdateInterviewStageInput = {
    name: name.value.trim(),
    order: order.value,
    isCompleted: isCompleted.value,
    completedDate: completedDate.value || undefined,
    notes: notes.value || undefined,
    performanceRating: performanceRating.value || undefined,
  };

  emit('save', input);
}
</script>

<template>
  <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
    <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-4">
      {{ isEditMode ? 'Edit Interview Stage' : 'Add Interview Stage' }}
    </h4>

    <form
      class="space-y-4"
      @submit.prevent="handleSubmit"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Name -->
        <div>
          <label
            for="stageName"
            class="label"
          >Stage Name *</label>
          <input
            id="stageName"
            v-model="name"
            type="text"
            class="input mt-1"
            placeholder="Phone Screen, Technical Interview..."
            :class="errors.name && 'border-red-500'"
          >
          <p
            v-if="errors.name"
            class="mt-1 text-sm text-red-600 dark:text-red-400"
          >
            {{ errors.name }}
          </p>
        </div>

        <!-- Order -->
        <div>
          <label
            for="stageOrder"
            class="label"
          >Order</label>
          <input
            id="stageOrder"
            v-model.number="order"
            type="number"
            min="0"
            class="input mt-1"
            :class="errors.order && 'border-red-500'"
          >
          <p
            v-if="errors.order"
            class="mt-1 text-sm text-red-600 dark:text-red-400"
          >
            {{ errors.order }}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Completed -->
        <div>
          <label class="flex items-center space-x-2 cursor-pointer">
            <input
              v-model="isCompleted"
              type="checkbox"
              class="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
            >
            <span class="text-sm text-gray-700 dark:text-gray-300">Stage completed</span>
          </label>
        </div>

        <!-- Completed Date -->
        <div v-if="isCompleted">
          <label
            for="completedDate"
            class="label"
          >Completed Date</label>
          <input
            id="completedDate"
            v-model="completedDate"
            type="date"
            class="input mt-1"
          >
        </div>
      </div>

      <!-- Performance Rating -->
      <div>
        <label class="label">Performance Rating (optional)</label>
        <div class="mt-1">
          <RatingInput
            v-model="performanceRating"
            allow-clear
          />
        </div>
      </div>

      <!-- Notes -->
      <div>
        <label
          for="stageNotes"
          class="label"
        >Notes</label>
        <textarea
          id="stageNotes"
          v-model="notes"
          rows="2"
          class="input mt-1"
          placeholder="Interview notes, questions asked, feedback..."
        />
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-2 pt-2">
        <button
          type="button"
          class="btn btn-secondary"
          @click="emit('cancel')"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="btn btn-primary"
        >
          {{ isEditMode ? 'Update Stage' : 'Add Stage' }}
        </button>
      </div>
    </form>
  </div>
</template>
