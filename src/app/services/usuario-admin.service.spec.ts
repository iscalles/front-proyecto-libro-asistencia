import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ServicioUsuarioAdmin } from './usuario-admin.service';
import { UsuarioDTO, UsuarioDTOResponse, UsuarioDTOInternal } from '../models/usuario-admin.models';

const API = 'http://localhost:8080';

const usuarioDTOMock: UsuarioDTO = {
  rutUsuario: '12345678-5',
  nombreUsuario: 'Juan',
  primerApellidoUsuario: 'Pérez',
  correoUsuario: 'juan@test.com',
  fechaNacUsuario: '2000-01-01',
};

const usuarioResponseMock: UsuarioDTOResponse = {
  idUsuario: 1,
  nombreUsuario: 'Juan',
  primerApellidoUsuario: 'Pérez',
  segundoApellidoUsuario: '',
  correoUsuario: 'juan@test.com',
  fechaNacUsuario: '2000-01-01',
  roles: [],
};

describe('ServicioUsuarioAdmin', () => {
  let servicio: ServicioUsuarioAdmin;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(ServicioUsuarioAdmin);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ── Usuarios ───────────────────────────────────────────────────────────────

  it('listarUsuarios() debe GET a /usuario', () => {
    servicio.listarUsuarios().subscribe(u => expect(u).toEqual([usuarioResponseMock]));

    const req = httpMock.expectOne(`${API}/usuario`);
    expect(req.request.method).toBe('GET');
    req.flush([usuarioResponseMock]);
  });

  it('obtenerUsuarios() debe GET a /usuario/interno', () => {
    const interno: UsuarioDTOInternal = { ...usuarioResponseMock, rutUsuario: '12345678-5' };

    servicio.obtenerUsuarios().subscribe(u => expect(u).toEqual([interno]));

    const req = httpMock.expectOne(`${API}/usuario/interno`);
    expect(req.request.method).toBe('GET');
    req.flush([interno]);
  });

  it('crearUsuario() debe POST a /usuario con el body correcto', () => {
    servicio.crearUsuario(usuarioDTOMock).subscribe(u => expect(u.idUsuario).toBe(1));

    const req = httpMock.expectOne(`${API}/usuario`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(usuarioDTOMock);
    req.flush(usuarioResponseMock);
  });

  it('actualizarUsuario() debe PUT a /usuario/:id', () => {
    servicio.actualizarUsuario(1, usuarioDTOMock).subscribe();

    const req = httpMock.expectOne(`${API}/usuario/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(usuarioResponseMock);
  });

  it('eliminarUsuario() debe DELETE a /usuario/:id', () => {
    servicio.eliminarUsuario(1).subscribe();

    const req = httpMock.expectOne(`${API}/usuario/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // ── Roles ──────────────────────────────────────────────────────────────────

  it('asignarRol() debe POST a /usuario-rol/usuario/:id/rol/:rol', () => {
    servicio.asignarRol(1, 'DOCENTE').subscribe();

    const req = httpMock.expectOne(`${API}/usuario-rol/usuario/1/rol/DOCENTE`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('quitarRol() debe DELETE a /usuario-rol/usuario/:id/rol/:rol', () => {
    servicio.quitarRol(1, 'DOCENTE').subscribe();

    const req = httpMock.expectOne(`${API}/usuario-rol/usuario/1/rol/DOCENTE`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // ── generarContrasena() — lógica pura, sin HTTP ────────────────────────────

  it('generarContrasena() debe retornar una cadena de 12 caracteres', () => {
    const contrasena = servicio.generarContrasena();
    expect(contrasena.length).toBe(12);
  });

  it('generarContrasena() debe incluir al menos una mayúscula, una minúscula y un número', () => {
    // Corremos 10 veces para reducir la probabilidad de falso positivo por aleatoriedad
    for (let i = 0; i < 10; i++) {
      const c = servicio.generarContrasena();
      expect(/[A-Z]/.test(c)).toBeTrue();
      expect(/[a-z]/.test(c)).toBeTrue();
      expect(/[0-9]/.test(c)).toBeTrue();
    }
  });

  it('generarContrasena() no debe incluir caracteres ambiguos (0, O, I, l, 1)', () => {
    for (let i = 0; i < 20; i++) {
      const c = servicio.generarContrasena();
      expect(/[0OIl1]/.test(c)).toBeFalse();
    }
  });

  // ── crearUsuarioCompleto() — operación compuesta con forkJoin ──────────────

  it('crearUsuarioCompleto() debe crear usuario, cuenta y asignar rol en secuencia', () => {
    let resultado: any;

    servicio.crearUsuarioCompleto(usuarioDTOMock, ['DOCENTE']).subscribe(r => resultado = r);

    httpMock.expectOne(`${API}/usuario`).flush(usuarioResponseMock);
    httpMock.expectOne(`${API}/cuenta-acceso/inicializar`).flush({});
    httpMock.expectOne(`${API}/usuario-rol/usuario/1/rol/DOCENTE`).flush({});
    httpMock.expectOne(`${API}/docente`).flush({});

    expect(resultado.usuario).toEqual(usuarioResponseMock);
    expect(typeof resultado.contrasena).toBe('string');
    expect(resultado.contrasena.length).toBe(12);
  });

  it('crearUsuarioCompleto() debe crear perfil APODERADO correctamente', () => {
    servicio.crearUsuarioCompleto(usuarioDTOMock, ['APODERADO']).subscribe();

    httpMock.expectOne(`${API}/usuario`).flush(usuarioResponseMock);
    httpMock.expectOne(`${API}/cuenta-acceso/inicializar`).flush({});
    httpMock.expectOne(`${API}/usuario-rol/usuario/1/rol/APODERADO`).flush({});
    httpMock.expectOne(`${API}/apoderado`).flush({});
  });

  it('crearUsuarioCompleto() debe crear perfil ADMINISTRATIVO correctamente', () => {
    servicio.crearUsuarioCompleto(usuarioDTOMock, ['ADMINISTRATIVO']).subscribe();

    httpMock.expectOne(`${API}/usuario`).flush(usuarioResponseMock);
    httpMock.expectOne(`${API}/cuenta-acceso/inicializar`).flush({});
    httpMock.expectOne(`${API}/usuario-rol/usuario/1/rol/ADMINISTRATIVO`).flush({});
    httpMock.expectOne(`${API}/administrativo`).flush({});
  });

  it('crearUsuarioCompleto() debe crear perfil ESTUDIANTE correctamente', () => {
    servicio.crearUsuarioCompleto(usuarioDTOMock, ['ESTUDIANTE']).subscribe();

    httpMock.expectOne(`${API}/usuario`).flush(usuarioResponseMock);
    httpMock.expectOne(`${API}/cuenta-acceso/inicializar`).flush({});
    httpMock.expectOne(`${API}/usuario-rol/usuario/1/rol/ESTUDIANTE`).flush({});
    httpMock.expectOne(`${API}/estudiante`).flush({});
  });

  it('sincronizarRoles() debe retornar of(null) si no hay cambios', () => {
    let resultado: any;
    servicio.sincronizarRoles(1, [], []).subscribe(r => resultado = r);
    expect(resultado).toBeNull();
  });
});
