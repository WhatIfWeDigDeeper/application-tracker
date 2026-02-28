import { render, screen } from '@testing-library/angular';
import { ApplicationDetailComponent } from './application-detail.component';
import { ApplicationService } from '../../core/services/application.service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

const mockService = {
  get: () => of(null),
  create: () => of({ id: '1' }),
  update: () => of({ id: '1' }),
  delete: () => of(undefined),
  archive: () => of({ id: '1' }),
  restore: () => of({ id: '1' }),
  getHistory: () => of([]),
  restoreHistory: () => of({ id: '1' }),
  addStage: () => of({ id: '1', interviewStages: [] }),
  updateStage: () => of({ id: '1', interviewStages: [] }),
  removeStage: () => of({ id: '1', interviewStages: [] }),
};

const mockRoute = {
  snapshot: {
    paramMap: {
      get: () => null,
    },
  },
};

describe('ApplicationDetailComponent', () => {
  it('should render create form with required inputs', async () => {
    await render(ApplicationDetailComponent, {
      providers: [
        { provide: ApplicationService, useValue: mockService },
        { provide: ActivatedRoute, useValue: mockRoute },
        provideRouter([]),
      ],
    });
    expect(screen.getByPlaceholderText('Company Name *')).toBeTruthy();
    expect(screen.getByPlaceholderText('Position Title *')).toBeTruthy();
  });

  it('should show Create Application button in create mode', async () => {
    await render(ApplicationDetailComponent, {
      providers: [
        { provide: ApplicationService, useValue: mockService },
        { provide: ActivatedRoute, useValue: mockRoute },
        provideRouter([]),
      ],
    });
    expect(screen.getByText('Create Application')).toBeTruthy();
  });

  it('should have dateApplied disabled for unsubmitted status', async () => {
    await render(ApplicationDetailComponent, {
      providers: [
        { provide: ApplicationService, useValue: mockService },
        { provide: ActivatedRoute, useValue: mockRoute },
        provideRouter([]),
      ],
    });
    // Find the dateApplied input by its id
    const dateAppliedInput = document.getElementById('dateApplied') as HTMLInputElement;
    expect(dateAppliedInput).toBeTruthy();
    expect(dateAppliedInput.disabled).toBe(true);
  });
});
