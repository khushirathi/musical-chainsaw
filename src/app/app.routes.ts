import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'debug',
        loadComponent: () => import('./auth-debug-component').then(m => m.AuthDebugComponent)
      },
      {
        path: '**',
        redirectTo: ''
      }
];
