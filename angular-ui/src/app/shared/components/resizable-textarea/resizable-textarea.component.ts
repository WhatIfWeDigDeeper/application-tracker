import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-resizable-textarea',
  standalone: true,
  imports: [FormsModule],
  template: `
    <textarea
      #textareaEl
      [id]="id"
      [value]="value"
      [placeholder]="placeholder"
      [rows]="rows"
      (input)="onInput($event)"
      class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm transition-colors resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      style="resize: vertical;"
    ></textarea>
  `,
})
export class ResizableTextareaComponent implements AfterViewInit, OnChanges {
  @Input() value = '';
  @Input() id = '';
  @Input() placeholder = '';
  @Input() rows = 3;
  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('textareaEl') textareaEl?: ElementRef<HTMLTextAreaElement>;

  ngAfterViewInit() {
    this.autoResize();
  }

  ngOnChanges() {
    setTimeout(() => this.autoResize(), 0);
  }

  onInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.valueChange.emit(target.value);
    this.autoResize();
  }

  private autoResize() {
    const el = this.textareaEl?.nativeElement;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  }
}
