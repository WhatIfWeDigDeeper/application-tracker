<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { Application } from '$lib/types';
  import { applicationStore } from '$lib/stores/applications.svelte';
  import ApplicationCard from '$lib/components/ApplicationCard.svelte';
  import FilterBar from '$lib/components/FilterBar.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

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
    void applicationStore.filters;
    loadApplications();
  });

  async function handleArchive(app: Application) {
    if (app.isArchived) {
      await applicationStore.restore(app.id);
    } else {
      await applicationStore.archive(app.id);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await applicationStore.remove(deleteTarget.id);
    deleteTarget = null;
  }
</script>

<svelte:head>
  <title>Job Application Tracker</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Applications</h1>
    <button type="button" class="btn-primary" onclick={() => goto('/applications/new')}>
      <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Add Application
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
      onaction={() => goto('/applications/new')}
    />
  {:else}
    <!-- Application List -->
    <div class="grid gap-4">
      {#each applicationStore.applications as app (app.id)}
        <a href="/applications/{app.id}" class="block">
          <ApplicationCard
            application={app}
            onclick={() => {}}
            onarchive={() => handleArchive(app)}
            ondelete={() => (deleteTarget = app)}
          />
        </a>
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
