/**
 * ThemeToggle component
 * Provides a button/switch to toggle between light and dark modes
 * Displays current theme state with an icon
 */

'use client';

import { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '@/components/ThemeProvider';

/**
 * ThemeToggle component - renders a toggle button for theme switching
 */
export function ThemeToggle(): React.ReactElement {
  const context = useContext(ThemeContext);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted (avoids hydration mismatch)
  if (!mounted || !context) {
    return (
      <div className="relative inline-flex items-center justify-center p-2 rounded-lg bg-gray-100 dark:bg-slate-800 w-20 h-9" />
    );
  }

  const { theme, toggleTheme } = context;

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center justify-center p-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors duration-300"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Current theme: ${theme}`}
    >
      {theme === 'light' ? (
        // Moon icon for switching to dark mode
        <svg
          className="w-5 h-5 text-gray-600 dark:text-slate-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      ) : (
        // Sun icon for switching to light mode
        <svg
          className="w-5 h-5 text-yellow-500"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 18a6 6 0 100-12 6 6 0 000 12zM12 2v4m0 12v4m8-10h-4m-12 0H2m13.657-5.657l2.828-2.828m-9.97 9.97l2.828-2.828m0 9.97l-2.828 2.828m9.97-9.97l-2.828-2.828" />
        </svg>
      )}
      <span className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-200">
        {theme === 'light' ? 'Dark' : 'Light'}
      </span>
    </button>
  );
}
