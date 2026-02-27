import { render, screen } from '@testing-library/angular';
import { CsvImportComponent } from './csv-import.component';
import { ApplicationService } from '../../core/services/application.service';
import { of } from 'rxjs';

const mockService = {
  importCSV: () => of({ imported: 3, skipped: 1, errors: [] }),
};

const mockServiceWithErrors = {
  importCSV: () =>
    of({
      imported: 0,
      skipped: 0,
      errors: [
        { row: 2, message: 'Missing required field' },
        { row: 5, message: 'Invalid date format' },
      ],
    }),
};

describe('CsvImportComponent', () => {
  it('should render file input', async () => {
    await render(CsvImportComponent, {
      providers: [{ provide: ApplicationService, useValue: mockService }],
    });
    expect(screen.getByRole('heading', { name: 'Import Applications' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
  });

  it('should display result summary after import', async () => {
    const { fixture } = await render(CsvImportComponent, {
      providers: [{ provide: ApplicationService, useValue: mockService }],
    });
    // Simulate file selection and import
    const component = fixture.componentInstance;
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    component.selectedFile.set(file);
    component.onImport();
    fixture.detectChanges();

    expect(screen.getByText(/Imported: 3/)).toBeTruthy();
    expect(screen.getByText(/Skipped: 1/)).toBeTruthy();
  });

  it('should display error list when import has errors', async () => {
    const { fixture } = await render(CsvImportComponent, {
      providers: [
        { provide: ApplicationService, useValue: mockServiceWithErrors },
      ],
    });
    const component = fixture.componentInstance;
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    component.selectedFile.set(file);
    component.onImport();
    fixture.detectChanges();

    expect(screen.getByText(/Row 2: Missing required field/)).toBeTruthy();
    expect(screen.getByText(/Row 5: Invalid date format/)).toBeTruthy();
  });
});
