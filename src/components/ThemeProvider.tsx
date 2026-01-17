/**
 * ThemeProvider component
 * Provides theme state and management to the entire application
 * Handles localStorage persistence and system preference detection
 */

'use client';

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Theme, ThemeContextType } from '@/types/theme';
import {
  getStoredTheme,
  saveTheme,
  applyTheme,
  getEffectiveTheme,
  getSystemTheme,
} from '@/lib/theme';

/**
 * Create the theme context with default undefined value
 * Will be provided by ThemeProvider below
 */
export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * ThemeProvider component - manages theme state and provides it to children
 */
export function ThemeProvider({ children }: ThemeProviderProps): React.ReactElement {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  /**
   * Initialize theme on client mount
   * This prevents hydration mismatch and theme flashing
   */
  useEffect(() => {
    // Get the effective theme (stored or system preference)
    const effectiveTheme = getEffectiveTheme();
    setThemeState(effectiveTheme);
    applyTheme(effectiveTheme);
    setMounted(true);
  }, []);

  /**
   * Set theme and persist to localStorage
   */
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    saveTheme(newTheme);
    applyTheme(newTheme);
  }, []);

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  /**
   * Listen for system theme preference changes
   */
  useEffect(() => {
    // Only proceed if mounted
    if (!mounted) return;

    // Only listen if user hasn't set explicit preference
    const storedTheme = getStoredTheme();
    if (storedTheme) return;

    // Create listener for system preference changes
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (): void => {
      const newSystemTheme = getSystemTheme();
      const newTheme = newSystemTheme === 'dark' ? 'dark' : 'light';
      setThemeState(newTheme);
      applyTheme(newTheme);
    };

    // Modern API: addEventListener
    darkModeQuery.addEventListener('change', handleSystemThemeChange);

    return (): void => {
      darkModeQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [mounted]);

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
  };

  // Don't render children until mounted to avoid hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
