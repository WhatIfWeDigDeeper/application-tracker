import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MockedProvider } from '@apollo/client/testing';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { routeTree } from '../routeTree.gen';

function renderWithProviders(path: string) {
  const memoryHistory = createMemoryHistory({ initialEntries: [path] });
  const router = createRouter({ routeTree, history: memoryHistory });
  return render(
    <MockedProvider mocks={[]} addTypename={false}>
      <RouterProvider router={router} />
    </MockedProvider>
  );
}

describe('New Application Form', () => {
  it('renders company name and position title inputs', async () => {
    renderWithProviders('/applications/new');
    expect(await screen.findByLabelText(/company name/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/position title/i)).toBeInTheDocument();
  });

  it('dateApplied input is disabled when status is wishlist', async () => {
    renderWithProviders('/applications/new');
    const dateInput = await screen.findByLabelText(/date applied/i);
    // Default status is wishlist, so dateApplied should be disabled
    expect(dateInput).toBeDisabled();
  });

  it('offerDueDate input is not shown when status is not offer', async () => {
    renderWithProviders('/applications/new');
    // Wait for the form to render
    await screen.findByLabelText(/company name/i);
    expect(screen.queryByLabelText(/offer due date/i)).not.toBeInTheDocument();
  });
});
