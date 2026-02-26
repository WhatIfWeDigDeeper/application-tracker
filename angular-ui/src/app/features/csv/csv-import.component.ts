import { Component, inject, signal } from '@angular/core';
import { ApplicationService } from '../../core/services/application.service';
import { ImportResult } from '../../core/models/application.model';

@Component({
  selector: 'app-csv-import',
  standalone: true,
  template: `
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <label class="cursor-pointer">
          <span class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded border border-gray-300 cursor-pointer">
            Choose CSV File
          </span>
          <input
            type="file"
            accept=".csv"
            (change)="onFileSelected($event)"
            class="hidden"
          />
        </label>
        <span class="text-sm text-gray-500">{{ selectedFileName() }}</span>
        @if (selectedFile()) {
          <button
            type="button"
            (click)="onImport()"
            [disabled]="importing()"
            class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded disabled:opacity-50"
          >
            {{ importing() ? 'Importing...' : 'Import' }}
          </button>
        }
      </div>

      @if (result()) {
        <div class="p-3 bg-green-50 border border-green-200 rounded text-sm">
          <p class="font-medium text-green-800">
            Imported: {{ result()!.imported }} | Skipped: {{ result()!.skipped }} | Errors: {{ result()!.errors.length }}
          </p>
          @if (result()!.errors.length > 0) {
            <ul class="mt-2 space-y-1">
              @for (err of result()!.errors; track err.row) {
                <li class="text-red-700">Row {{ err.row }}: {{ err.message }}</li>
              }
            </ul>
          }
        </div>
      }

      @if (error()) {
        <p class="text-sm text-red-600">{{ error() }}</p>
      }
    </div>
  `,
})
export class CsvImportComponent {
  private service = inject(ApplicationService);

  selectedFile = signal<File | null>(null);
  selectedFileName = signal('No file chosen');
  importing = signal(false);
  result = signal<ImportResult | null>(null);
  error = signal<string | null>(null);

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile.set(file);
    this.selectedFileName.set(file ? file.name : 'No file chosen');
    this.result.set(null);
    this.error.set(null);
  }

  onImport() {
    const file = this.selectedFile();
    if (!file) return;

    this.importing.set(true);
    this.error.set(null);
    this.service.importCSV(file).subscribe({
      next: (res) => {
        this.result.set(res);
        this.importing.set(false);
      },
      error: (err: unknown) => {
        this.error.set(err instanceof Error ? err.message : 'Import failed');
        this.importing.set(false);
      },
    });
  }
}
