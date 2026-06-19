import { Routes } from '@angular/router';
import { PáginaAcceso } from './pages/login-page/login-page.component';
import { PáginaDashboard } from './pages/dashboard/dashboard-page.component';
import { PáginaAdmin } from './pages/admin/admin-page.component';
import { PáginaRelaciones } from './pages/relaciones/relaciones-page.component';
import { PáginaAcademico } from './pages/academico/academico-page.component';
import { PáginaSeguimiento } from './pages/seguimiento/seguimiento-page.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/role.guard';
import { apoderadoGuard } from './guards/apoderado.guard';

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
    path: 'admin',
    component: PáginaAdmin,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'relaciones',
    component: PáginaRelaciones,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'academico',
    component: PáginaAcademico,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'seguimiento',
    component: PáginaSeguimiento,
    canActivate: [authGuard, apoderadoGuard]
  },
  {
    path: '',
    redirectTo: 'acceso',
    pathMatch: 'full'
  }
];
