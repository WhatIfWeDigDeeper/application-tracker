import { ref, watch, onMounted } from 'vue';

const DARK_MODE_KEY = 'job-tracker-dark-mode';

export function useDarkMode() {
  const isDark = ref(false);

  function updateDarkClass() {
    if (isDark.value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  function toggle() {
    isDark.value = !isDark.value;
  }

  function setDarkMode(value: boolean) {
    isDark.value = value;
  }

  // Watch for changes and persist
  watch(isDark, (newValue) => {
    localStorage.setItem(DARK_MODE_KEY, JSON.stringify(newValue));
    updateDarkClass();
  });

  // Initialize on mount
  onMounted(() => {
    // Check localStorage first
    const stored = localStorage.getItem(DARK_MODE_KEY);
    if (stored !== null) {
      isDark.value = JSON.parse(stored);
    } else {
      // Fall back to system preference
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    updateDarkClass();

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Only update if user hasn't set a preference
      if (localStorage.getItem(DARK_MODE_KEY) === null) {
        isDark.value = e.matches;
      }
    });
  });

  return {
    isDark,
    toggle,
    setDarkMode,
  };
}
