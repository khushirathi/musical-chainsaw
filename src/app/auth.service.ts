import { Injectable } from '@angular/core';
import { 
  PublicClientApplication, 
  AuthenticationResult, 
  AccountInfo, 
  InteractionRequiredAuthError,
  SilentRequest,
  LogLevel
} from '@azure/msal-browser';
import { BehaviorSubject, Observable, from, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface UserProfile {
  displayName: string;
  email: string;
  photoUrl?: string;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private msalInstance: PublicClientApplication;
  private userProfileSubject = new BehaviorSubject<UserProfile | null>(null);
  private authFailedSubject = new BehaviorSubject<boolean>(false);
  
  // Expose as observables
  userProfile$ = this.userProfileSubject.asObservable();
  authFailed$ = this.authFailedSubject.asObservable();

  // Define the API scopes needed for your application
  private apiScopes = ['User.Read']; // Add more scopes as needed

  // Configuration for Microsoft authentication
  private msalConfig = {
    auth: {
      clientId: 'dcdf02e9-37a6-4ef6-90e1-6eb23aee7e00', 
      authority: 'https://login.microsoftonline.com/75c22ff3-c5ee-4cea-83d7-943fc7ede463',
      redirectUri: 'http://localhost:4200/', // Explicit with trailing slash
      navigateToLoginRequestUrl: false, // Change to false
      postLogoutRedirectUri: 'http://localhost:4200/'
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: true
    },
    system: {
      allowRedirectInIframe: true,
      loggerOptions: {
        logLevel: LogLevel.Verbose
      }
    }
  };

  constructor() {
    this.msalInstance = new PublicClientApplication(this.msalConfig);
    
    // Initialize MSAL immediately
    this.msalInstance.initialize().then(() => {
      console.log('MSAL initialized');
      
      // Handle redirect after initialization
      this.msalInstance.handleRedirectPromise().then(response => {
        console.log('Redirect handled, response:', !!response);
        if (response) {
          // Authentication successful
          console.log('Authentication successful');
          this.msalInstance.setActiveAccount(response.account);
          this.processUserInfo(response.account);
        } else {
          // Check for existing accounts
          const accounts = this.msalInstance.getAllAccounts();
          console.log('Existing accounts found:', accounts.length);
          
          if (accounts.length > 0) {
            this.msalInstance.setActiveAccount(accounts[0]);
            this.processUserInfo(accounts[0]);
          }
        }
      }).catch(error => {
        console.error('Error handling redirect:', error);
      });
    }).catch(error => {
      console.error('MSAL initialization error:', error);
    });
  }

  /**
   * Initialize authentication when app starts
   * @param autoLogin If true, will automatically redirect to login page when silent auth fails
   */
  public initAuth(autoLogin: boolean = false): Observable<boolean> {
    console.log('initAuth called, checking login state');
    
    // Check if user is already logged in
    if (this.isLoggedIn()) {
      console.log('User already logged in');
      return of(true);
    }
    
    // Attempt silent login
    return this.loginSilent().pipe(
      map(() => {
        console.log('Silent login successful');
        return true;
      }),
      catchError(error => {
        console.error('Silent login failed:', error);
        
        // If autoLogin is true and there was an error, redirect to login
        if (autoLogin) {
          console.log('Auto login enabled, redirecting to login page');
          // Small delay to avoid navigation errors
          setTimeout(() => this.login(), 500);
        }
        return of(false);
      })
    );
  }

  /**
   * Attempt to login silently using cached credentials
   */
  public loginSilent(): Observable<AuthenticationResult> {
    const accounts = this.msalInstance.getAllAccounts();
    console.log('Silent login: available accounts:', accounts.length);
    
    // No accounts available for silent login
    if (accounts.length === 0) {
      return throwError(() => new Error('No accounts available for silent login'));
    }
    
    // Use the first account or active account
    const account = this.msalInstance.getActiveAccount() || accounts[0];
    
    // Make silent request
    const silentRequest = {
      scopes: this.apiScopes,
      account: account,
      forceRefresh: false
    };
    
    return from(this.msalInstance.acquireTokenSilent(silentRequest)).pipe(
      tap(response => {
        // Process successful response
        this.msalInstance.setActiveAccount(response.account);
        this.processUserInfo(response.account);
      })
    );
  }

  /**
   * Trigger interactive login with redirect
   */
  public login(): void {
    const loginRequest = {
      scopes: this.apiScopes
    };
    this.msalInstance.loginPopup(loginRequest)
      .then(response => {
        console.log('Login successful');
        this.processUserInfo(response.account);
      })
      .catch(error => {
        console.error('Login error:', error);
      });
  } 

  /**
   * Get user access token for API calls
   */
  public getAccessToken(): Observable<string> {
    if (!this.isLoggedIn()) {
      return of('');
    }

    const account = this.msalInstance.getActiveAccount() || this.msalInstance.getAllAccounts()[0];
    
    const silentRequest = {
      scopes: this.apiScopes,
      account: account
    };

    return from(this.msalInstance.acquireTokenSilent(silentRequest)).pipe(
      map(response => response.accessToken),
      catchError(error => {
        if (error instanceof InteractionRequiredAuthError) {
          // Token expired or user needs to re-authenticate
          this.login();
        }
        console.error('Error acquiring token:', error);
        return of('');
      })
    );
  }

  /**
   * Logout the current user
   */
  public logout(): void {
    this.msalInstance.logoutRedirect();
  }

  /**
   * Check if a user is logged in
   */
  public isLoggedIn(): boolean {
    const activeAccount = this.msalInstance.getActiveAccount();
    const allAccounts = this.msalInstance.getAllAccounts();
    
    // Check for active account first, then fall back to any account
    return !!activeAccount || allAccounts.length > 0;
  }

  /**
   * Handle the authentication response
   */
  private handleAuthResponse(response: AuthenticationResult): void {
    // Set active account
    this.msalInstance.setActiveAccount(response.account);
    
    // Process user info
    this.processUserInfo(response.account);
  }

  /**
   * Check and set the active account if available
   */
  private checkAndSetActiveAccount(): void {
    const activeAccount = this.msalInstance.getActiveAccount();
    
    if (activeAccount) {
      this.processUserInfo(activeAccount);
      return;
    }
    
    const accounts = this.msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      this.msalInstance.setActiveAccount(accounts[0]);
      this.processUserInfo(accounts[0]);
    }
  }

  /**
   * Process user information and update the user profile subject
   */
  private processUserInfo(account: AccountInfo | null): void {
    if (!account) {
      this.userProfileSubject.next(null);
      return;
    }

    console.log('Processing user info for:', account.username);
    
    const profile: UserProfile = {
      displayName: account.name || '',
      email: account.username,
      username: account.username,
      // The photo URL is not automatically provided by MSAL and would need to be fetched from Graph API
    };

    this.userProfileSubject.next(profile);
  }

  /**
   * Ensure MSAL is properly initialized
   */
  private async ensureMsalInitialized(): Promise<void> {
    await this.msalInstance.initialize();
  }
}