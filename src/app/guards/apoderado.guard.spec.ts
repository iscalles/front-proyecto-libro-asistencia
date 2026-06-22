import { TestBed } from '@angular/core/testing';
import { UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { ServicioToken } from 'lib-auth';
import { apoderadoGuard } from './apoderado.guard';
import { InfoUsuario } from '../../../projects/lib-auth/src/lib/types/auth.types';

const usuarioBase: InfoUsuario = {
  idUsuario: '1',
  nombre: 'Test',
  correo: 'test@test.com',
  rutUsuario: '12345678-5',
  roles: [],
};

describe('apoderadoGuard', () => {
  let servicioToken: ServicioToken;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    servicioToken = TestBed.inject(ServicioToken);
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  it('debería permitir el acceso si el usuario tiene rol APODERADO', () => {
    servicioToken.guardarInfoUsuario({ ...usuarioBase, roles: ['APODERADO'] });

    const resultado = TestBed.runInInjectionContext(() => apoderadoGuard({} as any, {} as any));

    expect(resultado).toBeTrue();
  });

  it('debería redirigir a /dashboard si el usuario no tiene rol APODERADO', () => {
    servicioToken.guardarInfoUsuario({ ...usuarioBase, roles: ['DOCENTE'] });

    const resultado = TestBed.runInInjectionContext(() => apoderadoGuard({} as any, {} as any));

    expect(resultado).toBeInstanceOf(UrlTree);
    expect((resultado as UrlTree).toString()).toBe('/dashboard');
  });

  it('debería redirigir a /dashboard si no hay usuario autenticado', () => {
    const resultado = TestBed.runInInjectionContext(() => apoderadoGuard({} as any, {} as any));

    expect(resultado).toBeInstanceOf(UrlTree);
    expect((resultado as UrlTree).toString()).toBe('/dashboard');
  });
});
