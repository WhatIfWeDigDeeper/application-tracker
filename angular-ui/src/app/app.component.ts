import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  template: `
    <app-header />
    <main class="container mx-auto px-4 py-6 max-w-7xl min-h-screen bg-white dark:bg-gray-900">
      <router-outlet />
    </main>
  `,
})
export class AppComponent {}
