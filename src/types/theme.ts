/**
 * Theme type definitions for dark mode feature
 */

/**
 * Supported theme values
 */
export type Theme = 'light' | 'dark';

/**
 * Theme context interface
 */
export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

/**
 * System theme preference from prefers-color-scheme
 */
export type SystemTheme = 'light' | 'dark' | 'no-preference';

/**
 * Storage key for theme preference
 */
export const THEME_STORAGE_KEY = 'app-theme';
