import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { FilterBar } from './FilterBar';
import { useFilterStore } from '@/stores/filterStore';
import { useUiStore } from '@/stores/uiStore';

function resetStores() {
  useFilterStore.setState({
    status: [],
    companyCategory: undefined,
    jobSource: undefined,
    skillsMatchMin: undefined,
    includeArchived: false,
    sortBy: 'updatedAt',
    sortDir: 'desc',
  });
  useUiStore.setState({
    sidebarCollapsed: false,
    panelOpen: false,
    panelTab: 'details',
    darkMode: false,
    viewMode: 'grid',
  });
}

describe('FilterBar', () => {
  it('renders filter controls and summary text', () => {
    resetStores();

    render(
      <MemoryRouter>
        <FilterBar total={8} visibleCount={4} />
      </MemoryRouter>
    );

    expect(screen.getByLabelText('Applied')).toBeInTheDocument();
    expect(screen.getByLabelText('Include archived')).toBeInTheDocument();
    expect(screen.getByText('Showing 4 of 8 applications')).toBeInTheDocument();
  });

  it('toggles status and shows active filter count', () => {
    resetStores();

    render(
      <MemoryRouter>
        <FilterBar total={10} visibleCount={10} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByLabelText('Applied'));

    expect(useFilterStore.getState().status).toEqual(['applied']);
    expect(screen.getByRole('button', { name: 'Clear (1)' })).toBeInTheDocument();
  });
});
