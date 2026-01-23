<script lang="ts">
  interface Props {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }

  let { currentPage, totalPages, onPageChange }: Props = $props();

  const pages = $derived(() => {
    const result: (number | 'ellipsis')[] = [];
    const showEllipsisStart = currentPage > 3;
    const showEllipsisEnd = currentPage < totalPages - 2;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) result.push(i);
    } else {
      result.push(1);
      if (showEllipsisStart) result.push('ellipsis');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!result.includes(i)) result.push(i);
      }

      if (showEllipsisEnd) result.push('ellipsis');
      if (!result.includes(totalPages)) result.push(totalPages);
    }

    return result;
  });
</script>

{#if totalPages > 1}
  <nav class="flex items-center justify-center gap-1" aria-label="Pagination">
    <button
      type="button"
      class="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={currentPage === 1}
      onclick={() => onPageChange(currentPage - 1)}
    >
      Previous
    </button>

    {#each pages() as page}
      {#if page === 'ellipsis'}
        <span class="px-3 py-2 text-gray-500">...</span>
      {:else}
        <button
          type="button"
          class="px-3 py-2 text-sm font-medium rounded-md {page === currentPage
            ? 'bg-primary-600 text-white'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
          onclick={() => onPageChange(page)}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>
      {/if}
    {/each}

    <button
      type="button"
      class="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={currentPage === totalPages}
      onclick={() => onPageChange(currentPage + 1)}
    >
      Next
    </button>
  </nav>
{/if}
