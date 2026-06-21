import { TestBed } from '@angular/core/testing';
import { ServicioToken } from './token.service';
import { InfoUsuario } from '../types/auth.types';

describe('ServicioToken', () => {
  let servicio: ServicioToken;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(ServicioToken);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ── Token ──────────────────────────────────────────────────────────────────

  it('guardarToken() debería persistir el token en localStorage', () => {
    servicio.guardarToken('mi-token-jwt');
    expect(localStorage.getItem('accessToken')).toBe('mi-token-jwt');
  });

  it('obtenerToken() debería retornar el token guardado', () => {
    servicio.guardarToken('mi-token-jwt');
    expect(servicio.obtenerToken()).toBe('mi-token-jwt');
  });

  it('estaAutenticado() debería retornar true cuando hay token', () => {
    servicio.guardarToken('mi-token-jwt');
    expect(servicio.estaAutenticado()).toBeTrue();
  });

  it('estaAutenticado() debería retornar false cuando no hay token', () => {
    expect(servicio.estaAutenticado()).toBeFalse();
  });

  // ── Refresh token ──────────────────────────────────────────────────────────

  it('guardarRefreshToken() debería persistir el refresh token', () => {
    servicio.guardarRefreshToken('mi-refresh-token');
    expect(servicio.obtenerRefreshToken()).toBe('mi-refresh-token');
  });

  // ── Expiración ─────────────────────────────────────────────────────────────

  it('guardarExpiracion() debería calcular la marca de tiempo correctamente', () => {
    const antes = Date.now();
    servicio.guardarExpiracion(3600);
    const expira = servicio.obtenerExpiracion()!;
    const despues = Date.now();

    expect(expira).toBeGreaterThanOrEqual(antes + 3600 * 1000);
    expect(expira).toBeLessThanOrEqual(despues + 3600 * 1000);
  });

  // ── Info usuario ───────────────────────────────────────────────────────────

  it('guardarInfoUsuario() debería persistir y recuperar la info del usuario', () => {
    const usuario: InfoUsuario = {
      idUsuario: '1',
      nombre: 'Juan Pérez',
      correo: 'juan@test.com',
      roles: ['DOCENTE'],
      rutUsuario: '12345678-9',
    };

    servicio.guardarInfoUsuario(usuario);
    expect(servicio.obtenerInfoUsuario()).toEqual(usuario);
  });

  // ── limpiar ────────────────────────────────────────────────────────────────

  it('limpiar() debería eliminar todos los datos de sesión', () => {
    servicio.guardarToken('token');
    servicio.guardarRefreshToken('refresh');
    servicio.guardarInfoUsuario({ idUsuario: '1', nombre: 'X', correo: 'x@x.com', roles: [], rutUsuario: '1-9' });

    servicio.limpiar();

    expect(servicio.obtenerToken()).toBeNull();
    expect(servicio.obtenerRefreshToken()).toBeNull();
    expect(servicio.obtenerInfoUsuario()).toBeNull();
    expect(servicio.estaAutenticado()).toBeFalse();
  });
});
