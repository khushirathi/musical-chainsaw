// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

import { ProfileComponent } from './profile/profile.component';

import { LoginFailedComponent } from './login-failed/login-failed.component';

export const routes: Routes = [
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [MsalGuard]  // Protect this route
  },
  {
    path: 'login-failed',
    component: LoginFailedComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];