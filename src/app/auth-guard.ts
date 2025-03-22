import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';
import { map, tap } from 'rxjs/operators';

/**
 * Auth guard to protect routes that require authentication
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Check if user is already logged in
  if (authService.isLoggedIn()) {
    return true;
  }
  
  // Try silent SSO
  return authService.loginSilent().pipe(
    map(() => true),
    tap({
      error: () => {
        // If silent login fails, trigger redirect login
        authService.login();
      }
    })
  );
};
