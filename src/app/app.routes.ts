import { Routes } from '@angular/router';
import { PáginaAcceso } from './pages/login-page/login-page.component';
import { PáginaDashboard } from './pages/dashboard/dashboard-page.component';
import { PáginaAdmin } from './pages/admin/admin-page.component';
import { PáginaRelaciones } from './pages/relaciones/relaciones-page.component';
import { PáginaAcademico } from './pages/academico/academico-page.component';
import { PáginaSeguimiento } from './pages/seguimiento/seguimiento-page.component';
import { PáginaLibroClases } from './pages/libro-clases/libro-clases-page.component';
import { PáginaReportes } from './pages/reportes/reportes-page.component';
import { PáginaCalificaciones } from './pages/calificaciones/calificaciones-page.component';
import { PáginaMisCalificaciones } from './pages/mis-calificaciones/mis-calificaciones-page.component';
import { PáginaNotificaciones } from './pages/notificaciones/notificaciones-page.component';
import { PáginaMensajes } from './pages/mensajes/mensajes-page.component';
import { PáginaConfiguracionEscolar } from './pages/configuracion-escolar/configuracion-escolar-page.component';
import { PáginaErrorConexion } from './pages/error-conexion/error-conexion-page.component';
import { authGuard } from './guards/auth.guard';
import { apoderadoGuard } from './guards/apoderado.guard';
import { adminGuard, docenteGuard, estudianteGuard } from './guards/role.guard';

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
    path: 'libro-clases',
    component: PáginaLibroClases,
    canActivate: [authGuard, docenteGuard]
  },
  {
    path: 'reportes',
    component: PáginaReportes,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'calificaciones',
    component: PáginaCalificaciones,
    canActivate: [authGuard, docenteGuard]
  },
  {
    path: 'mis-calificaciones',
    component: PáginaMisCalificaciones,
    canActivate: [authGuard, estudianteGuard]
  },
  {
    path: 'notificaciones',
    component: PáginaNotificaciones,
    canActivate: [authGuard]
  },
  {
    path: 'mensajes',
    component: PáginaMensajes,
    canActivate: [authGuard]
  },
  {
    path: 'configuracion-escolar',
    component: PáginaConfiguracionEscolar,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'error-conexion',
    component: PáginaErrorConexion
  },
  {
    path: '',
    redirectTo: 'acceso',
    pathMatch: 'full'
  }
];
