// src/app/app.component.ts

import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import {
  MsalService,
  MsalBroadcastService,
  MSAL_GUARD_CONFIG,
  MsalGuardConfiguration
} from '@azure/msal-angular';
import {
  EventMessage,
  EventType,
  InteractionStatus,
  AuthenticationResult,
  InteractionRequiredAuthError,
  SsoSilentRequest
} from '@azure/msal-browser';
import { Subject } from 'rxjs';
import { filter, takeUntil, take, concatMap, tap } from 'rxjs/operators';
import { UserService } from './services/user.service';
import { HeaderComponent } from './components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  isIframe = false;
  private readonly destroying$ = new Subject<void>();
  private msalInitialized = false;

  constructor(
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private userService: UserService
  ) {}

 // src/app/app.component.ts

ngOnInit(): void {
  // Check if we're in an iframe
  this.isIframe = window !== window.parent && !window.opener;
  
  // Initialize MSAL with observable chain
  this.authService.handleRedirectObservable()
    .pipe(
      tap(() => {
        console.log('MSAL redirect handling complete');
        this.msalInitialized = true;
        
        // Setup event listeners
        this.setupMsalEvents();
        
        // Always attempt silent login for enterprise users, regardless of cached accounts
        this.attemptEnterpriseLogin();
      }),
      take(1),
      takeUntil(this.destroying$)
    )
    .subscribe({
      next: (result) => {
        if (result) {
          console.log('Redirect handled with auth result');
        } else {
          console.log('No redirect to handle');
        }
      },
      error: (error) => {
        console.error('Error handling redirect:', error);
        this.msalInitialized = true;
      }
    });
}

// Enhanced enterprise login approach
private attemptEnterpriseLogin(): void {
  if (this.isIframe || !this.msalInitialized) {
    return;
  }

  // First, check if we have cached accounts
  const accounts = this.authService.instance.getAllAccounts();
  
  if (accounts.length > 0) {
    console.log('Attempting silent login with cached account');
    this.loginWithSilentFlow(accounts[0]);
  } else {
    // For enterprise environments, try SSO silent authentication even without cached accounts
    console.log('No cached accounts, attempting SSO silent login');
    
    this.authService.ssoSilent({
      scopes: ['User.Read'],
      loginHint: '' // Can be empty for enterprise environments
    })
    .pipe(
      take(1),
      takeUntil(this.destroying$)
    )
    .subscribe({
      next: (response) => {
        console.log('SSO silent login successful');
        this.authService.instance.setActiveAccount(response.account);
        this.loadUserProfile();
      },
      error: (error) => {
        console.log('SSO silent login failed, automatically redirecting to login page', error);
        // Key change: Automatically redirect to login page when silent auth fails
        this.startInteractiveLogin();
      }
    });
  }
}

// Helper method to initiate interactive login
private startInteractiveLogin(): void {
  // Short delay to let the app render before redirecting
  setTimeout(() => {
    console.log('Starting interactive login redirect');
    this.authService.loginRedirect({
      scopes: ['User.Read'],
      prompt: 'select_account' // Shows account picker, useful in enterprise environments
    });
  }, 500);
}

// Helper method to perform silent login with a known account
private loginWithSilentFlow(account: any): void {
  const silentRequest = {
    account: account,
    scopes: ['User.Read']
  };

  this.authService.ssoSilent(silentRequest)
    .pipe(
      take(1),
      takeUntil(this.destroying$)
    )
    .subscribe({
      next: (response) => {
        console.log('Silent login successful with cached account');
        this.authService.instance.setActiveAccount(response.account);
        this.loadUserProfile();
      },
      error: (error) => {
        console.log('Silent login failed with cached account, trying SSO login');
        // Try SSO login without account hint as fallback
        this.authService.ssoSilent({
          scopes: ['User.Read']
        })
        .pipe(
          take(1),
          takeUntil(this.destroying$)
        )
        .subscribe({
          next: (response) => {
            console.log('SSO fallback login successful');
            this.authService.instance.setActiveAccount(response.account);
            this.loadUserProfile();
          },
          error: (ssoError) => {
            console.log('All silent login methods failed, automatically redirecting to login page');
            // Key change: Automatically redirect when all silent methods fail
            this.startInteractiveLogin();
          }
        });
      }
    });
}

  // Set up MSAL event listeners
  private setupMsalEvents(): void {
    // Subscribe to login/logout events
  this.msalBroadcastService.msalSubject$
  .pipe(
    filter((msg: EventMessage) => 
      msg.eventType === EventType.LOGIN_SUCCESS || 
      msg.eventType === EventType.LOGOUT_SUCCESS || 
      msg.eventType === EventType.ACQUIRE_TOKEN_SUCCESS
    ),
    takeUntil(this.destroying$)
  )
  .subscribe((result: EventMessage) => {
    if (result.eventType === EventType.LOGIN_SUCCESS || result.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) {
      const payload = result.payload as AuthenticationResult;
      this.authService.instance.setActiveAccount(payload.account);
      this.loadUserProfile();
    } else if (result.eventType === EventType.LOGOUT_SUCCESS) {
      // Reset the user service when the user logs out
      this.userService.reset();
    }
  });

    // Update login status when interaction is complete
    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        takeUntil(this.destroying$)
      )
      .subscribe(() => {
        this.checkAndSetActiveAccount();
        const isLoggedIn = this.authService.instance.getAllAccounts().length > 0;
        
        // Load user profile if logged in and profile not loaded yet
        if (isLoggedIn && !this.userService.getCurrentUserProfile()) {
          this.loadUserProfile();
        }
      });
  }

  // Try silent authentication on startup
  private attemptSilentLogin(): void {
    if (this.isIframe || !this.msalInitialized) {
      return;
    }

    try {
      // If accounts exist in the cache, try silent authentication
      const accounts = this.authService.instance.getAllAccounts();
      if (accounts.length > 0) {
        const scopes = ['User.Read']; // Default scopes
        
        const silentRequest: SsoSilentRequest = {
          account: accounts[0],
          scopes: scopes
        };

        this.authService.ssoSilent(silentRequest)
          .pipe(
            take(1),
            takeUntil(this.destroying$)
          )
          .subscribe({
            next: (response: AuthenticationResult) => {
              this.authService.instance.setActiveAccount(response.account);
              this.loadUserProfile();
              console.log('Silent login successful');
            },
            error: (error) => {
              if (error instanceof InteractionRequiredAuthError) {
                console.log('Silent token acquisition failed, you need to authenticate interactively');
              } else {
                console.error('Silent authentication error:', error);
              }
            }
          });
      }
    } catch (error) {
      console.error('Error attempting silent login:', error);
    }
  }

  // Check if active account is set and set it if not
  private checkAndSetActiveAccount(): void {
    if (!this.msalInitialized) return;
    
    try {
      const activeAccount = this.authService.instance.getActiveAccount();
      const accounts = this.authService.instance.getAllAccounts();
      
      if (!activeAccount && accounts.length > 0) {
        this.authService.instance.setActiveAccount(accounts[0]);
      }
    } catch (error) {
      console.error('Error checking/setting active account:', error);
    }
  }

  // Load the user profile
  private loadUserProfile(): void {
    this.userService.loadUserProfile()
      .pipe(
        take(1),
        takeUntil(this.destroying$)
      )
      .subscribe({
        next: () => console.log('Profile loaded successfully'),
        error: (err) => console.error('Error loading profile:', err)
      });
  }

  ngOnDestroy(): void {
    this.destroying$.next(undefined);
    this.destroying$.complete();
  }
}