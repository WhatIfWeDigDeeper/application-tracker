import { Routes } from '@angular/router';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/application-list/application-list.component').then(
        (m) => m.ApplicationListComponent
      ),
  },
  {
    path: 'applications/new',
    loadComponent: () =>
      import('./features/application-detail/application-detail.component').then(
        (m) => m.ApplicationDetailComponent
      ),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'applications/:id',
    loadComponent: () =>
      import('./features/application-detail/application-detail.component').then(
        (m) => m.ApplicationDetailComponent
      ),
    canDeactivate: [unsavedChangesGuard],
  },
  { path: '**', redirectTo: '' },
];
