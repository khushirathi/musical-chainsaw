import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class GraphService {
  private graphEndpoint = 'https://graph.microsoft.com/v1.0';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Get the user's profile photo from Microsoft Graph
   * @returns URL of the user's profile photo or null if not available
   */
  getUserPhoto(): Observable<string | null> {
    return this.authService.getAccessToken().pipe(
      switchMap(token => {
        if (!token) {
          return of(null);
        }

        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });

        // First try to get the photo metadata
        return this.http.get(`${this.graphEndpoint}/me/photo`, { headers }).pipe(
          switchMap(() => {
            // If metadata exists, get the actual photo as a blob
            return this.http.get(`${this.graphEndpoint}/me/photo/$value`, {
              headers,
              responseType: 'blob'
            }).pipe(
              map(blob => URL.createObjectURL(blob)),
              catchError(() => of(null))
            );
          }),
          catchError(() => of(null)) // Handle the case where user has no photo
        );
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Get detailed user profile information from Microsoft Graph
   */
  getUserProfile(): Observable<any> {
    return this.authService.getAccessToken().pipe(
      switchMap(token => {
        if (!token) {
          return of(null);
        }

        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });

        return this.http.get(`${this.graphEndpoint}/me`, { headers }).pipe(
          catchError(error => {
            console.error('Error fetching user profile from Graph API:', error);
            return of(null);
          })
        );
      })
    );
  }
}
