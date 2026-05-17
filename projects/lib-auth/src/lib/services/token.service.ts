import { Injectable } from '@angular/core';
import { signal } from '@angular/core';
import { InfoUsuario } from '../types/auth.types';

@Injectable({ providedIn: 'root' })
export class ServicioToken {
  private readonly TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly USER_INFO_KEY = 'infoUsuario';

  private tokenSignal = signal<string | null>(this.obtenerTokenDelAlmacenamiento());
  private infoUsuarioSignal = signal<InfoUsuario | null>(this.obtenerInfoUsuarioDelAlmacenamiento());

  guardarToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.tokenSignal.set(token);
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

  limpiar(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_INFO_KEY);
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