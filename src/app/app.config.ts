import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { connectionErrorInterceptor } from './interceptors/connection-error.interceptor';

import { jwtInterceptor, authErrorInterceptor, AUTH_API_URL } from 'lib-auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withInterceptors([jwtInterceptor, authErrorInterceptor, connectionErrorInterceptor])
    ),
    { provide: AUTH_API_URL, useValue: environment.apiUrl }
  ]
};