import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApplicationForm } from './ApplicationForm';

describe('ApplicationForm', () => {
  it('shows required errors when submitted empty', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ApplicationForm mode="create" onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId('application-form-save'));

    expect(await screen.findByText('Company name is required.')).toBeInTheDocument();
    expect(await screen.findByText('Position title is required.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('auto-populates and clears dateApplied based on status changes', async () => {
    render(
      <ApplicationForm
        mode="create"
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        initialValues={{ status: 'unsubmitted', dateApplied: null }}
      />
    );

    const statusSelect = screen.getByLabelText('Status') as HTMLSelectElement;
    const dateInput = screen.getByLabelText('Date Applied') as HTMLInputElement;

    fireEvent.change(statusSelect, { target: { value: 'applied' } });
    await waitFor(() => expect(dateInput.value).not.toBe(''));

    fireEvent.change(statusSelect, { target: { value: 'unsubmitted' } });
    expect(dateInput.value).toBe('');
  });

  it('shows salary validation error when min is greater than max', async () => {
    render(<ApplicationForm mode="create" onSubmit={vi.fn().mockResolvedValue(undefined)} />);

    fireEvent.change(screen.getByLabelText(/Company Name/i), { target: { value: 'Acme' } });
    fireEvent.change(screen.getByLabelText(/Position Title/i), { target: { value: 'Engineer' } });
    fireEvent.change(screen.getByLabelText(/Salary Min/i), { target: { value: '120000' } });
    fireEvent.change(screen.getByLabelText(/Salary Max/i), { target: { value: '80000' } });

    fireEvent.click(screen.getByTestId('application-form-save'));

    expect(await screen.findByText('Minimum salary must not exceed maximum')).toBeInTheDocument();
  });

  it('uses type=button for submit button for webkit compatibility', () => {
    render(<ApplicationForm mode="create" onSubmit={vi.fn().mockResolvedValue(undefined)} />);

    expect(screen.getByTestId('application-form-save')).toHaveAttribute('type', 'button');
  });

  it('disables edit save while the form is clean and enables it after changes', () => {
    render(
      <ApplicationForm
        mode="edit"
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        initialValues={{ companyName: 'Acme', positionTitle: 'Engineer' }}
      />
    );

    const saveButton = screen.getByTestId('application-form-save');
    expect(saveButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Company Name/i), { target: { value: 'Acme Updated' } });

    expect(saveButton).toBeEnabled();
  });

  it('disables cancel/discard button while save is in progress', () => {
    render(
      <ApplicationForm
        mode="edit"
        saving={true}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        initialValues={{ companyName: 'Acme', positionTitle: 'Engineer' }}
      />
    );

    expect(screen.getByRole('button', { name: /discard/i })).toBeDisabled();
  });
});
