import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ServicioToken } from 'lib-auth';

// Guard funcional: Angular lo ejecuta antes de cargar cualquier ruta protegida.
// Si el usuario no tiene token → redirige a /acceso y bloquea la navegación.
export const authGuard: CanActivateFn = () => {
  const servicioToken = inject(ServicioToken);
  const enrutador = inject(Router);

  if (servicioToken.estaAutenticado()) {
    return true;
  }

  return enrutador.createUrlTree(['/acceso']);
};
