import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterBar } from '../components/applications/FilterBar';

describe('FilterBar', () => {
  it('renders all filter controls', () => {
    render(<FilterBar filters={{}} onFilterChange={vi.fn()} />);
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/source/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/skills/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/archived/i)).toBeInTheDocument();
  });
});
