import { Injectable, inject, InjectionToken } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { CredencialesAutenticacion, RespuestaAutenticacion, ErrorAutenticacion } from '../types/auth.types';
import { ServicioToken } from './token.service';

// Token de inyección para la URL base de la API
// Permite que la app configure la URL sin que la librería dependa de environments
export const AUTH_API_URL = new InjectionToken<string>('AUTH_API_URL');

@Injectable({ providedIn: 'root' })
export class ServicioAutenticacion {
  private clienteHttp = inject(HttpClient);
  private servicioToken = inject(ServicioToken);
  private urlBase = `${inject(AUTH_API_URL)}/auth`;


  iniciarSesion(credenciales: CredencialesAutenticacion): Observable<RespuestaAutenticacion> {
    return this.clienteHttp.post<RespuestaAutenticacion>(
      `${this.urlBase}/login`,
      credenciales
    ).pipe(
      tap(respuesta => {
        // Guardar tokens
        this.servicioToken.guardarToken(respuesta.accessToken);
        this.servicioToken.guardarRefreshToken(respuesta.refreshToken);
        // Guardar info del usuario
        this.servicioToken.guardarInfoUsuario({
          idUsuario: respuesta.idUsuario,
          nombre: respuesta.nombre,
          correo: respuesta.correo,
          roles: respuesta.roles,
          rutUsuario: credenciales.rutUsuario
        });
      }),
      catchError(error => {
        const errorAutenticacion: ErrorAutenticacion = {
          codigo: error.error?.codigo || 'ERROR_DESCONOCIDO',
          mensaje: error.error?.mensaje || 'Error al iniciar sesión',
          timestamp: Date.now()
        };
        return throwError(() => errorAutenticacion);
      })
    );
  }

  cerrarSesion(): Observable<any> {
    return this.clienteHttp.post(`${this.urlBase}/logout`, {}).pipe(
      tap(() => {
        this.servicioToken.limpiar();
      }),
      catchError(error => {
        // Limpiar tokens aunque falle la llamada al backend
        this.servicioToken.limpiar();
        return throwError(() => error);
      })
    );
  }
}