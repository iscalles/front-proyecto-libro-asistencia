import { Injectable, inject, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { ServicioToken } from './token.service';
import { ServicioAutenticacion } from './auth.service';

/**
 * ServicioExpiracionSesion
 * Vigila cuándo expira el access token y avisa al usuario un par de minutos antes,
 * dándole la opción de extender la sesión (refresh token) o cerrarla.
 * Se activa/desactiva solo: reacciona a la señal de token de ServicioToken, así que
 * cubre login, logout (manual o por 401) y refresco, sin que cada componente tenga
 * que llamarlo manualmente.
 */
@Injectable({ providedIn: 'root' })
export class ServicioExpiracionSesion {
  private servicioToken = inject(ServicioToken);
  private servicioAutenticacion = inject(ServicioAutenticacion);
  private router = inject(Router);

  // Cuánto antes de expirar se muestra el aviso
  private readonly SEGUNDOS_AVISO_PREVIO = 120;

  private timerAviso: ReturnType<typeof setTimeout> | null = null;
  private timerExpiracion: ReturnType<typeof setTimeout> | null = null;
  private intervaloCuentaAtras: ReturnType<typeof setInterval> | null = null;

  readonly mostrarModal = signal(false);
  readonly segundosRestantes = signal(0);
  readonly extendiendo = signal(false);
  readonly errorExtender = signal<string | null>(null);

  constructor() {
    effect(() => {
      const token = this.servicioToken.obtenerSeñalToken()();
      if (token) {
        this.iniciarMonitoreo();
      } else {
        this.detenerMonitoreo();
        this.mostrarModal.set(false);
      }
    });
  }

  private iniciarMonitoreo(): void {
    this.detenerMonitoreo();
    this.mostrarModal.set(false);
    this.errorExtender.set(null);

    const expiracion = this.servicioToken.obtenerExpiracion();
    if (!expiracion) return;

    const msHastaExpirar = expiracion - Date.now();
    if (msHastaExpirar <= 0) {
      this.cerrarPorExpiracion();
      return;
    }

    const msHastaAviso = msHastaExpirar - this.SEGUNDOS_AVISO_PREVIO * 1000;
    if (msHastaAviso <= 0) {
      this.mostrarAviso(expiracion);
    } else {
      this.timerAviso = setTimeout(() => this.mostrarAviso(expiracion), msHastaAviso);
    }

    this.timerExpiracion = setTimeout(() => this.cerrarPorExpiracion(), msHastaExpirar);
  }

  private mostrarAviso(expiracion: number): void {
    this.mostrarModal.set(true);
    this.actualizarContador(expiracion);
    this.intervaloCuentaAtras = setInterval(() => this.actualizarContador(expiracion), 1000);
  }

  private actualizarContador(expiracion: number): void {
    this.segundosRestantes.set(Math.max(0, Math.round((expiracion - Date.now()) / 1000)));
  }

  extenderSesion(): void {
    this.extendiendo.set(true);
    this.errorExtender.set(null);
    this.servicioAutenticacion.refrescarSesion().subscribe({
      next: () => {
        // El cambio de token reprograma el monitoreo automáticamente (ver el effect del constructor)
        this.extendiendo.set(false);
      },
      error: () => {
        this.extendiendo.set(false);
        this.errorExtender.set('No se pudo extender la sesión. Inicia sesión nuevamente.');
      }
    });
  }

  cerrarSesionManual(): void {
    this.mostrarModal.set(false);
    this.servicioAutenticacion.cerrarSesion().subscribe({
      next: () => this.router.navigate(['/acceso']),
      error: () => this.router.navigate(['/acceso']),
    });
  }

  private cerrarPorExpiracion(): void {
    this.detenerMonitoreo();
    this.mostrarModal.set(false);
    this.servicioToken.limpiar();
    this.router.navigate(['/acceso']);
  }

  private detenerMonitoreo(): void {
    if (this.timerAviso) clearTimeout(this.timerAviso);
    if (this.timerExpiracion) clearTimeout(this.timerExpiracion);
    if (this.intervaloCuentaAtras) clearInterval(this.intervaloCuentaAtras);
    this.timerAviso = null;
    this.timerExpiracion = null;
    this.intervaloCuentaAtras = null;
  }
}
