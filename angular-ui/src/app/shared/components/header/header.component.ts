import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="bg-white border-b border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-700">
      <div class="container mx-auto px-4 py-4 max-w-7xl flex items-center justify-between">
        <div>
          <a routerLink="/" class="text-xl font-bold text-gray-900 hover:text-blue-600 dark:text-white">
            Application Tracker
          </a>
          <p class="text-xs text-gray-500 mt-0.5 dark:text-gray-400">Angular &bull; Go Gin &bull; pgx/sqlc</p>
        </div>
        <div class="flex items-center gap-3">
          <nav>
            <a routerLink="/" class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300">
              Applications
            </a>
          </nav>
          @if (isDark) {
            <button
              type="button"
              aria-label="switch to light mode"
              (click)="toggleDarkMode()"
              class="p-2 rounded hover:bg-gray-100 text-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
            >
              &#9728;
            </button>
          } @else {
            <button
              type="button"
              aria-label="switch to dark mode"
              (click)="toggleDarkMode()"
              class="p-2 rounded hover:bg-gray-100 text-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
            >
              &#9790;
            </button>
          }
        </div>
      </div>
    </header>
  `,
})
export class HeaderComponent implements OnInit {
  isDark = false;
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    const stored = localStorage.getItem('app-theme');
    if (stored === 'dark') {
      this.isDark = true;
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  toggleDarkMode() {
    this.isDark = !this.isDark;
    if (this.isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('app-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('app-theme', 'light');
    }
    this.cdr.detectChanges();
  }
}
