import { Component, DestroyRef, inject, signal, OnInit, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { NgStyle } from '@angular/common';
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
import { CsvImportComponent } from '../csv/csv-import.component';
import { CsvExportComponent } from '../csv/csv-export.component';

@Component({
  selector: 'app-application-list',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    NgStyle,
    RelativeDatePipe,
    CsvImportComponent,
    CsvExportComponent,
  ],
  templateUrl: './application-list.component.html',
})
export class ApplicationListComponent implements OnInit {
  private service = inject(ApplicationService);
  private destroyRef = inject(DestroyRef);
  readonly router = inject(Router);

  applications = signal<Application[]>([]);
  total = signal(0);
  loading = signal(false);
  openMenuId = signal<string | null>(null);
  menuPosition = signal<{ top: number; left: number } | null>(null);
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
    this.service.list(params).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

  toggleMenu(id: string, event: MouseEvent) {
    event.stopPropagation();
    if (this.openMenuId() === id) {
      this.openMenuId.set(null);
      this.menuPosition.set(null);
    } else {
      const btn = event.currentTarget as HTMLElement;
      const rect = btn.getBoundingClientRect();
      this.openMenuId.set(id);
      this.menuPosition.set({
        top: rect.bottom + 4, // 4px gap (mt-1)
        left: rect.right - 112, // right-align to button; 112px = min-w-28
      });
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.openMenuId() !== null) {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-menu-trigger]') && !target.closest('[data-menu-dropdown]')) {
        this.openMenuId.set(null);
        this.menuPosition.set(null);
      }
    }
  }

  onArchive(id: string) {
    this.openMenuId.set(null);
    this.menuPosition.set(null);
    this.service.archive(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadApplications());
  }

  onRestore(id: string) {
    this.openMenuId.set(null);
    this.menuPosition.set(null);
    this.service.restore(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadApplications());
  }

  onDelete(id: string) {
    this.openMenuId.set(null);
    this.menuPosition.set(null);
    if (confirm('Delete this application?')) {
      this.service.delete(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadApplications());
    }
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
