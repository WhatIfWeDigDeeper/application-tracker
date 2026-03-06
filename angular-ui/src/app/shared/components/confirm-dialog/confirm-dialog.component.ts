import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div role="dialog" class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl dark:bg-gray-800">
        <h3 class="text-lg font-semibold text-gray-900 mb-2 dark:text-white">{{ title }}</h3>
        <p class="text-gray-600 mb-4 dark:text-gray-300">{{ message }}</p>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            (click)="cancelled.emit()"
            class="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm rounded border border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 dark:border-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="confirmed.emit()"
            [class]="confirmDanger
              ? 'px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded'
              : 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded'"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  @Input() title: string = 'Confirm';
  @Input() message: string = '';
  @Input() confirmLabel: string = 'Confirm';
  @Input() confirmDanger: boolean = false;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
}
