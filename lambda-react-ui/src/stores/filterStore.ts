import { create } from 'zustand';
import type { CompanyCategory, FilterState, JobSource, SortState } from '@/types/application';

interface FilterStore extends FilterState, SortState {
  setStatusFilter: (status: FilterState['status']) => void;
  setCategoryFilter: (category: CompanyCategory | undefined) => void;
  setSourceFilter: (source: JobSource | undefined) => void;
  setSkillsMatchMin: (min: number | undefined) => void;
  setIncludeArchived: (include: boolean) => void;
  setSortBy: (sortBy: SortState['sortBy']) => void;
  setSortDir: (sortDir: SortState['sortDir']) => void;
  clearFilters: () => void;
  activeFilterCount: () => number;
}

const defaults: FilterState & SortState = {
  status: [],
  companyCategory: undefined,
  jobSource: undefined,
  skillsMatchMin: undefined,
  includeArchived: false,
  sortBy: 'updatedAt',
  sortDir: 'desc',
};

export const useFilterStore = create<FilterStore>((set, get) => ({
  ...defaults,
  setStatusFilter: (status) => set({ status }),
  setCategoryFilter: (companyCategory) => set({ companyCategory }),
  setSourceFilter: (jobSource) => set({ jobSource }),
  setSkillsMatchMin: (skillsMatchMin) => set({ skillsMatchMin }),
  setIncludeArchived: (includeArchived) => set({ includeArchived }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortDir: (sortDir) => set({ sortDir }),
  clearFilters: () => set({ ...defaults }),
  activeFilterCount: () => {
    const state = get();
    let count = 0;
    if (state.status.length > 0) count += 1;
    if (state.companyCategory) count += 1;
    if (state.jobSource) count += 1;
    if (state.skillsMatchMin != null) count += 1;
    if (state.includeArchived) count += 1;
    return count;
  },
}));
