'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for syncing React state with localStorage
 * Handles SSR safety and provides typed access to localStorage
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Use a function for initial state to avoid running on every render
  const [storedValue, setStoredValue] = useState<T>(() => {
    // Return initial value during SSR
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Track if we've done the initial hydration
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on client mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item) as T);
      }
    } catch (error) {
      console.error(`Error hydrating from localStorage key "${key}":`, error);
    }
    setIsHydrated(true);
  }, [key]);

  // Update localStorage whenever storedValue changes (after hydration)
  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue, isHydrated]);

  // Memoized setValue function
  const setValue = useCallback((value: T | ((prev: T) => T)): void => {
    setStoredValue((prev) => {
      const newValue = value instanceof Function ? value(prev) : value;
      return newValue;
    });
  }, []);

  // Remove the item from localStorage
  const removeValue = useCallback((): void => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(key);
        setStoredValue(initialValue);
      } catch (error) {
        console.error(`Error removing localStorage key "${key}":`, error);
      }
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook to check if we're on the client side (hydrated)
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}
