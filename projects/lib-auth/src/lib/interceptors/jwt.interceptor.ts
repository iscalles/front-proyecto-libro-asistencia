import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptorFn,
  HttpHandlerFn
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ServicioToken } from '../services/token.service';

/**
 * Interceptor de JWT (versión basada en funciones para Angular 15+)
 * Agrega automáticamente el token JWT a todas las solicitudes HTTP
 * Añade encabezado de autorización: "Bearer <token>"
 */
export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const servicioToken = inject(ServicioToken);

  // Obtener el token del servicio de token
  const token = servicioToken.obtenerToken();

  // Clonar la solicitud y agregar encabezado de autorización si existe el token
  if (token) {
    const requestClonada = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(requestClonada);
  }

  // Si no hay token, pasar la solicitud original
  return next(req);
};

/**
 * Versión heredada inyectable del Interceptor de JWT (para compatibilidad)
 * Puede usarse con el enfoque antiguo de provideHttpClient
 */
@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private servicioToken: ServicioToken) {}

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    const token = this.servicioToken.obtenerToken();

    if (token) {
      const requestClonada = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next.handle(requestClonada);
    }

    return next.handle(req);
  }
}
