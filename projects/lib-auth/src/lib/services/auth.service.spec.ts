import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ServicioAutenticacion, AUTH_API_URL } from './auth.service';
import { ServicioToken } from './token.service';
import { CredencialesAutenticacion, RespuestaAutenticacion } from '../types/auth.types';

const API = 'http://localhost:8080';

const respuestaMock: RespuestaAutenticacion = {
  accessToken: 'access-jwt',
  refreshToken: 'refresh-jwt',
  idUsuario: '1',
  nombre: 'Juan Pérez',
  correo: 'juan@test.com',
  roles: ['DOCENTE'],
  expiresIn: 3600,
};

describe('ServicioAutenticacion', () => {
  let servicio: ServicioAutenticacion;
  let servicioToken: ServicioToken;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AUTH_API_URL, useValue: API },
      ],
    });
    servicio = TestBed.inject(ServicioAutenticacion);
    servicioToken = TestBed.inject(ServicioToken);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // ── iniciarSesion ──────────────────────────────────────────────────────────

  it('iniciarSesion() debería POST a /auth/login y guardar los tokens', () => {
    const credenciales: CredencialesAutenticacion = { rutUsuario: '12345678-9', password: '1234' };

    servicio.iniciarSesion(credenciales).subscribe(resp => {
      expect(resp.accessToken).toBe('access-jwt');
    });

    const req = httpMock.expectOne(`${API}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(credenciales);
    req.flush(respuestaMock);

    expect(servicioToken.obtenerToken()).toBe('access-jwt');
    expect(servicioToken.obtenerRefreshToken()).toBe('refresh-jwt');
    expect(servicioToken.estaAutenticado()).toBeTrue();
  });

  it('iniciarSesion() debería guardar la info del usuario tras el login', () => {
    const credenciales: CredencialesAutenticacion = { rutUsuario: '12345678-9', password: '1234' };

    servicio.iniciarSesion(credenciales).subscribe();
    httpMock.expectOne(`${API}/auth/login`).flush(respuestaMock);

    const info = servicioToken.obtenerInfoUsuario();
    expect(info?.nombre).toBe('Juan Pérez');
    expect(info?.rutUsuario).toBe('12345678-9');
    expect(info?.roles).toContain('DOCENTE');
  });

  it('iniciarSesion() debería emitir ErrorAutenticacion cuando el servidor falla', () => {
    const credenciales: CredencialesAutenticacion = { rutUsuario: 'rut-malo', password: 'mal' };

    servicio.iniciarSesion(credenciales).subscribe({
      next: () => fail('debería haber fallado'),
      error: (err) => {
        expect(err.codigo).toBe('CREDENCIALES_INVALIDAS');
      },
    });

    httpMock.expectOne(`${API}/auth/login`).flush(
      { codigo: 'CREDENCIALES_INVALIDAS', mensaje: 'RUT o contraseña incorrectos' },
      { status: 401, statusText: 'Unauthorized' }
    );
  });

  // ── refrescarSesion ────────────────────────────────────────────────────────

  it('refrescarSesion() debería POST a /auth/refresh con el refresh token', () => {
    servicioToken.guardarRefreshToken('refresh-jwt');

    servicio.refrescarSesion().subscribe(resp => {
      expect(resp.accessToken).toBe('access-jwt');
    });

    const req = httpMock.expectOne(`${API}/auth/refresh`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refreshToken: 'refresh-jwt' });
    req.flush(respuestaMock);
  });

  it('refrescarSesion() debería fallar si no hay refresh token guardado', () => {
    servicio.refrescarSesion().subscribe({
      next: () => fail('debería haber fallado'),
      error: (err) => {
        expect(err.codigo).toBe('SIN_REFRESH_TOKEN');
      },
    });
  });

  // ── cerrarSesion ───────────────────────────────────────────────────────────

  it('cerrarSesion() debería POST a /auth/logout y limpiar los tokens', () => {
    servicioToken.guardarToken('access-jwt');

    servicio.cerrarSesion().subscribe();

    httpMock.expectOne(`${API}/auth/logout`).flush({});

    expect(servicioToken.obtenerToken()).toBeNull();
    expect(servicioToken.estaAutenticado()).toBeFalse();
  });

  it('cerrarSesion() debería limpiar tokens aunque el backend falle', () => {
    servicioToken.guardarToken('access-jwt');

    servicio.cerrarSesion().subscribe({ error: () => {} });

    httpMock.expectOne(`${API}/auth/logout`).flush(
      'Error', { status: 500, statusText: 'Server Error' }
    );

    expect(servicioToken.obtenerToken()).toBeNull();
  });
});
