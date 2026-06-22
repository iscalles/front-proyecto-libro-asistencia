import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { ServicioToken } from 'lib-auth';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let servicioToken: ServicioToken;
  let enrutador: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    servicioToken = TestBed.inject(ServicioToken);
    enrutador = TestBed.inject(Router);
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  it('debería permitir el acceso cuando el usuario está autenticado', () => {
    servicioToken.guardarToken('token-valido');

    // Los guards son funciones, no clases — se ejecutan con runInInjectionContext
    // para que inject() funcione dentro de ellos
    const resultado = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(resultado).toBeTrue();
  });

  it('debería redirigir a /acceso cuando no hay token', () => {
    const resultado = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(resultado).toBeInstanceOf(UrlTree);
    expect((resultado as UrlTree).toString()).toBe('/acceso');
  });
});
