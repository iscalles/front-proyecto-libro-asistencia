import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ServicioToken } from 'lib-auth';

export const apoderadoGuard: CanActivateFn = () => {
  const servicioToken = inject(ServicioToken);
  const enrutador = inject(Router);

  const usuario = servicioToken.obtenerInfoUsuario();
  if (usuario?.roles?.includes('APODERADO')) {
    return true;
  }

  return enrutador.createUrlTree(['/dashboard']);
};
