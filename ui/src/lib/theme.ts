/**
 * Theme utility functions
 */

import { Theme, SystemTheme, THEME_STORAGE_KEY } from '@/types/theme';

/**
 * Detect system dark mode preference
 */
export const getSystemTheme = (): SystemTheme => {
  // Check if window is available (client-side)
  if (typeof window === 'undefined') {
    return 'no-preference';
  }

  // Check for prefers-color-scheme media query
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }

  return 'no-preference';
};

/**
 * Get stored theme preference from localStorage
 */
export const getStoredTheme = (): Theme | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored as Theme;
    }
  } catch (error) {
    console.warn('Failed to read theme from localStorage:', error);
  }

  return null;
};

/**
 * Save theme preference to localStorage
 */
export const saveTheme = (theme: Theme): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn('Failed to save theme to localStorage:', error);
  }
};

/**
 * Apply theme class to document root
 */
export const applyTheme = (theme: Theme): void => {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

/**
 * Get the effective theme (user preference or system preference)
 */
export const getEffectiveTheme = (): Theme => {
  const stored = getStoredTheme();
  if (stored) {
    return stored;
  }

  const system = getSystemTheme();
  return system === 'dark' ? 'dark' : 'light';
};

/**
 * Validate theme value
 */
export const isValidTheme = (value: unknown): value is Theme => {
  return value === 'light' || value === 'dark';
};
