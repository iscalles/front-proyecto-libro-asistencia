import { Routes } from '@angular/router';
import { PáginaAcceso } from './pages/login-page/login-page.component';
import { PáginaDashboard } from './pages/dashboard/dashboard-page.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'acceso',
    component: PáginaAcceso
  },
  {
    path: 'dashboard',
    component: PáginaDashboard,
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: 'acceso',
    pathMatch: 'full'
  }
];
