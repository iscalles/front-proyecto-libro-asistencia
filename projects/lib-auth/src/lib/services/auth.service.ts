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
        this.servicioToken.guardarExpiracion(respuesta.expiresIn);
        // Guardar info del usuario
        this.servicioToken.guardarInfoUsuario({
          idUsuario: respuesta.idUsuario,
          nombre: respuesta.nombre,
          correo: respuesta.correo,
          roles: respuesta.roles,
          rutUsuario: credenciales.rutUsuario,
          debeCambiarPassword: respuesta.debeCambiarPassword ?? false
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

  // Pide un access token nuevo usando el refresh token guardado.
  // El backend rota ambos tokens (devuelve un refreshToken nuevo también).
  refrescarSesion(): Observable<RespuestaAutenticacion> {
    const refreshToken = this.servicioToken.obtenerRefreshToken();
    if (!refreshToken) {
      return throwError(() => ({
        codigo: 'SIN_REFRESH_TOKEN',
        mensaje: 'No hay sesión activa para extender',
        timestamp: Date.now()
      } as ErrorAutenticacion));
    }

    return this.clienteHttp.post<RespuestaAutenticacion>(
      `${this.urlBase}/refresh`,
      { refreshToken }
    ).pipe(
      tap(respuesta => {
        this.servicioToken.guardarToken(respuesta.accessToken);
        this.servicioToken.guardarRefreshToken(respuesta.refreshToken);
        this.servicioToken.guardarExpiracion(respuesta.expiresIn);

        // El backend no devuelve el RUT en el refresh; se conserva el que ya teníamos guardado.
        const infoActual = this.servicioToken.obtenerInfoUsuario();
        this.servicioToken.guardarInfoUsuario({
          idUsuario: respuesta.idUsuario,
          nombre: respuesta.nombre,
          correo: respuesta.correo,
          roles: respuesta.roles,
          rutUsuario: infoActual?.rutUsuario ?? '',
          debeCambiarPassword: infoActual?.debeCambiarPassword ?? false
        });
      }),
      catchError(error => {
        const errorAutenticacion: ErrorAutenticacion = {
          codigo: error.error?.codigo || 'ERROR_REFRESH',
          mensaje: error.error?.mensaje || 'No se pudo extender la sesión',
          timestamp: Date.now()
        };
        return throwError(() => errorAutenticacion);
      })
    );
  }

  // Solicita el envío de una contraseña temporal nueva al correo registrado.
  // El backend siempre responde igual (exista o no el correo), así que esto nunca
  // debería fallar salvo por un error real de red/servidor.
  recuperarPassword(correo: string): Observable<void> {
    return this.clienteHttp.post<void>(`${this.urlBase}/recuperar-password`, { correo });
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