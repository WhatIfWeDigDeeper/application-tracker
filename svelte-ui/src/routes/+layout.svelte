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

<div class="min-h-full overflow-x-hidden">
  <nav class="bg-white dark:bg-gray-800 shadow-xs border-b border-gray-200 dark:border-gray-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <a href="/" class="flex items-center gap-2 min-w-0">
            <svg class="h-8 w-8 flex-shrink-0" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M26.5 5.5C23.5 1 17 0.5 13 4L7 8.5c-3.5 3-4.5 8-2 12" fill="none" stroke="#ff3e00" stroke-width="2.5" stroke-linecap="round" />
              <path d="M5.5 26.5C8.5 31 15 31.5 19 28l6-4.5c3.5-3 4.5-8 2-12" fill="none" stroke="#ff3e00" stroke-width="2.5" stroke-linecap="round" />
              <path d="M20 10c-2-1.5-5-1-6.5 1" stroke="#ff3e00" stroke-width="2" stroke-linecap="round" />
              <path d="M12 22c2 1.5 5 1 6.5-1" stroke="#ff3e00" stroke-width="2" stroke-linecap="round" />
            </svg>
            <span class="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
              Application Tracker
              <span class="hidden sm:inline text-sm font-normal text-gray-500 dark:text-gray-400">
                Svelte 5 + Hono + Drizzle
              </span>
            </span>
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
        </div>
      </div>
    </div>
  </nav>

  <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
    {@render children?.()}
  </main>
</div>
