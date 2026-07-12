import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Status que indican que un microservicio (o el gateway) no responde,
// a diferencia de errores de negocio (400, 401, 403, 404, 409, etc.).
const STATUS_SERVICIO_CAIDO = [0, 500, 501, 502, 503, 504];

/**
 * Interceptor de Errores de Conexión
 * Detecta cuando un microservicio no está disponible y redirige a una
 * pantalla dedicada, conservando la URL de origen para poder reintentar.
 */
export const connectionErrorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const enrutador = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const urlActual = enrutador.url;
      const yaEnPaginaError = urlActual.startsWith('/error-conexion');

      if (STATUS_SERVICIO_CAIDO.includes(error.status) && !yaEnPaginaError) {
        enrutador.navigate(['/error-conexion'], {
          queryParams: { retornarA: urlActual }
        });
      }

      return throwError(() => error);
    })
  );
};
