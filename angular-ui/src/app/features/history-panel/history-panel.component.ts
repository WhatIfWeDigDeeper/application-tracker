import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  OnChanges,
} from '@angular/core';
import { ApplicationService } from '../../core/services/application.service';
import { HistoryEntry } from '../../core/models/application.model';
import { RelativeDatePipe } from '../../shared/pipes/relative-date.pipe';

@Component({
  selector: 'app-history-panel',
  standalone: true,
  imports: [RelativeDatePipe],
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black/30 z-40"
      (click)="close()"
    ></div>

    <!-- Slide-in panel -->
    <div
      class="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b">
        <h2 class="text-lg font-semibold text-gray-900">History</h2>
        <button
          type="button"
          (click)="close()"
          class="text-gray-400 hover:text-gray-600"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4">
        @if (loading()) {
          <div class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        } @else if (history().length === 0) {
          <p class="text-gray-500 text-center py-8">No history yet.</p>
        } @else {
          <div class="space-y-3">
            @for (entry of history(); track entry.id; let i = $index) {
              <div class="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  (click)="toggleEntry(entry.id)"
                  class="w-full flex items-start justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 text-left"
                >
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ entry.description }}</p>
                    <p class="text-xs text-gray-500">{{ entry.createdAt | relativeDate }}</p>
                  </div>
                  <svg
                    class="w-4 h-4 text-gray-400 mt-0.5 transition-transform"
                    [class.rotate-180]="isExpanded(entry.id)"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                @if (isExpanded(entry.id)) {
                  <div class="px-3 py-2 space-y-1">
                    @for (change of entry.changes; track change.field) {
                      <div class="text-xs">
                        <span class="font-medium text-gray-700">{{ change.label }}:</span>
                        <span class="ml-1 line-through text-red-500">{{ formatValue(change.oldValue) }}</span>
                        <span class="ml-1 text-green-600">{{ formatValue(change.newValue) }}</span>
                      </div>
                    }
                    @if (entry.changes.length === 0) {
                      <p class="text-xs text-gray-400">No field changes recorded.</p>
                    }
                    @if (i < history().length - 1) {
                      <div class="pt-2">
                        <button
                          type="button"
                          (click)="onRestore(entry.id)"
                          class="text-xs text-blue-600 hover:underline"
                        >
                          Restore to this point
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class HistoryPanelComponent implements OnChanges {
  @Input() applicationId = '';
  @Output() closed = new EventEmitter<void>();
  @Output() restored = new EventEmitter<void>();

  private service = inject(ApplicationService);

  loading = signal(false);
  history = signal<HistoryEntry[]>([]);
  expandedIds = signal<Set<string>>(new Set());

  ngOnChanges() {
    if (this.applicationId) {
      this.loadHistory();
    }
  }

  loadHistory() {
    this.loading.set(true);
    this.service.getHistory(this.applicationId).subscribe({
      next: (entries) => {
        this.history.set(entries);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  close() {
    this.closed.emit();
  }

  toggleEntry(id: string) {
    this.expandedIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  onRestore(historyId: string) {
    if (!confirm('Restore application to this version?')) return;
    this.service.restoreHistory(this.applicationId, historyId).subscribe({
      next: () => {
        this.restored.emit();
        this.close();
      },
    });
  }

  formatValue(value: unknown): string {
    if (value === null || value === undefined) return '(empty)';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  }
}
