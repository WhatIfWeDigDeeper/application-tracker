import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { ApplicationService } from '../../core/services/application.service';
import { ImportResult } from '../../core/models/application.model';

@Component({
  selector: 'app-csv-import',
  standalone: true,
  template: `
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-medium text-gray-900 dark:text-white">Import Applications</h2>
        <button
          type="button"
          (click)="onClose()"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm"
        >Close</button>
      </div>

      <p class="text-xs text-gray-500 dark:text-gray-400">
        Need a template?
        <a
          href="/api/applications/sample-csv"
          download="applications-template.csv"
          class="text-blue-600 hover:underline dark:text-blue-400"
        >Download template</a>
      </p>

      <div class="flex items-center gap-3 flex-wrap">
        <input
          type="file"
          accept=".csv"
          (change)="onFileSelected($event)"
          class="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-gray-300 file:bg-white file:text-gray-700 hover:file:bg-gray-50 dark:text-gray-400 dark:file:bg-gray-700 dark:file:text-gray-300 dark:file:border-gray-600"
        />
        <button
          type="button"
          (click)="onImport()"
          [disabled]="!selectedFile() || importing()"
          class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded disabled:opacity-50"
        >
          {{ importing() ? 'Importing...' : 'Import' }}
        </button>
      </div>

      <div [hidden]="!result()" class="p-3 bg-green-50 border border-green-200 rounded text-sm dark:bg-green-900/20 dark:border-green-800 space-y-1">
          <p class="font-medium text-green-800 dark:text-green-400">Imported: {{ result()?.imported ?? 0 }}</p>
          <p class="font-medium text-green-800 dark:text-green-400">Skipped: {{ result()?.skipped ?? 0 }}</p>
          <div data-testid="import-result-errors" class="font-medium text-green-800 dark:text-green-400">
            Errors: {{ result()?.errors?.length ?? 0 }}
            <ul class="mt-1 space-y-1">
              @for (err of result()?.errors ?? []; track err.row) {
                <li class="text-red-700 dark:text-red-400">Row {{ err.row }}: {{ err.message }}</li>
              }
            </ul>
          </div>
        </div>

      <p [hidden]="!error()" class="text-sm text-red-600 dark:text-red-400">{{ error() }}</p>
    </div>
  `,
})
export class CsvImportComponent {
  private service = inject(ApplicationService);

  @Output() closeImport = new EventEmitter<void>();
  @Output() importSuccess = new EventEmitter<void>();

  selectedFile = signal<File | null>(null);
  importing = signal(false);
  result = signal<ImportResult | null>(null);
  error = signal<string | null>(null);

  onClose() {
    this.closeImport.emit();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile.set(file);
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
        this.importSuccess.emit();
      },
      error: (err: unknown) => {
        this.error.set(err instanceof Error ? err.message : 'Import failed');
        this.importing.set(false);
      },
    });
  }
}
