import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, from, switchMap } from 'rxjs';
import { AuthService } from './auth.service';

export const authHttpInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<any> => {
  const authService = inject(AuthService);
  
  // Skip adding token for MSAL and non-API requests
  if (req.url.includes('login.microsoftonline.com') || !req.url.includes('api')) {
    return next(req);
  }
  
  // Use switchMap to handle the Observable properly
  return authService.getAccessToken().pipe(
    switchMap(token => {
      if (token) {
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next(authReq);
      }
      return next(req);
    })
  );
};