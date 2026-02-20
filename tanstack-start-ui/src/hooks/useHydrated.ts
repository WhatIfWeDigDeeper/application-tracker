import { useState, useEffect } from "react";

/**
 * Returns true only after React hydration is complete.
 * Used to delay rendering interactive content in SSR routes,
 * ensuring E2E tests wait for hydration before interacting.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
