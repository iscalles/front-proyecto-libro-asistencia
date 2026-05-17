import { Routes } from '@angular/router';
import { PáginaAcceso } from './pages/login-page/login-page.component';

export const routes: Routes = [
  {
    path: 'acceso',
    component: PáginaAcceso
  },
  {
    path: '',
    redirectTo: 'acceso',
    pathMatch: 'full'
  },
  // Agregar más rutas aquí para páginas autenticadas (dashboard, etc.)
];
