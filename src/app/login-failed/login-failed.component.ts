// src/app/login-failed/login-failed.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login-failed',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="flex flex-col items-center justify-center h-96">
      <mat-icon class="text-6xl text-red-500 mb-4">error_outline</mat-icon>
      <h1 class="text-2xl font-bold mb-2">Login Failed</h1>
      <p class="text-gray-600 mb-6">Sorry, we couldn't sign you in. Please try again.</p>
      <a mat-raised-button color="primary" routerLink="/">Return to Home</a>
    </div>
  `,
})
export class LoginFailedComponent {}