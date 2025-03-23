// src/app/services/user.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MsalService } from '@azure/msal-angular';
import { Observable, BehaviorSubject, of, from, throwError, iif } from 'rxjs';
import { map, catchError, tap, switchMap, retry, shareReplay } from 'rxjs/operators';

export interface UserProfile {
  displayName?: string;
  givenName?: string;
  surname?: string;
  email?: string;
  userPrincipalName?: string;
  id?: string;
  jobTitle?: string;
  mobilePhone?: string;
  officeLocation?: string;
  preferredLanguage?: string;
  photo?: string;
  hasPhoto?: boolean; // New flag to indicate if the user has a photo
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userProfileSubject = new BehaviorSubject<UserProfile | null>(null);
  public userProfile$ = this.userProfileSubject.asObservable();
  private photoUrl = 'https://graph.microsoft.com/v1.0/me/photo/$value';
  private profileUrl = 'https://graph.microsoft.com/v1.0/me';
  
  // Keep track of whether we've already tried to fetch the photo
  private hasTriedPhotoFetch = false;
  
  // Use a separate subject to track the photo fetch attempts
  private photoCheckedSubject = new BehaviorSubject<boolean>(false);
  private photoChecked$ = this.photoCheckedSubject.asObservable();

  // Cache the photo request to avoid repeated calls
  private photoRequest$: Observable<string | null> | null = null;

  constructor(
    private http: HttpClient,
    private authService: MsalService
  ) { }

  // Reset the service state (useful for logout)
  public reset(): void {
    this.userProfileSubject.next(null);
    this.hasTriedPhotoFetch = false;
    this.photoCheckedSubject.next(false);
    this.photoRequest$ = null;
  }

  // Load the user profile on application startup
  public loadUserProfile(): Observable<UserProfile | null> {
    return of(null).pipe(
      map(() => {
        const accounts = this.authService.instance.getAllAccounts();
        if (accounts.length === 0) {
          return null;
        }
        
        // Set the active account if not already set
        if (!this.authService.instance.getActiveAccount() && accounts.length > 0) {
          this.authService.instance.setActiveAccount(accounts[0]);
        }
        
        return accounts[0];
      }),
      catchError(error => {
        console.error('MSAL not initialized in UserService:', error);
        return of(null);
      }),
      switchMap(account => {
        if (!account) {
          return of(null);
        }
        return this.getUserProfile();
      })
    );
  }

  // Get user profile from Graph API
  public getUserProfile(): Observable<UserProfile | null> {
    // Fetch the profile data
    return this.http.get<UserProfile>(this.profileUrl).pipe(
      switchMap(profile => {
        // If we've already checked whether the user has a photo, skip the photo fetch
        return this.photoChecked$.pipe(
          switchMap(photoChecked => {
            if (photoChecked) {
              // We already know if the user has a photo
              const currentProfile = this.userProfileSubject.getValue();
              return of({
                ...profile,
                photo: currentProfile?.photo,
                hasPhoto: currentProfile?.hasPhoto
              });
            } else {
              // We haven't checked yet, try to get the photo
              return this.getUserPhoto().pipe(
                map(photoResult => {
                  if (photoResult) {
                    // User has a photo
                    return {
                      ...profile,
                      photo: photoResult,
                      hasPhoto: true
                    };
                  } else {
                    // User does not have a photo
                    return {
                      ...profile,
                      photo: undefined,
                      hasPhoto: false
                    };
                  }
                }),
                tap(() => {
                  // Mark that we've checked for a photo
                  this.photoCheckedSubject.next(true);
                })
              );
            }
          })
        );
      }),
      tap(profile => {
        if (profile) {
          this.userProfileSubject.next(profile);
        }
      }),
      catchError(error => {
        console.error('Error loading user profile:', error);
        return of(null);
      })
    );
  }

  // Get user photo from Graph API with caching to prevent repeated calls
  private getUserPhoto(): Observable<string | null> {
    // If we've already made the request, return the cached observable
    if (this.photoRequest$) {
      return this.photoRequest$;
    }

    // Create and cache the photo request
    this.photoRequest$ = this.http.get(this.photoUrl, { responseType: 'blob' }).pipe(
      switchMap(blob => from(this.readBlobAsDataUrl(blob))),
      map(dataUrl => dataUrl as string),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          console.log('User has no profile photo available');
        } else {
          console.error('Error fetching profile photo:', error);
        }
        return of(null);
      }),
      // ShareReplay caches the result and shares it with all subscribers
      shareReplay(1)
    );

    return this.photoRequest$;
  }

  // Convert blob to data URL
  private readBlobAsDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Get current value of the user profile
  public getCurrentUserProfile(): UserProfile | null {
    return this.userProfileSubject.getValue();
  }
}