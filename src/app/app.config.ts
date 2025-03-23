import {
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { BrowserModule } from '@angular/platform-browser';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS,
  withFetch,
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  IPublicClientApplication,
  PublicClientApplication,
  InteractionType,
  BrowserCacheLocation,
  LogLevel,
} from '@azure/msal-browser';
import {
  MsalInterceptor,
  MSAL_INSTANCE,
  MsalInterceptorConfiguration,
  MsalGuardConfiguration,
  MSAL_GUARD_CONFIG,
  MSAL_INTERCEPTOR_CONFIG,
  MsalService,
  MsalGuard,
  MsalBroadcastService,
} from '@azure/msal-angular';

// Microsoft Graph API scopes
const graphScopes = {
  user: ['User.Read', 'User.ReadBasic.All', 'profile'],
};

// src/app/app.config.ts

// MSAL configuration
export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: 'dcdf02e9-37a6-4ef6-90e1-6eb23aee7e00',
      authority: 'https://login.microsoftonline.com/75c22ff3-c5ee-4cea-83d7-943fc7ede463',
      redirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
      navigateToLoginRequestUrl: true
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
      storeAuthStateInCookie: true, // Enable cookies for better SSO experience
    },
    system: {
      allowNativeBroker: false, // Consider enabling for Windows environments
      tokenRenewalOffsetSeconds: 300, // Renew tokens 5 minutes before expiry
      loggerOptions: {
        loggerCallback: (logLevel, message) => {
          console.log(message);
        },
        logLevel: LogLevel.Info,
        piiLoggingEnabled: false,
      },
    },
  });
}

// MSAL interceptor configuration
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  
  // Add MS Graph API endpoints protection
  protectedResourceMap.set('https://graph.microsoft.com/v1.0/me', graphScopes.user);
  
  // Add your backend API endpoints here, for example:
  // protectedResourceMap.set('https://api.yourcompany.com', ['api://your-api-client-id/access_as_user']);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}

// MSAL guard configuration
export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: [...graphScopes.user],
    },
    loginFailedRoute: '/login-failed',
  };
}

// Application configuration
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(BrowserModule),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi(), withFetch()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true,
    },
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory,
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: MSALGuardConfigFactory,
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory,
    },
    MsalService,
    MsalGuard,
    MsalBroadcastService,
  ],
};