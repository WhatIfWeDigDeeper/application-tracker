import { ref, watch, onMounted, onUnmounted } from 'vue';

const DARK_MODE_KEY = 'app-theme';

export function useDarkMode() {
  const isDark = ref(false);
  const userHasSetPreference = ref(false);
  let mediaQuery: MediaQueryList | null = null;
  let handler: ((e: MediaQueryListEvent) => void) | null = null;

  function updateDarkClass() {
    if (isDark.value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  function toggle() {
    userHasSetPreference.value = true;
    isDark.value = !isDark.value;
  }

  function setDarkMode(value: boolean) {
    userHasSetPreference.value = true;
    isDark.value = value;
  }

  // Watch for changes and persist only user-set preferences
  watch(isDark, (newValue) => {
    if (userHasSetPreference.value) {
      localStorage.setItem(DARK_MODE_KEY, newValue ? 'dark' : 'light');
    }
    updateDarkClass();
  });

  // Initialize on mount
  onMounted(() => {
    // Check localStorage first
    const stored = localStorage.getItem(DARK_MODE_KEY);
    if (stored !== null) {
      userHasSetPreference.value = true;
      isDark.value = stored === 'dark';
    } else {
      // Fall back to system preference
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    updateDarkClass();

    // Listen for system preference changes
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    handler = (e: MediaQueryListEvent) => {
      // Only update if user hasn't set a preference
      if (!userHasSetPreference.value) {
        isDark.value = e.matches;
      }
    };
    
    mediaQuery.addEventListener('change', handler);
  });

  // Clean up listener on unmount
  onUnmounted(() => {
    if (mediaQuery && handler) {
      mediaQuery.removeEventListener('change', handler);
    }
  });

  return {
    isDark,
    toggle,
    setDarkMode,
  };
}
