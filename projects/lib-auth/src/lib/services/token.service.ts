import { Injectable } from '@angular/core';
import { signal } from '@angular/core';
import { InfoUsuario } from '../types/auth.types';

@Injectable({ providedIn: 'root' })
export class ServicioToken {
  private readonly TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly USER_INFO_KEY = 'infoUsuario';
  private readonly EXPIRA_EN_KEY = 'expiraEn';
  private readonly ROL_ACTIVO_KEY = 'rolActivo';

  private tokenSignal = signal<string | null>(this.obtenerTokenDelAlmacenamiento());
  private infoUsuarioSignal = signal<InfoUsuario | null>(this.obtenerInfoUsuarioDelAlmacenamiento());

  guardarToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.tokenSignal.set(token);
  }

  // expiresIn llega en SEGUNDOS desde el backend (ver JwtService.obtenerTiempoExpiracion en ms-auth)
  guardarExpiracion(expiresInSegundos: number): void {
    const expiraEn = Date.now() + expiresInSegundos * 1000;
    localStorage.setItem(this.EXPIRA_EN_KEY, String(expiraEn));
  }

  // Marca de tiempo absoluta (ms desde epoch) en que el access token expira
  obtenerExpiracion(): number | null {
    if (typeof window === 'undefined') return null;
    const valor = localStorage.getItem(this.EXPIRA_EN_KEY);
    return valor ? Number(valor) : null;
  }

  obtenerToken(): string | null {
    return this.tokenSignal();
  }

  guardarRefreshToken(refreshToken: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  obtenerRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  guardarInfoUsuario(usuario: InfoUsuario): void {
    localStorage.setItem(this.USER_INFO_KEY, JSON.stringify(usuario));
    this.infoUsuarioSignal.set(usuario);
  }

  obtenerInfoUsuario(): InfoUsuario | null {
    return this.infoUsuarioSignal();
  }

  estaAutenticado(): boolean {
    return this.obtenerToken() !== null && this.obtenerToken() !== '';
  }

  // Recuerda qué rol estaba viendo el usuario en el dashboard (cuando tiene varios roles),
  // para que volver desde un módulo no lo regrese siempre al primer rol por defecto.
  guardarRolActivo(rol: string): void {
    localStorage.setItem(this.ROL_ACTIVO_KEY, rol);
  }

  obtenerRolActivo(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.ROL_ACTIVO_KEY);
  }

  limpiar(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_INFO_KEY);
    localStorage.removeItem(this.EXPIRA_EN_KEY);
    localStorage.removeItem(this.ROL_ACTIVO_KEY);
    this.tokenSignal.set(null);
    this.infoUsuarioSignal.set(null);
  }

  private obtenerTokenDelAlmacenamiento(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private obtenerInfoUsuarioDelAlmacenamiento(): InfoUsuario | null {
    if (typeof window === 'undefined') return null;
    const info = localStorage.getItem(this.USER_INFO_KEY);
    return info ? JSON.parse(info) : null;
  }

  obtenerSeñalToken() {
    return this.tokenSignal;
  }

  obtenerSeñalInfoUsuario() {
    return this.infoUsuarioSignal;
  }
}