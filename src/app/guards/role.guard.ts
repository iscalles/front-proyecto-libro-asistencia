import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ServicioToken } from 'lib-auth';

// Guard de rol: verifica que el usuario autenticado tenga el rol ADMINISTRATIVO.
// Si no lo tiene → redirige al dashboard en vez de a /acceso,
// porque el usuario SÍ está logueado, solo no tiene permiso para esta sección.
export const adminGuard: CanActivateFn = () => {
  const servicioToken = inject(ServicioToken);
  const enrutador = inject(Router);

  const usuario = servicioToken.obtenerInfoUsuario();
  if (usuario?.roles?.includes('ADMINISTRATIVO')) {
    return true;
  }

  return enrutador.createUrlTree(['/dashboard']);
};

// Guard de rol: verifica que el usuario autenticado tenga el rol DOCENTE.
export const docenteGuard: CanActivateFn = () => {
  const servicioToken = inject(ServicioToken);
  const enrutador = inject(Router);

  const usuario = servicioToken.obtenerInfoUsuario();
  if (usuario?.roles?.includes('DOCENTE')) {
    return true;
  }

  return enrutador.createUrlTree(['/dashboard']);
};
