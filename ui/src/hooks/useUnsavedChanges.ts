'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook that warns users about unsaved changes when navigating away.
 * Uses the `beforeunload` event for browser navigation (back button, tab close, URL bar).
 *
 * For in-app navigation, the component should use the `skipGuard` ref
 * returned by this hook to bypass the guard when saving/deleting programmatically.
 */
export function useUnsavedChanges(isDirty: boolean): {
  skipGuardRef: React.MutableRefObject<boolean>;
  setSkipGuard: (value: boolean) => void;
} {
  const skipGuardRef = useRef(false);

  const setSkipGuard = useCallback((value: boolean) => {
    skipGuardRef.current = value;
  }, []);

  // Browser navigation guard (back button, tab close, URL bar)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
      if (isDirty && !skipGuardRef.current) {
        e.preventDefault();
      }
    };

    if (isDirty) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  return { skipGuardRef, setSkipGuard };
}
