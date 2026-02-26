import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-inline-edit',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (editing()) {
      <input
        #inputEl
        type="text"
        [(ngModel)]="editValue"
        (blur)="onBlur()"
        (keydown.enter)="save()"
        (keydown.escape)="cancel()"
        class="border border-blue-400 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
      />
    } @else {
      <span
        (click)="startEdit()"
        class="cursor-pointer hover:text-blue-600 hover:underline"
        title="Click to edit"
      >{{ value }}</span>
    }
  `,
})
export class InlineEditComponent {
  @Input() value = '';
  @Output() saved = new EventEmitter<string>();

  @ViewChild('inputEl') inputEl?: ElementRef<HTMLInputElement>;

  editing = signal(false);
  editValue = '';

  startEdit() {
    this.editValue = this.value;
    this.editing.set(true);
    setTimeout(() => this.inputEl?.nativeElement.focus(), 0);
  }

  save() {
    const trimmed = this.editValue.trim();
    if (trimmed && trimmed !== this.value) {
      this.saved.emit(trimmed);
    }
    this.editing.set(false);
  }

  cancel() {
    this.editing.set(false);
  }

  onBlur() {
    this.save();
  }
}
