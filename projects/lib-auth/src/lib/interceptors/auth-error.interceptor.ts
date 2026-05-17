import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpHandlerFn
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ServicioToken } from '../services/token.service';

/**
 * Interceptor de Errores de Autenticación (versión basada en funciones para Angular 15+)
 * Maneja errores de autenticación, particularmente respuestas 401
 * Redirige a acceso cuando la sesión expira
 */
export const authErrorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const enrutador = inject(Router);
  const servicioToken = inject(ServicioToken);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Manejar 401 No autorizado - sesión expirada
      if (error.status === 401) {
        // Limpiar el token
        servicioToken.limpiar();

        // Redirigir a página de acceso
        enrutador.navigate(['/acceso']);

        // Mostrar mensaje de error (opcional - puede reemplazarse con notificación toast)
        console.warn('La sesión ha expirado. Por favor, inicie sesión de nuevo.');
      }

      // Manejar 403 Prohibido - el usuario no tiene permisos
      if (error.status === 403) {
        console.warn('Acceso denegado. Es posible que su sesión haya expirado.');
        enrutador.navigate(['/acceso']);
      }

      return throwError(() => error);
    })
  );
};

/**
 * Versión heredada inyectable del Interceptor de Errores de Autenticación
 * Puede usarse con la configuración antigua del cliente HTTP
 */
@Injectable()
export class AuthErrorInterceptor implements HttpInterceptor {
  constructor(
    private enrutador: Router,
    private servicioToken: ServicioToken
  ) {}

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          // Limpiar token y redirigir a acceso
          this.servicioToken.limpiar();
          this.enrutador.navigate(['/acceso']);
          console.warn('La sesión ha expirado. Por favor, inicie sesión de nuevo.');
        }

        return throwError(() => error);
      })
    );
  }
}
