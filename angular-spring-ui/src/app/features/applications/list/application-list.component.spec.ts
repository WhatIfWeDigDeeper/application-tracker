import { render, screen } from '@testing-library/angular';
import { ApplicationListComponent } from './application-list.component';
import { ApplicationService } from '../../../core/services/application.service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

const mockApplication = {
  id: '1',
  companyName: 'Acme Corp',
  positionTitle: 'Software Engineer',
  status: 'applied' as const,
  dateApplied: '2026-01-01',
  companyUrl: null,
  jobPostingUrl: null,
  companyCareerUrl: null,
  companyCategory: null,
  skillsMatch: null,
  jobSource: null,
  salaryMin: null,
  salaryMax: null,
  coverLetterRequired: false,
  offerDueDate: null,
  specialRequirements: null,
  notes: null,
  isArchived: false,
  interviewStages: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockService = {
  list: () => of({ items: [mockApplication], total: 1, page: 1, limit: 20 }),
  archive: () => of(mockApplication),
  restore: () => of(mockApplication),
  delete: () => of(undefined),
  update: () => of(mockApplication),
};

describe('ApplicationListComponent', () => {
  it('should display applications', async () => {
    await render(ApplicationListComponent, {
      providers: [
        { provide: ApplicationService, useValue: mockService },
        provideRouter([]),
      ],
    });
    const companyEls = screen.getAllByText('Acme Corp');
    expect(companyEls.length).toBeGreaterThan(0);
    expect(screen.getByText('Software Engineer')).toBeTruthy();
  });

  it('should show Add Application button', async () => {
    await render(ApplicationListComponent, {
      providers: [
        { provide: ApplicationService, useValue: mockService },
        provideRouter([]),
      ],
    });
    expect(screen.getByText('Add Application')).toBeTruthy();
  });

  it('should show empty state when no applications', async () => {
    const emptyService = {
      ...mockService,
      list: () => of({ items: [], total: 0, page: 1, limit: 20 }),
    };
    await render(ApplicationListComponent, {
      providers: [
        { provide: ApplicationService, useValue: emptyService },
        provideRouter([]),
      ],
    });
    expect(screen.getByText('Add Application')).toBeTruthy();
  });
});
