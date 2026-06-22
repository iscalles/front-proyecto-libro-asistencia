import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PáginaAdmin } from './admin-page.component';
import { ServicioToken, ServicioAutenticacion, AUTH_API_URL } from 'lib-auth';
import { ServicioUsuarioAdmin } from '../../services/usuario-admin.service';
import { UsuarioDTOInternal, UsuarioDTO } from '../../models/usuario-admin.models';
import { InfoUsuario } from '../../../../projects/lib-auth/src/lib/types/auth.types';

const adminSesion: InfoUsuario = {
  idUsuario: '99',
  nombre: 'Admin',
  correo: 'admin@test.com',
  rutUsuario: '12345678-5',
  roles: ['ADMINISTRATIVO'],
};

const usuariosMock: UsuarioDTOInternal[] = [
  { idUsuario: 1, rutUsuario: '11111111-1', nombreUsuario: 'Ana',  primerApellidoUsuario: 'López',  segundoApellidoUsuario: '', correoUsuario: 'ana@test.com',  fechaNacUsuario: '2000-01-01', roles: ['DOCENTE'] },
  { idUsuario: 2, rutUsuario: '22222222-2', nombreUsuario: 'Luis', primerApellidoUsuario: 'Pérez',  segundoApellidoUsuario: '', correoUsuario: 'luis@test.com', fechaNacUsuario: '1995-05-10', roles: ['ADMINISTRATIVO'] },
  { idUsuario: 3, rutUsuario: '33333333-3', nombreUsuario: 'Eva',  primerApellidoUsuario: 'Torres', segundoApellidoUsuario: '', correoUsuario: 'eva@test.com',  fechaNacUsuario: '2002-03-15', roles: ['APODERADO'] },
];

