import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApplicationService } from '../../core/services/application.service';
import {
  Application,
  FilterParams,
  APPLICATION_STATUSES,
  COMPANY_CATEGORIES,
  JOB_SOURCES,
  STATUS_COLORS,
} from '../../core/models/application.model';
import { RelativeDatePipe } from '../../shared/pipes/relative-date.pipe';
import { InlineEditComponent } from '../../shared/components/inline-edit/inline-edit.component';
import { CsvImportComponent } from '../csv/csv-import.component';
import { CsvExportComponent } from '../csv/csv-export.component';

@Component({
  selector: 'app-application-list',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    RelativeDatePipe,
    InlineEditComponent,
    CsvImportComponent,
    CsvExportComponent,
  ],
  templateUrl: './application-list.component.html',
})
export class ApplicationListComponent implements OnInit {
  private service = inject(ApplicationService);

  applications = signal<Application[]>([]);
  total = signal(0);
  loading = signal(false);
  filters = signal<FilterParams>({
    sortBy: 'updatedAt',
    sortDir: 'desc',
    limit: 20,
    page: 1,
  });

  readonly statusOptions = APPLICATION_STATUSES;
  readonly categoryOptions = COMPANY_CATEGORIES;
  readonly sourceOptions = JOB_SOURCES;
  readonly statusColors = STATUS_COLORS;

  showImport = signal(false);

  // Filter state
  statusFilter = signal('');
  categoryFilter = signal('');
  sourceFilter = signal('');
  includeArchived = signal(false);

  ngOnInit() {
    this.loadApplications();
  }

  loadApplications() {
    this.loading.set(true);
    const params: FilterParams = {
      ...this.filters(),
      status: this.statusFilter() || undefined,
      companyCategory: this.categoryFilter() || undefined,
      jobSource: this.sourceFilter() || undefined,
      includeArchived: this.includeArchived() || undefined,
    };
    this.service.list(params).subscribe({
      next: (res) => {
        this.applications.set(res.items);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onStatusFilterChange(value: string) {
    this.statusFilter.set(value);
    this.filters.update((f) => ({ ...f, page: 1 }));
    this.loadApplications();
  }

  onCategoryFilterChange(value: string) {
    this.categoryFilter.set(value);
    this.filters.update((f) => ({ ...f, page: 1 }));
    this.loadApplications();
  }

  onSourceFilterChange(value: string) {
    this.sourceFilter.set(value);
    this.filters.update((f) => ({ ...f, page: 1 }));
    this.loadApplications();
  }

  onArchivedChange(value: boolean) {
    this.includeArchived.set(value);
    this.filters.update((f) => ({ ...f, page: 1 }));
    this.loadApplications();
  }

  onSortChange(field: string) {
    const current = this.filters();
    const dir =
      current.sortBy === field && current.sortDir === 'asc' ? 'desc' : 'asc';
    this.filters.update((f) => ({ ...f, sortBy: field, sortDir: dir, page: 1 }));
    this.loadApplications();
  }

  onPageChange(page: number) {
    this.filters.update((f) => ({ ...f, page }));
    this.loadApplications();
  }

  onArchive(id: string) {
    this.service.archive(id).subscribe(() => this.loadApplications());
  }

  onRestore(id: string) {
    this.service.restore(id).subscribe(() => this.loadApplications());
  }

  onDelete(id: string) {
    if (confirm('Delete this application?')) {
      this.service.delete(id).subscribe(() => this.loadApplications());
    }
  }

  onCompanyNameSaved(id: string, name: string) {
    this.service.update(id, { companyName: name }).subscribe(() => this.loadApplications());
  }

  onPositionSaved(id: string, position: string) {
    this.service.update(id, { positionTitle: position }).subscribe(() => this.loadApplications());
  }

  get totalPages() {
    return Math.ceil(this.total() / (this.filters().limit ?? 20));
  }

  get currentPage() {
    return this.filters().page ?? 1;
  }

  getStatusColor(status: string): string {
    return this.statusColors[status as keyof typeof this.statusColors] ?? 'bg-gray-100 text-gray-800';
  }

  getSortIcon(field: string): string {
    const f = this.filters();
    if (f.sortBy !== field) return '↕';
    return f.sortDir === 'asc' ? '↑' : '↓';
  }
}
