import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { HistoryPanelComponent } from './history-panel.component';
import { ApplicationService } from '../../../core/services/application.service';
import { of } from 'rxjs';

const mockHistoryEntries = [
  {
    id: 'h1',
    sequence: 2,
    description: 'Status changed to applied',
    changes: [
      { field: 'status', label: 'Status', oldValue: 'unsubmitted', newValue: 'applied' },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'h2',
    sequence: 1,
    description: 'Application created',
    changes: [],
    createdAt: new Date().toISOString(),
  },
];

const mockService = {
  getHistory: () => of(mockHistoryEntries),
  restoreHistory: () => of({}),
};

describe('HistoryPanelComponent', () => {
  it('should render history entries', async () => {
    await render(HistoryPanelComponent, {
      componentProperties: { applicationId: 'app-1' },
      providers: [
        { provide: ApplicationService, useValue: mockService },
      ],
    });
    expect(screen.getByText('Status changed to applied')).toBeTruthy();
    expect(screen.getByText('Application created')).toBeTruthy();
  });

  it('should expand entry on click to show diffs', async () => {
    const user = userEvent.setup();
    await render(HistoryPanelComponent, {
      componentProperties: { applicationId: 'app-1' },
      providers: [
        { provide: ApplicationService, useValue: mockService },
      ],
    });
    const entryButton = screen.getByText('Status changed to applied');
    await user.click(entryButton);
    expect(screen.getByText('unsubmitted')).toBeTruthy();
    expect(screen.getByText('applied')).toBeTruthy();
  });
});
