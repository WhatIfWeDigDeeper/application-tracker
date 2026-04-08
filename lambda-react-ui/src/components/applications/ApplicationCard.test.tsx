import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApplicationCard } from './ApplicationCard';
import type { Application } from '@/types/application';

function buildApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: 'app-1',
    companyName: 'Acme',
    positionTitle: 'Frontend Engineer',
    dateApplied: '2026-04-01',
    status: 'applied',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    companyUrl: null,
    jobPostingUrl: null,
    companyCareerUrl: null,
    companyCategory: null,
    skillsMatch: 4,
    jobSource: 'linkedin',
    coverLetterRequired: false,
    specialRequirements: null,
    salaryMin: 80000,
    salaryMax: 120000,
    notes: null,
    offerDueDate: null,
    isArchived: false,
    interviewStages: [],
    ...overrides,
  };
}

describe('ApplicationCard', () => {
  it('renders company, position, and status badge', () => {
    render(
      <ApplicationCard
        application={buildApplication()}
        viewMode="grid"
        selected={false}
        onSelect={vi.fn()}
        onToggleMenu={vi.fn()}
      />
    );

    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge')).toBeInTheDocument();
  });

  it('shows offer expiry banner for given offer near due date', () => {
    const dueSoon = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    render(
      <ApplicationCard
        application={buildApplication({ status: 'given offer', offerDueDate: dueSoon })}
        viewMode="grid"
        selected={false}
        onSelect={vi.fn()}
        onToggleMenu={vi.fn()}
      />
    );

    expect(screen.getByText(/Offer expires in/i)).toBeInTheDocument();
  });

  it('invokes select callback on card click and exposes actions aria label', () => {
    const onSelect = vi.fn();
    render(
      <ApplicationCard
        application={buildApplication()}
        viewMode="grid"
        selected={false}
        onSelect={onSelect}
        onToggleMenu={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('application-card'));
    expect(onSelect).toHaveBeenCalledWith('app-1');
    expect(screen.getByRole('button', { name: 'Actions' })).toBeInTheDocument();
  });
});
