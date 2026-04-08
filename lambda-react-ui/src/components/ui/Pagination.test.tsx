import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('renders page buttons and active page', () => {
    const onPage = vi.fn();
    render(<Pagination page={2} totalPages={4} onPage={onPage} />);

    expect(screen.getByTestId('pagination')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page');
  });

  it('invokes callback when page number is clicked', () => {
    const onPage = vi.fn();
    render(<Pagination page={1} totalPages={3} onPage={onPage} />);

    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(onPage).toHaveBeenCalledWith(3);
  });

  it('disables previous on first page and next on last page', () => {
    const onPage = vi.fn();
    const { rerender } = render(<Pagination page={1} totalPages={2} onPage={onPage} />);
    expect(screen.getByRole('button', { name: 'Prev' })).toBeDisabled();

    rerender(<Pagination page={2} totalPages={2} onPage={onPage} />);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
});
