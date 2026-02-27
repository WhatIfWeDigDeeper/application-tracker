import { Component, inject, signal } from '@angular/core';
import { ApplicationService } from '../../core/services/application.service';

@Component({
  selector: 'app-csv-export',
  standalone: true,
  template: `
    <div class="flex items-center gap-2">
      <button
        type="button"
        (click)="onExport()"
        [disabled]="exporting()"
        class="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-sm rounded border border-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
      >
        {{ exporting() ? 'Exporting...' : 'Export CSV' }}
      </button>
      <button
        type="button"
        (click)="onDownloadTemplate()"
        [disabled]="downloadingTemplate()"
        class="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-sm rounded border border-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
      >
        {{ downloadingTemplate() ? 'Downloading...' : 'Download Template' }}
      </button>
    </div>
  `,
})
export class CsvExportComponent {
  private service = inject(ApplicationService);

  exporting = signal(false);
  downloadingTemplate = signal(false);

  onExport() {
    this.exporting.set(true);
    this.service.exportCSV().subscribe({
      next: (blob) => {
        const today = new Date().toISOString().split('T')[0];
        this.downloadBlob(blob, `applications-${today}.csv`);
        this.exporting.set(false);
      },
      error: () => this.exporting.set(false),
    });
  }

  onDownloadTemplate() {
    this.downloadingTemplate.set(true);
    this.service.getTemplate().subscribe({
      next: (blob) => {
        this.downloadBlob(blob, 'applications-template.csv');
        this.downloadingTemplate.set(false);
      },
      error: () => this.downloadingTemplate.set(false),
    });
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
