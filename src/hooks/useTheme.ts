/**
 * useTheme hook for managing theme state
 * Uses React Context for state management and localStorage for persistence
 */

'use client';

import { useContext } from 'react';
import { ThemeContextType } from '@/types/theme';
import { ThemeContext } from '@/components/ThemeProvider';

/**
 * Hook to access theme context
 * Must be used within ThemeProvider
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
