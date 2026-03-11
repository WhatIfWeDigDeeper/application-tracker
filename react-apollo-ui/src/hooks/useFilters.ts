import { useState } from 'react';
import type { Filters } from '../components/applications/FilterBar.js';

export function useFilters() {
  const [filters, setFilters] = useState<Filters>({});

  return { filters, setFilters };
}
