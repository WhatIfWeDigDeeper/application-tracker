<script lang="ts">
  import type { Application, CreateApplicationInput, UpdateApplicationInput, CompanyCategory, JobSource } from '$lib/types';
  import { ALL_CATEGORIES, ALL_SOURCES, CATEGORY_LABELS, SOURCE_LABELS } from '$lib/types';
  import RatingInput from './RatingInput.svelte';

  interface Props {
    application?: Application;
    onsubmit: (input: CreateApplicationInput | UpdateApplicationInput) => Promise<void>;
    oncancel: () => void;
  }

  let { application, onsubmit, oncancel }: Props = $props();

  // Form state
  let companyName = $state(application?.companyName || '');
  let positionTitle = $state(application?.positionTitle || '');
  let dateApplied = $state(application?.dateApplied || '');
  let companyUrl = $state(application?.companyUrl || '');
  let jobPostingUrl = $state(application?.jobPostingUrl || '');
  let companyCareerUrl = $state(application?.companyCareerUrl || '');
  let companyCategory = $state<CompanyCategory | ''>(application?.companyCategory || '');
  let skillsMatch = $state<number | null>(application?.skillsMatch ?? null);
  let jobSource = $state<JobSource | ''>(application?.jobSource || '');
  let coverLetterRequired = $state<boolean | null>(application?.coverLetterRequired ?? null);
  let specialRequirements = $state(application?.specialRequirements || '');
  let salaryMin = $state<number | ''>(application?.salaryMin ?? '');
  let salaryMax = $state<number | ''>(application?.salaryMax ?? '');
  let notes = $state(application?.notes || '');

  let submitting = $state(false);
  let error = $state<string | null>(null);

  const isEditing = $derived(!!application);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    error = null;
    submitting = true;

    try {
      if (isEditing) {
        const input: UpdateApplicationInput = {
          companyName,
          positionTitle,
          dateApplied: dateApplied || null,
          companyUrl: companyUrl || null,
          jobPostingUrl: jobPostingUrl || null,
          companyCareerUrl: companyCareerUrl || null,
          companyCategory: companyCategory || null,
          skillsMatch,
          jobSource: jobSource || null,
          coverLetterRequired,
          specialRequirements: specialRequirements || null,
          salaryMin: salaryMin === '' ? null : salaryMin,
          salaryMax: salaryMax === '' ? null : salaryMax,
          notes: notes || null,
        };
        await onsubmit(input);
      } else {
        const input: CreateApplicationInput = {
          companyName,
          positionTitle,
          dateApplied: dateApplied || undefined,
          companyUrl: companyUrl || undefined,
          jobPostingUrl: jobPostingUrl || undefined,
          companyCareerUrl: companyCareerUrl || undefined,
          companyCategory: companyCategory || undefined,
          skillsMatch: skillsMatch ?? undefined,
          jobSource: jobSource || undefined,
          coverLetterRequired: coverLetterRequired ?? undefined,
          specialRequirements: specialRequirements || undefined,
          salaryMin: salaryMin === '' ? undefined : salaryMin,
          salaryMax: salaryMax === '' ? undefined : salaryMax,
          notes: notes || undefined,
        };
        await onsubmit(input);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save application';
    } finally {
      submitting = false;
    }
  }
</script>

<form onsubmit={handleSubmit} class="space-y-6">
  {#if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md p-4 text-sm">
      {error}
    </div>
  {/if}

  <!-- Company and Position -->
  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Basic Information</h3>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="companyName" class="label mb-1">Company Name *</label>
        <input
          id="companyName"
          type="text"
          class="input"
          bind:value={companyName}
          required
          maxlength="200"
        />
      </div>

      <div>
        <label for="positionTitle" class="label mb-1">Position Title *</label>
        <input
          id="positionTitle"
          type="text"
          class="input"
          bind:value={positionTitle}
          required
          maxlength="200"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label for="dateApplied" class="label mb-1">Date Applied</label>
        <input id="dateApplied" type="date" class="input" bind:value={dateApplied} />
      </div>

      <div>
        <label for="companyCategory" class="label mb-1">Company Category</label>
        <select id="companyCategory" class="input" bind:value={companyCategory}>
          <option value="">Select industry...</option>
          {#each ALL_CATEGORIES as category}
            <option value={category}>{CATEGORY_LABELS[category]}</option>
          {/each}
        </select>
      </div>

      <div>
        <label for="jobSource" class="label mb-1">Job Source</label>
        <select id="jobSource" class="input" bind:value={jobSource}>
          <option value="">Select source...</option>
          {#each ALL_SOURCES as source}
            <option value={source}>{SOURCE_LABELS[source]}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>

  <!-- URLs -->
  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Links</h3>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label for="companyUrl" class="label mb-1">Company Website</label>
        <input
          id="companyUrl"
          type="url"
          class="input"
          bind:value={companyUrl}
          placeholder="https://..."
        />
      </div>

      <div>
        <label for="jobPostingUrl" class="label mb-1">Job Posting URL</label>
        <input
          id="jobPostingUrl"
          type="url"
          class="input"
          bind:value={jobPostingUrl}
          placeholder="https://..."
        />
      </div>

      <div>
        <label for="companyCareerUrl" class="label mb-1">Careers Page URL</label>
        <input
          id="companyCareerUrl"
          type="url"
          class="input"
          bind:value={companyCareerUrl}
          placeholder="https://..."
        />
      </div>
    </div>
  </div>

  <!-- Job Details -->
  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Job Details</h3>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="label mb-1">Skills Match</label>
        <RatingInput value={skillsMatch} onchange={(v) => (skillsMatch = v)} />
      </div>

      <div class="flex items-center gap-4">
        <label for="coverLetterRequired" class="label">Cover letter required</label>
        <input
          id="coverLetterRequired"
          type="checkbox"
          class="text-primary-600 focus:ring-primary-500 rounded"
          checked={coverLetterRequired === true}
          onchange={(e) => (coverLetterRequired = (e.target as HTMLInputElement).checked)}
        />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="salaryMin" class="label mb-1">Minimum Salary</label>
        <input
          id="salaryMin"
          type="number"
          class="input"
          bind:value={salaryMin}
          min="0"
          placeholder="e.g., 80000"
        />
      </div>

      <div>
        <label for="salaryMax" class="label mb-1">Maximum Salary</label>
        <input
          id="salaryMax"
          type="number"
          class="input"
          bind:value={salaryMax}
          min="0"
          placeholder="e.g., 120000"
        />
      </div>
    </div>

    <div>
      <label for="specialRequirements" class="label mb-1">Special Requirements</label>
      <input
        id="specialRequirements"
        type="text"
        class="input"
        bind:value={specialRequirements}
        maxlength="1000"
        placeholder="Any special requirements or qualifications..."
      />
    </div>
  </div>

  <!-- Notes -->
  <div>
    <label for="notes" class="label mb-1">General Notes</label>
    <textarea
      id="notes"
      class="input min-h-[120px]"
      bind:value={notes}
      maxlength="5000"
      placeholder="Additional notes about this application..."
    ></textarea>
  </div>

  <!-- Actions -->
  <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
    <button type="button" class="btn-secondary" onclick={oncancel} disabled={submitting}>
      Cancel
    </button>
    <button
      type="submit"
      class="btn-primary"
      disabled={submitting || !companyName.trim() || !positionTitle.trim()}
    >
      {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Application'}
    </button>
  </div>
</form>
