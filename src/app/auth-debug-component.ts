import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-auth-debug',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  template: `
    <mat-card class="debug-card">
      <mat-card-header>
        <mat-card-title>Authentication Debug</mat-card-title>
      </mat-card-header>
      
      <mat-card-content>
        <div class="debug-info">
          <h3>Current Auth Status</h3>
          <p><strong>isAuthenticated:</strong> {{isAuthenticated}}</p>
          <p><strong>Redirect URI:</strong> {{redirectUri}}</p>
          <p><strong>Current URL:</strong> {{currentUrl}}</p>
          
          <h3>Environment</h3>
          <p><strong>Browser:</strong> {{browserInfo}}</p>
          <p><strong>Cookies Enabled:</strong> {{cookiesEnabled}}</p>
          <p><strong>Local Storage Available:</strong> {{localStorageAvailable}}</p>
          
          <div *ngIf="msal && msalAccounts">
            <h3>MSAL Accounts</h3>
            <pre>{{msalAccounts}}</pre>
          </div>
        </div>
      </mat-card-content>
      
      <mat-card-actions>
        <button mat-button (click)="forceLogin()">FORCE LOGIN</button>
        <button mat-button (click)="clearCaches()">CLEAR CACHES</button>
        <button mat-button (click)="refreshDebug()">REFRESH INFO</button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .debug-card {
      margin: 20px;
      max-width: 800px;
    }
    
    .debug-info {
      padding: 10px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
    
    pre {
      background-color: #eee;
      padding: 10px;
      overflow: auto;
      max-height: 200px;
    }
  `]
})
export class AuthDebugComponent implements OnInit {
  isAuthenticated = false;
  redirectUri = '';
  currentUrl = '';
  browserInfo = '';
  cookiesEnabled = false;
  localStorageAvailable = false;
  msalAccounts = '';
  msal: any = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.refreshDebug();
  }

  refreshDebug(): void {
    // Check auth status
    this.isAuthenticated = this.authService.isLoggedIn();
    
    // Get environment info
    this.redirectUri = window.location.origin;
    this.currentUrl = window.location.href;
    this.browserInfo = navigator.userAgent;
    this.cookiesEnabled = navigator.cookieEnabled;
    
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      this.localStorageAvailable = true;
    } catch (e) {
      this.localStorageAvailable = false;
    }
    
    // Try to access MSAL instance (this is for debugging only)
    this.getMsalInfo();
  }

  forceLogin(): void {
    this.authService.login();
  }

  clearCaches(): void {
    try {
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies (this is a simplified approach)
      document.cookie.split(";").forEach(c => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      console.log('All caches cleared');
      this.refreshDebug();
    } catch (e) {
      console.error('Error clearing caches:', e);
    }
  }

  private getMsalInfo(): void {
    // This is unsafe and for debugging only
    try {
      // @ts-ignore - Accessing private members for debugging
      this.msal = this.authService['msalInstance'];
      if (this.msal) {
        const accounts = this.msal.getAllAccounts();
        this.msalAccounts = JSON.stringify(accounts, null, 2);
      }
    } catch (e) {
      console.error('Could not access MSAL information:', e);
    }
  }
}
