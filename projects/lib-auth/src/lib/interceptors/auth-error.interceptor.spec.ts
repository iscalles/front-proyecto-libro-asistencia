import { TestBed } from '@angular/core/testing';
import {
  HttpClient, HttpHandler, provideHttpClient, withInterceptors,
  HTTP_INTERCEPTORS, HttpRequest, HttpErrorResponse
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { ServicioToken } from '../services/token.service';
import { authErrorInterceptor, AuthErrorInterceptor } from './auth-error.interceptor';
import { throwError, of } from 'rxjs';

describe('authErrorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let servicioToken: ServicioToken;
  let enrutador: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authErrorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    servicioToken = TestBed.inject(ServicioToken);
    enrutador = TestBed.inject(Router);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('debería dejar pasar una respuesta exitosa sin modificarla', () => {
    let respuesta: any;
    httpClient.get('/api/test').subscribe(r => respuesta = r);

    httpMock.expectOne('/api/test').flush({ dato: 'ok' });

    expect(respuesta).toEqual({ dato: 'ok' });
  });

  it('debería limpiar los tokens cuando el servidor responde 401', () => {
    servicioToken.guardarToken('token-activo');

    httpClient.get('/api/protegido').subscribe({ error: () => {} });

    httpMock.expectOne('/api/protegido').flush(
      { mensaje: 'No autorizado' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(servicioToken.obtenerToken()).toBeNull();
    expect(servicioToken.estaAutenticado()).toBeFalse();
  });

  it('debería redirigir a /acceso cuando el servidor responde 401', () => {
    spyOn(enrutador, 'navigate');

    httpClient.get('/api/protegido').subscribe({ error: () => {} });

    httpMock.expectOne('/api/protegido').flush(
      {},
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(enrutador.navigate).toHaveBeenCalledWith(['/acceso']);
  });

  it('debería redirigir a /acceso cuando el servidor responde 403', () => {
    spyOn(enrutador, 'navigate');

    httpClient.get('/api/admin').subscribe({ error: () => {} });

    httpMock.expectOne('/api/admin').flush(
      {},
      { status: 403, statusText: 'Forbidden' }
    );

    expect(enrutador.navigate).toHaveBeenCalledWith(['/acceso']);
  });

  it('debería propagar el error al caller después de manejar el 401', () => {
    let errorRecibido: any;

    httpClient.get('/api/protegido').subscribe({ error: e => errorRecibido = e });

    httpMock.expectOne('/api/protegido').flush(
      {},
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(errorRecibido.status).toBe(401);
  });

  it('no debería limpiar tokens en errores que no son 401 ni 403', () => {
    servicioToken.guardarToken('token-activo');
    spyOn(enrutador, 'navigate');

    httpClient.get('/api/datos').subscribe({ error: () => {} });

    httpMock.expectOne('/api/datos').flush(
      {},
      { status: 500, statusText: 'Server Error' }
    );

    // El token debe permanecer intacto
    expect(servicioToken.obtenerToken()).toBe('token-activo');
    expect(enrutador.navigate).not.toHaveBeenCalled();
  });
});

// ── AuthErrorInterceptor (clase inyectable, versión legacy) ─────────────────

describe('AuthErrorInterceptor (clase)', () => {
  let interceptor: AuthErrorInterceptor;
  let enrutadorSpy: jasmine.SpyObj<Router>;
  let servicioToken: ServicioToken;

  beforeEach(() => {
    enrutadorSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: HTTP_INTERCEPTORS, useClass: AuthErrorInterceptor, multi: true },
      ],
    });

    servicioToken = TestBed.inject(ServicioToken);
    interceptor   = new AuthErrorInterceptor(enrutadorSpy, servicioToken);
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  it('debería limpiar tokens y redirigir a /acceso en un error 401', () => {
    servicioToken.guardarToken('token-activo');
    const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });

    // Simulamos el handler que lanza el error
    const handlerFake = { handle: () => throwError(() => error) } as unknown as HttpHandler;

    interceptor.intercept(new HttpRequest('GET', '/api/test'), handlerFake)
      .subscribe({ error: () => {} });

    expect(servicioToken.obtenerToken()).toBeNull();
    expect(enrutadorSpy.navigate).toHaveBeenCalledWith(['/acceso']);
  });

  it('debería limpiar tokens y redirigir a /acceso en un error 403', () => {
    servicioToken.guardarToken('token-activo');
    const error = new HttpErrorResponse({ status: 403, statusText: 'Forbidden' });

    const handlerFake = { handle: () => throwError(() => error) } as unknown as HttpHandler;

    interceptor.intercept(new HttpRequest('GET', '/api/admin'), handlerFake)
      .subscribe({ error: () => {} });

    expect(servicioToken.obtenerToken()).toBeNull();
    expect(enrutadorSpy.navigate).toHaveBeenCalledWith(['/acceso']);
  });

  it('no debería limpiar tokens ni redirigir en un error 500', () => {
    servicioToken.guardarToken('token-activo');
    const error = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });

    const handlerFake = { handle: () => throwError(() => error) } as unknown as HttpHandler;

    interceptor.intercept(new HttpRequest('GET', '/api/datos'), handlerFake)
      .subscribe({ error: () => {} });

    expect(servicioToken.obtenerToken()).toBe('token-activo');
    expect(enrutadorSpy.navigate).not.toHaveBeenCalled();
  });

  it('debería dejar pasar una respuesta exitosa sin modificarla', () => {
    let respuesta: any;
    const handlerFake = { handle: () => of({ body: 'ok' }) } as unknown as HttpHandler;

    interceptor.intercept(new HttpRequest('GET', '/api/test'), handlerFake)
      .subscribe(r => respuesta = r);

    expect(respuesta).toEqual({ body: 'ok' });
  });
});
