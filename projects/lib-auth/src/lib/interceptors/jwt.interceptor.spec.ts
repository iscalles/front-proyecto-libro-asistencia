import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ServicioToken } from '../services/token.service';
import { jwtInterceptor } from './jwt.interceptor';

describe('jwtInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let servicioToken: ServicioToken;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        // withInterceptors registra el interceptor en el pipeline de HttpClient
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    servicioToken = TestBed.inject(ServicioToken);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('debería agregar el header Authorization cuando hay token', () => {
    servicioToken.guardarToken('mi-token-jwt');

    // Hacemos una petición cualquiera — el interceptor la modifica antes de que salga
    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');

    // Verificamos que el interceptor agregó el header
    expect(req.request.headers.get('Authorization')).toBe('Bearer mi-token-jwt');
    req.flush({});
  });

  it('debería dejar pasar la petición sin header cuando no hay token', () => {
    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');

    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('debería actualizar el header si el token cambia entre peticiones', () => {
    servicioToken.guardarToken('token-uno');
    httpClient.get('/api/primera').subscribe();
    httpMock.expectOne('/api/primera').flush({});

    servicioToken.guardarToken('token-dos');
    httpClient.get('/api/segunda').subscribe();
    const req = httpMock.expectOne('/api/segunda');

    expect(req.request.headers.get('Authorization')).toBe('Bearer token-dos');
    req.flush({});
  });
});
