import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { AuthService, UserProfile } from '../auth.service';
import { GraphService } from '../graph.service';
import { Subscription, combineLatest } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    RouterModule
  ],
  templateUrl: './site-header.component.html',
  styleUrls: ['./site-header.component.scss']
})
export class SiteHeaderComponent implements OnInit, OnDestroy {
  userProfile: UserProfile | null = null;
  profilePhotoUrl: string | null = null;
  isAuthenticated = false;
  isLoading = true;
  authFailed = false;
  
  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private graphService: GraphService
  ) {}

  ngOnInit(): void {
    // Don't call initAuth() here anymore, just subscribe to auth state changes
    this.isLoading = true;

    // Subscribe to user profile changes
    this.subscriptions.add(
      this.authService.userProfile$.subscribe(profile => {
        this.userProfile = profile;
        this.isAuthenticated = !!profile;
        this.isLoading = false;
        
        // Get user photo if profile exists
        if (profile) {
          this.loadProfilePhoto();
        }
      })
    );
    
    // Subscribe to auth failure notifications
    this.subscriptions.add(
      this.authService.authFailed$.subscribe(failed => {
        this.authFailed = failed;
        if (failed) {
          this.isLoading = false;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  login(): void {
    this.isLoading = true;
    this.authService.login();
  }

  logout(): void {
    this.authService.logout();
  }

  private loadUserData(): void {
    combineLatest([
      this.authService.userProfile$.pipe(take(1)),
      this.graphService.getUserProfile().pipe(take(1))
    ]).subscribe({
      next: ([profile, graphProfile]) => {
        this.isLoading = false;
        // The profile data is already handled by the authService.userProfile$ subscription
        // The graphProfile can be used for additional user details if needed
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private loadProfilePhoto(): void {
    this.graphService.getUserPhoto().subscribe(photoUrl => {
      this.profilePhotoUrl = photoUrl;
    });
  }
}