describe('PáginaAdmin', () => {
  let fixture: ComponentFixture<PáginaAdmin>;
  let componente: PáginaAdmin;
  let servicioToken: ServicioToken;
  let servicioAdmin: jasmine.SpyObj<ServicioUsuarioAdmin>;

  beforeEach(async () => {
    servicioAdmin = jasmine.createSpyObj('ServicioUsuarioAdmin', [
      'obtenerUsuarios',
      'obtenerUsuarioInterno',
      'crearUsuarioCompleto',
      'actualizarUsuario',
      'eliminarUsuario',
      'sincronizarRoles',
    ]);
    servicioAdmin.obtenerUsuarios.and.returnValue(of(usuariosMock));

    await TestBed.configureTestingModule({
      imports: [PáginaAdmin],
      providers: [
        provideRouter([]),
        { provide: ServicioUsuarioAdmin, useValue: servicioAdmin },
        { provide: AUTH_API_URL, useValue: 'http://localhost:8080' },
      ],
    }).compileComponents();

    fixture    = TestBed.createComponent(PáginaAdmin);
    componente = fixture.componentInstance;
    servicioToken = TestBed.inject(ServicioToken);
    servicioToken.guardarInfoUsuario(adminSesion);
    fixture.detectChanges(); // ejecuta ngOnInit → cargarUsuarios()
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  // ── Inicialización ─────────────────────────────────────────────────────────

  it('debería crear el componente', () => {
    expect(componente).toBeTruthy();
  });

  it('debería cargar los usuarios al iniciar', () => {
    expect(servicioAdmin.obtenerUsuarios).toHaveBeenCalled();
    expect(componente.usuarios().length).toBe(3);
  });

  it('debería mostrar error si cargarUsuarios() falla', () => {
    servicioAdmin.obtenerUsuarios.and.returnValue(throwError(() => new Error()));
    componente.cargarUsuarios();

    expect(componente.errorTabla()).toContain('No se pudo cargar');
    expect(componente.cargando()).toBeFalse();
  });

  // ── nombreCompleto (helper) ────────────────────────────────────────────────

  it('nombreCompleto() debería concatenar nombre y apellidos', () => {
    const resultado = componente.nombreCompleto({
      nombreUsuario: 'Juan',
      primerApellidoUsuario: 'Pérez',
      segundoApellidoUsuario: 'González',
    });
    expect(resultado).toBe('Juan Pérez González');
  });

  it('nombreCompleto() debería omitir el segundo apellido si está vacío', () => {
    const resultado = componente.nombreCompleto({
      nombreUsuario: 'Ana',
      primerApellidoUsuario: 'López',
      segundoApellidoUsuario: '',
    });
    expect(resultado).toBe('Ana López');
  });

  // ── usuariosFiltrados (computed) ───────────────────────────────────────────

  it('sin filtros debería retornar todos los usuarios', () => {
    expect(componente.usuariosFiltrados().length).toBe(3);
  });

  it('debería filtrar por RUT', () => {
    componente.busqueda.set('111111');
    expect(componente.usuariosFiltrados().length).toBe(1);
    expect(componente.usuariosFiltrados()[0].nombreUsuario).toBe('Ana');
  });

  it('debería filtrar por nombre (case insensitive)', () => {
    componente.busqueda.set('luis');
    expect(componente.usuariosFiltrados().length).toBe(1);
    expect(componente.usuariosFiltrados()[0].nombreUsuario).toBe('Luis');
  });

  it('debería filtrar por rol', () => {
    componente.rolFiltro.set('APODERADO');
    expect(componente.usuariosFiltrados().length).toBe(1);
    expect(componente.usuariosFiltrados()[0].nombreUsuario).toBe('Eva');
  });

  it('debería combinar filtro de búsqueda y rol', () => {
    componente.rolFiltro.set('DOCENTE');
    componente.busqueda.set('ana');
    expect(componente.usuariosFiltrados().length).toBe(1);
  });

  it('debería retornar lista vacía si no hay coincidencias', () => {
    componente.busqueda.set('zzz-no-existe');
    expect(componente.usuariosFiltrados().length).toBe(0);
  });

  // ── Modal CREAR ────────────────────────────────────────────────────────────

  it('abrirCrear() debería abrir el modal y limpiar el formulario', () => {
    componente.form.patchValue({ nombreUsuario: 'dato previo' });
    componente.abrirCrear();

    expect(componente.modalCrear()).toBeTrue();
    expect(componente.form.get('nombreUsuario')?.value).toBeNull();
    expect(componente.rolesParaCrear().size).toBe(0);
  });

  it('cerrarCrear() debería cerrar el modal', () => {
    componente.modalCrear.set(true);
    componente.cerrarCrear();
    expect(componente.modalCrear()).toBeFalse();
  });

  it('toggleRolCrear() debería agregar y quitar roles del set', () => {
    componente.toggleRolCrear('DOCENTE');
    expect(componente.rolesParaCrear().has('DOCENTE')).toBeTrue();

    componente.toggleRolCrear('DOCENTE');
    expect(componente.rolesParaCrear().has('DOCENTE')).toBeFalse();
  });

  it('guardarCrear() debería marcar campos como tocados si el formulario es inválido', () => {
    componente.abrirCrear();
    componente.guardarCrear();

    expect(componente.form.get('nombreUsuario')?.touched).toBeTrue();
    expect(servicioAdmin.crearUsuarioCompleto).not.toHaveBeenCalled();
  });

  it('guardarCrear() debería llamar crearUsuarioCompleto() con los datos correctos', () => {
    servicioAdmin.crearUsuarioCompleto.and.returnValue(
      of({ usuario: usuariosMock[0], contrasena: 'Abc12345' })
    );
    componente.abrirCrear();
    componente.toggleRolCrear('DOCENTE');
    componente.form.setValue({
      rutUsuario: '12.345.678-5', nombreUsuario: 'Ana', primerApellidoUsuario: 'López',
      segundoApellidoUsuario: '', correoUsuario: 'ana@test.com', fechaNacUsuario: '2000-01-01',
    });

    componente.guardarCrear();

    expect(servicioAdmin.crearUsuarioCompleto).toHaveBeenCalledWith(
      componente.form.value as UsuarioDTO,
      ['DOCENTE']
    );
  });

  it('guardarCrear() debería mostrar credenciales y recargar lista tras éxito', () => {
    servicioAdmin.crearUsuarioCompleto.and.returnValue(
      of({ usuario: usuariosMock[0], contrasena: 'Abc12345' })
    );
    componente.abrirCrear();
    componente.form.setValue({
      rutUsuario: '12.345.678-5', nombreUsuario: 'Ana', primerApellidoUsuario: 'López',
      segundoApellidoUsuario: '', correoUsuario: 'ana@test.com', fechaNacUsuario: '2000-01-01',
    });

    componente.guardarCrear();

    expect(componente.credencialesNuevo()).not.toBeNull();
    expect(componente.credencialesNuevo()?.contrasena).toBe('Abc12345');
    expect(servicioAdmin.obtenerUsuarios).toHaveBeenCalledTimes(2); // inicio + recarga
  });

  // ── Modal EDITAR ───────────────────────────────────────────────────────────

  it('abrirEditar() debería cargar los datos del usuario en el formulario', () => {
    servicioAdmin.obtenerUsuarioInterno.and.returnValue(of(usuariosMock[0]));

    componente.abrirEditar(usuariosMock[0]);

    expect(servicioAdmin.obtenerUsuarioInterno).toHaveBeenCalledWith(1);
    expect(componente.usuarioEditando()).toEqual(usuariosMock[0]);
    expect(componente.form.get('nombreUsuario')?.value).toBe('Ana');
  });

  it('guardarEditar() debería llamar actualizarUsuario() y recargar lista', () => {
    servicioAdmin.obtenerUsuarioInterno.and.returnValue(of(usuariosMock[0]));
    servicioAdmin.actualizarUsuario.and.returnValue(of(usuariosMock[0]));

    componente.abrirEditar(usuariosMock[0]);
    componente.guardarEditar();

    expect(servicioAdmin.actualizarUsuario).toHaveBeenCalled();
    expect(componente.usuarioEditando()).toBeNull();
  });

  // ── Modal ROLES ────────────────────────────────────────────────────────────

  it('abrirRoles() debería inicializar los roles editables con los del usuario', () => {
    componente.abrirRoles(usuariosMock[0]); // tiene DOCENTE

    expect(componente.usuarioRoles()).toEqual(usuariosMock[0]);
    expect(componente.rolesEditables().has('DOCENTE')).toBeTrue();
  });

  it('guardarRoles() debería llamar sincronizarRoles() con el diff correcto', () => {
    servicioAdmin.sincronizarRoles.and.returnValue(of(null));
    componente.abrirRoles(usuariosMock[0]); // tiene DOCENTE

    // Agrega APODERADO y quita DOCENTE
    componente.toggleRolEditable('APODERADO');
    componente.toggleRolEditable('DOCENTE');
    componente.guardarRoles();

    expect(servicioAdmin.sincronizarRoles).toHaveBeenCalledWith(
      1,
      ['APODERADO'],
      ['DOCENTE']
    );
  });

  it('guardarRoles() debería mostrar error si sincronizarRoles() falla', () => {
    servicioAdmin.sincronizarRoles.and.returnValue(throwError(() => new Error()));
    componente.abrirRoles(usuariosMock[0]);
    componente.toggleRolEditable('APODERADO');

    componente.guardarRoles();

    expect(componente.errorModal()).toContain('Error al actualizar');
  });

  // ── Modal ELIMINAR ─────────────────────────────────────────────────────────

  it('abrirEliminar() debería registrar el usuario a eliminar', () => {
    componente.abrirEliminar(usuariosMock[1]);
    expect(componente.usuarioEliminar()).toEqual(usuariosMock[1]);
  });

  it('confirmarEliminar() debería llamar eliminarUsuario() y recargar lista', () => {
    servicioAdmin.eliminarUsuario.and.returnValue(of(undefined));
    componente.abrirEliminar(usuariosMock[1]);

    componente.confirmarEliminar();

    expect(servicioAdmin.eliminarUsuario).toHaveBeenCalledWith(2);
    expect(componente.usuarioEliminar()).toBeNull();
    expect(servicioAdmin.obtenerUsuarios).toHaveBeenCalledTimes(2);
  });

  it('confirmarEliminar() debería mostrar error si el servicio falla', () => {
    servicioAdmin.eliminarUsuario.and.returnValue(throwError(() => new Error()));
    componente.abrirEliminar(usuariosMock[0]);

    componente.confirmarEliminar();

    expect(componente.errorModal()).toContain('No se pudo eliminar');
    expect(componente.guardando()).toBeFalse();
  });
});
