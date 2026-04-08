import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renders title and message and has role dialog', () => {
    render(
      <ConfirmDialog
        open
        title="Delete Application"
        message="This cannot be undone."
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText('Delete Application')).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('invokes callbacks on confirm and cancel buttons', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Archive"
        message="Proceed?"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape key', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Leave page"
        message="Unsaved changes will be lost."
        onCancel={onCancel}
        onConfirm={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
