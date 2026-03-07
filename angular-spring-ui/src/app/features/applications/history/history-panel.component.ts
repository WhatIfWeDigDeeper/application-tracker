import {
  Component,
  DestroyRef,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  OnChanges,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApplicationService } from '../../../core/services/application.service';
import { HistoryEntry } from '../../../core/models/application.model';
import { RelativeDatePipe } from '../../../shared/pipes/relative-date.pipe';

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
      data-testid="history-panel"
      class="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-50 flex flex-col dark:bg-gray-800"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">History</h2>
        <button
          type="button"
          (click)="close()"
          class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
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
          <p class="text-gray-500 text-center py-8 dark:text-gray-400">No history yet.</p>
        } @else {
          <div class="space-y-1">
            @for (entry of history(); track entry.id; let i = $index) {
              <div data-testid="history-entry" class="border border-gray-200 rounded-lg overflow-hidden dark:border-gray-700">
                <button
                  type="button"
                  (click)="toggleEntry(entry.id)"
                  class="w-full flex items-start justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 text-left dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ entry.description }}
                      @if (i === 0) {
                        <span class="text-xs text-gray-500 ml-1">(current)</span>
                      }
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ entry.createdAt | relativeDate }}</p>
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
                  <div class="px-3 py-2 space-y-1 bg-white dark:bg-gray-800">
                    @for (change of entry.changes; track change.field) {
                      <div class="text-xs">
                        <span class="font-medium text-gray-700 dark:text-gray-300">{{ change.label }}:</span>
                        <span class="ml-1 line-through text-red-500">{{ formatValue(change.oldValue) }}</span>
                        <span class="ml-1 text-green-600">{{ formatValue(change.newValue) }}</span>
                      </div>
                    }
                    @if (entry.changes.length === 0) {
                      <p class="text-xs text-gray-400 dark:text-gray-500">No field changes recorded.</p>
                    }
                    @if (i < history().length - 1) {
                      <div class="pt-2">
                        <button
                          type="button"
                          (click)="onRestore(entry.id)"
                          class="text-xs text-blue-600 hover:underline dark:text-blue-400"
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
  private destroyRef = inject(DestroyRef);

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
    this.service.getHistory(this.applicationId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
    this.service.restoreHistory(this.applicationId, historyId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
