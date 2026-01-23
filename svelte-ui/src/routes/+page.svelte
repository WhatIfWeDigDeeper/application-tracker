<script lang="ts">
  import { onMount } from 'svelte';
  import type { Application, CreateApplicationInput } from '$lib/types';
  import { applicationStore } from '$lib/stores/applications.svelte';
  import { api } from '$lib/stores/api';
  import ApplicationCard from '$lib/components/ApplicationCard.svelte';
  import FilterBar from '$lib/components/FilterBar.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import ApplicationForm from '$lib/components/ApplicationForm.svelte';
  import ApplicationDetail from '$lib/components/ApplicationDetail.svelte';

  let showCreateForm = $state(false);
  let selectedApplication = $state<Application | null>(null);
  let deleteTarget = $state<Application | null>(null);
  let loadError = $state<string | null>(null);

  onMount(() => {
    loadApplications();
  });

  async function loadApplications() {
    loadError = null;
    try {
      await applicationStore.load();
    } catch (e) {
      loadError = e instanceof Error ? e.message : 'Failed to load applications';
    }
  }

  // Watch for filter changes
  $effect(() => {
    // Access filters to track them
    const _ = applicationStore.filters;
    loadApplications();
  });

  async function handleCreate(input: CreateApplicationInput) {
    await applicationStore.create(input);
    showCreateForm = false;
  }

  async function handleUpdate(input: Parameters<typeof applicationStore.update>[1]) {
    if (!selectedApplication) return;
    const updated = await applicationStore.update(selectedApplication.id, input);
    selectedApplication = updated;
  }

  async function handleAddStage(input: Parameters<typeof api.createInterviewStage>[1]) {
    if (!selectedApplication) return;
    const stage = await api.createInterviewStage(selectedApplication.id, input);
    selectedApplication = {
      ...selectedApplication,
      interviewStages: [...selectedApplication.interviewStages, stage],
    };
    // Update the list as well
    await loadApplications();
  }

  async function handleUpdateStage(stageId: string, input: Parameters<typeof api.updateInterviewStage>[2]) {
    if (!selectedApplication) return;
    const updated = await api.updateInterviewStage(selectedApplication.id, stageId, input);
    selectedApplication = {
      ...selectedApplication,
      interviewStages: selectedApplication.interviewStages.map((s) => (s.id === stageId ? updated : s)),
    };
  }

  async function handleRemoveStage(stageId: string) {
    if (!selectedApplication) return;
    await api.deleteInterviewStage(selectedApplication.id, stageId);
    selectedApplication = {
      ...selectedApplication,
      interviewStages: selectedApplication.interviewStages.filter((s) => s.id !== stageId),
    };
  }

  async function handleArchive(app: Application) {
    if (app.isArchived) {
      const restored = await applicationStore.restore(app.id);
      if (selectedApplication?.id === app.id) {
        selectedApplication = restored;
      }
    } else {
      const archived = await applicationStore.archive(app.id);
      if (selectedApplication?.id === app.id) {
        selectedApplication = archived;
      }
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await applicationStore.remove(deleteTarget.id);
    if (selectedApplication?.id === deleteTarget.id) {
      selectedApplication = null;
    }
    deleteTarget = null;
  }

  async function handleDetailArchive() {
    if (!selectedApplication) return;
    await handleArchive(selectedApplication);
  }

  async function handleDetailDelete() {
    if (!selectedApplication) return;
    await applicationStore.remove(selectedApplication.id);
    selectedApplication = null;
  }
</script>

<svelte:head>
  <title>Job Application Tracker</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Applications</h1>
    <button type="button" class="btn-primary" onclick={() => (showCreateForm = true)}>
      <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      New Application
    </button>
  </div>

  <!-- Filters -->
  <FilterBar
    filters={applicationStore.filters}
    resultCount={applicationStore.applications.length}
    totalCount={applicationStore.total}
    onchange={(f) => applicationStore.setFilters(f)}
    onreset={() => applicationStore.resetFilters()}
  />

  <!-- Error State -->
  {#if loadError || applicationStore.error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
      <p class="text-red-600 dark:text-red-400">{loadError || applicationStore.error}</p>
      <button type="button" class="mt-2 text-sm text-red-600 hover:text-red-700 underline" onclick={loadApplications}>
        Try again
      </button>
    </div>
  {/if}

  <!-- Loading State -->
  {#if applicationStore.loading}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  {:else if applicationStore.applications.length === 0}
    <!-- Empty State -->
    <EmptyState
      title="No applications yet"
      description="Get started by adding your first job application."
      actionLabel="Add Application"
      onaction={() => (showCreateForm = true)}
    />
  {:else}
    <!-- Application List -->
    <div class="grid gap-4">
      {#each applicationStore.applications as app (app.id)}
        <ApplicationCard
          application={app}
          onclick={() => (selectedApplication = app)}
          onarchive={() => handleArchive(app)}
          ondelete={() => (deleteTarget = app)}
        />
      {/each}
    </div>

    <!-- Pagination -->
    {#if applicationStore.totalPages > 1}
      <Pagination
        currentPage={applicationStore.page}
        totalPages={applicationStore.totalPages}
        onPageChange={(p) => applicationStore.setPage(p)}
      />
    {/if}
  {/if}
</div>

<!-- Create Form Modal -->
{#if showCreateForm}
  <div class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <button
        type="button"
        class="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/75 transition-opacity cursor-default"
        onclick={() => (showCreateForm = false)}
        aria-label="Close modal"
      ></button>
      <div class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
        <div class="p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">New Application</h2>
          <ApplicationForm
            onsubmit={(input) => handleCreate(input as CreateApplicationInput)}
            oncancel={() => (showCreateForm = false)}
          />
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Detail Sidebar -->
{#if selectedApplication}
  <div class="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
    <div class="absolute inset-0 overflow-hidden">
      <button
        type="button"
        class="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/75 cursor-default"
        onclick={() => (selectedApplication = null)}
        aria-label="Close panel"
      ></button>
      <div class="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div class="w-screen max-w-2xl">
          <div class="h-full bg-white dark:bg-gray-800 shadow-xl">
            <ApplicationDetail
              application={selectedApplication}
              onUpdate={handleUpdate}
              onAddStage={handleAddStage}
              onUpdateStage={handleUpdateStage}
              onRemoveStage={handleRemoveStage}
              onArchive={handleDetailArchive}
              onDelete={handleDetailDelete}
              onClose={() => (selectedApplication = null)}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Delete Confirmation -->
{#if deleteTarget}
  <ConfirmDialog
    title="Delete Application"
    message="Are you sure you want to delete the application for {deleteTarget.positionTitle} at {deleteTarget.companyName}? This action cannot be undone."
    confirmLabel="Delete"
    confirmVariant="danger"
    onconfirm={handleDelete}
    oncancel={() => (deleteTarget = null)}
  />
{/if}
