// src/app/components/header/header.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { Subject, combineLatest, of } from 'rxjs';
import { takeUntil, map, catchError, startWith, delay } from 'rxjs/operators';
import { UserService, UserProfile } from '../../services/user.service';
import { InteractionStatus } from '@azure/msal-browser';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    MatDividerModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  appTitle = 'Your Application Name';
  isLoggedIn = false;
  // Add a loading state property
isAuthenticating = true;
  userProfile: UserProfile | null = null;
  private readonly destroying$ = new Subject<void>();

  constructor(
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private userService: UserService
  ) {}

ngOnInit(): void {
  // Combine the user profile, interaction status, and accounts
  combineLatest([
    this.userService.userProfile$,
    this.msalBroadcastService.inProgress$,
    of(true).pipe(delay(500)) // Short delay to give auth a chance to complete
  ]).pipe(
    takeUntil(this.destroying$)
  ).subscribe(([profile, status]) => {
    if (status === InteractionStatus.None) {
      // Auth process is complete
      this.isAuthenticating = false;
      
      try {
        this.isLoggedIn = this.authService.instance.getAllAccounts().length > 0;
        this.userProfile = profile;
      } catch (error) {
        console.error('Error accessing MSAL in header:', error);
        this.isLoggedIn = false;
      }
    }
  });
}

  login(): void {
    try {
      this.authService.loginRedirect();
    } catch (error) {
      console.error('Error during login:', error);
    }
  }

  logout(): void {
    try {
      this.authService.logoutRedirect();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  ngOnDestroy(): void {
    this.destroying$.next(undefined);
    this.destroying$.complete();
  }
}