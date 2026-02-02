<script lang="ts">
  import '../app.css';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="min-h-full">
  <nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <a href="/" class="flex items-center gap-2">
            <svg class="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span class="text-xl font-bold text-gray-900 dark:text-gray-100">Job Application Tracker (Svelte 5 + Hono + Drizzle)</span>
          </a>
        </div>
        <div class="flex items-center">
          <span class="text-sm text-gray-500 dark:text-gray-400">
            Svelte 5 + Hono + Drizzle
          </span>
        </div>
      </div>
    </div>
  </nav>

  <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
    {@render children?.()}
  </main>
</div>
