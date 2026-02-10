<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  let isDark = $state(false);

  onMount(() => {
    const stored = localStorage.getItem('app-theme');
    if (stored === 'dark') {
      isDark = true;
    } else if (stored === 'light') {
      isDark = false;
    } else {
      // Default to system preference
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      localStorage.setItem('app-theme', isDark ? 'dark' : 'light');
    }
    applyTheme();
  });

  function applyTheme() {
    if (browser) {
      document.documentElement.classList.toggle('dark', isDark);
    }
  }

  function toggleDarkMode() {
    isDark = !isDark;
    localStorage.setItem('app-theme', isDark ? 'dark' : 'light');
    applyTheme();
  }
</script>

<div class="min-h-full">
  <nav class="bg-white dark:bg-gray-800 shadow-xs border-b border-gray-200 dark:border-gray-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <a href="/" class="flex items-center gap-2">
            <svg class="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span class="text-xl font-bold text-gray-900 dark:text-gray-100">Application Tracker</span>
          </a>
        </div>
        <div class="flex items-center gap-4">
          <button
            type="button"
            class="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
            onclick={toggleDarkMode}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {#if isDark}
              <!-- Sun icon -->
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            {:else}
              <!-- Moon icon -->
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            {/if}
          </button>
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
