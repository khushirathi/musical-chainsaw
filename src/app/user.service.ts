import { Injectable } from '@angular/core';
import { AuthService, UserProfile } from './auth.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // Keep local synchronized copy of user for easy access
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  
  constructor(private authService: AuthService) {
    // Initialize with current auth state if available
    if (authService.currentUserProfile) {
      this.currentUserSubject.next(authService.currentUserProfile);
    }
    
    // Subscribe to auth changes
    this.authService.userProfile$.subscribe(profile => {
      this.currentUserSubject.next(profile);
    });
  }

  /**
   * Get current user profile (synchronous, may be null)
   */
  get currentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }
  
  /**
   * Observable that emits the current user and future changes
   */
  get user$(): Observable<UserProfile | null> {
    return this.currentUserSubject.asObservable();
  }
  
  /**
   * Get authenticated user (waits until user is available)
   * Useful for scenarios where you need to ensure a user exists
   */
  get authenticatedUser$(): Observable<UserProfile> {
    return this.user$.pipe(
      filter(user => !!user),
      map(user => user as UserProfile)
    );
  }
  
  /**
   * Get user display name or fallback
   */
  getUserDisplayName(fallback: string = 'User'): string {
    return this.currentUser?.displayName || fallback;
  }
  
  /**
   * Get user email or fallback
   */
  getUserEmail(fallback: string = ''): string {
    return this.currentUser?.email || fallback;
  }
  
  /**
   * Helper to create updated by information for a record
   */
  getUpdatedByInfo(): any {
    return {
      updatedBy: this.getUserDisplayName(),
      updatedByEmail: this.getUserEmail(),
      updatedAt: new Date()
    };
  }
}
