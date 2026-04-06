import { describe, expect, it } from 'vitest';
import { useFilterStore } from './filterStore';

describe('filterStore', () => {
  it('updates status filter and sort fields', () => {
    useFilterStore.setState({
      status: [],
      companyCategory: undefined,
      jobSource: undefined,
      skillsMatchMin: undefined,
      includeArchived: false,
      sortBy: 'updatedAt',
      sortDir: 'desc',
    });

    useFilterStore.getState().setStatusFilter(['applied', 'interviewing']);
    useFilterStore.getState().setSortBy('companyName');
    useFilterStore.getState().setSortDir('asc');

    const state = useFilterStore.getState();
    expect(state.status).toEqual(['applied', 'interviewing']);
    expect(state.sortBy).toBe('companyName');
    expect(state.sortDir).toBe('asc');
  });

  it('counts active filters correctly', () => {
    useFilterStore.setState({
      status: ['applied'],
      companyCategory: 'ai',
      jobSource: undefined,
      skillsMatchMin: 4,
      includeArchived: true,
      sortBy: 'updatedAt',
      sortDir: 'desc',
    });

    expect(useFilterStore.getState().activeFilterCount()).toBe(4);
  });

  it('clearFilters resets filter and sort defaults', () => {
    useFilterStore.setState({
      status: ['applied'],
      companyCategory: 'ai',
      jobSource: 'linkedin',
      skillsMatchMin: 3,
      includeArchived: true,
      sortBy: 'companyName',
      sortDir: 'asc',
    });

    useFilterStore.getState().clearFilters();

    const state = useFilterStore.getState();
    expect(state.status).toEqual([]);
    expect(state.companyCategory).toBeUndefined();
    expect(state.jobSource).toBeUndefined();
    expect(state.skillsMatchMin).toBeUndefined();
    expect(state.includeArchived).toBe(false);
    expect(state.sortBy).toBe('updatedAt');
    expect(state.sortDir).toBe('desc');
  });
});
