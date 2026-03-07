import { Component } from '@angular/core';

const linkClass =
  'px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-sm rounded border border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:border-gray-600';

@Component({
  selector: 'app-csv-export',
  standalone: true,
  template: `
    <div class="flex items-center gap-2">
      <a
        href="/api/applications/export"
        download
        [class]="linkClass"
      >Export CSV</a>
      <a
        href="/api/applications/sample-csv"
        download="applications-template.csv"
        [class]="linkClass"
      >Template</a>
    </div>
  `,
})
export class CsvExportComponent {
  readonly linkClass = linkClass;
}
