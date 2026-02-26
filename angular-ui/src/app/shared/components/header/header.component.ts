import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="bg-white border-b border-gray-200 shadow-sm">
      <div class="container mx-auto px-4 py-4 max-w-7xl flex items-center justify-between">
        <div>
          <a routerLink="/" class="text-xl font-bold text-gray-900 hover:text-blue-600">
            Application Tracker
          </a>
          <p class="text-xs text-gray-500 mt-0.5">Angular &bull; Go Gin &bull; pgx/sqlc</p>
        </div>
        <nav>
          <a routerLink="/" class="text-sm text-gray-600 hover:text-gray-900">
            Applications
          </a>
        </nav>
      </div>
    </header>
  `,
})
export class HeaderComponent {}
