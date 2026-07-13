import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PáginaDashboard } from './dashboard-page.component';
import { ServicioToken, ServicioAutenticacion, AUTH_API_URL } from 'lib-auth';
import { ServicioUsuarioAdmin } from '../../services/usuario-admin.service';
import { InfoUsuario } from '../../../../projects/lib-auth/src/lib/types/auth.types';

const usuarioDocente: InfoUsuario = {
  idUsuario: '1',
  nombre: 'Juan Pérez',
  correo: 'juan@test.com',
  rutUsuario: '12345678-5',
  roles: ['DOCENTE'],
};

const usuarioMultiRol: InfoUsuario = {
  ...usuarioDocente,
  roles: ['DOCENTE', 'ADMINISTRATIVO'],
};

describe('PáginaDashboard', () => {
  let fixture: ComponentFixture<PáginaDashboard>;
  let componente: PáginaDashboard;
  let servicioToken: ServicioToken;
  let servicioAuth: jasmine.SpyObj<ServicioAutenticacion>;
  let servicioAdmin: jasmine.SpyObj<ServicioUsuarioAdmin>;
  let enrutador: Router;

  beforeEach(async () => {
    servicioAuth  = jasmine.createSpyObj('ServicioAutenticacion', ['cerrarSesion']);
    servicioAdmin = jasmine.createSpyObj('ServicioUsuarioAdmin', ['cambiarContrasena']);

    await TestBed.configureTestingModule({
      imports: [PáginaDashboard],
      providers: [
        provideRouter([]),
        { provide: ServicioAutenticacion, useValue: servicioAuth },
        { provide: ServicioUsuarioAdmin,  useValue: servicioAdmin },
        { provide: AUTH_API_URL, useValue: 'http://localhost:8080' },
      ],
    }).compileComponents();

    fixture    = TestBed.createComponent(PáginaDashboard);
    componente = fixture.componentInstance;
    servicioToken = TestBed.inject(ServicioToken);
    enrutador     = TestBed.inject(Router);
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  // ── Inicialización ─────────────────────────────────────────────────────────

  it('debería crear el componente', () => {
    fixture.detectChanges();
    expect(componente).toBeTruthy();
  });

  it('debería mostrar el nombre del usuario en el navbar', () => {
    servicioToken.guardarInfoUsuario(usuarioDocente);
    fixture.detectChanges();

    const navbar = fixture.nativeElement as HTMLElement;
    expect(navbar.textContent).toContain('Juan Pérez');
  });

  it('debería mostrar "Cargando información" si no hay usuario', () => {
    fixture.detectChanges();
    const main = fixture.nativeElement.querySelector('main');
    expect(main.textContent).toContain('Cargando información del usuario');
  });

  // ── rolesFormateados (computed) ────────────────────────────────────────────

  it('debería formatear el rol DOCENTE correctamente', () => {
    servicioToken.guardarInfoUsuario(usuarioDocente);
    fixture.detectChanges();

    const roles = componente.rolesFormateados();
    expect(roles[0].etiqueta).toBe('Docente');
    expect(roles[0].clase).toBe('bg-success');
  });

  it('debería formatear múltiples roles', () => {
    servicioToken.guardarInfoUsuario(usuarioMultiRol);
    fixture.detectChanges();

    const roles = componente.rolesFormateados();
    expect(roles.length).toBe(2);
    expect(roles.map(r => r.etiqueta)).toContain('Docente');
    expect(roles.map(r => r.etiqueta)).toContain('Administrativo');
  });

  it('debería usar bg-secondary para roles desconocidos', () => {
    servicioToken.guardarInfoUsuario({ ...usuarioDocente, roles: ['ROL_INEXISTENTE'] });
    fixture.detectChanges();

    expect(componente.rolesFormateados()[0].clase).toBe('bg-secondary');
  });

  // ── rolActivo (computed) ───────────────────────────────────────────────────

  it('rolActivo debería ser el primer rol si no hay selección previa', () => {
    servicioToken.guardarInfoUsuario(usuarioDocente);
    fixture.detectChanges();

    expect(componente.rolActivo().etiqueta).toBe('Docente');
  });

  it('debería mostrar los módulos correctos para el rol Docente', () => {
    servicioToken.guardarInfoUsuario(usuarioDocente);
    fixture.detectChanges();

    const dom = fixture.nativeElement as HTMLElement;
    expect(dom.textContent).toContain('Libro de Clases');
    expect(dom.textContent).toContain('Calificaciones');
    expect(dom.textContent).not.toContain('Gestión de Usuarios');
  });

  it('debería mostrar los módulos correctos para el rol Administrativo', () => {
    servicioToken.guardarInfoUsuario({ ...usuarioDocente, roles: ['ADMINISTRATIVO'] });
    fixture.detectChanges();

    const dom = fixture.nativeElement as HTMLElement;
    expect(dom.textContent).toContain('Gestión de Usuarios');
    expect(dom.textContent).toContain('Gestión Académica');
    expect(dom.textContent).not.toContain('Libro de Clases');
  });

  // ── cambiarRol ─────────────────────────────────────────────────────────────

  it('cambiarRol() debería actualizar el rol activo', () => {
    servicioToken.guardarInfoUsuario(usuarioMultiRol);
    fixture.detectChanges();

    const rolAdmin = componente.rolesFormateados().find(r => r.etiqueta === 'Administrativo')!;
    componente.cambiarRol(rolAdmin, new MouseEvent('click'));
    fixture.detectChanges();

    expect(componente.rolActivo().etiqueta).toBe('Administrativo');
  });

  it('cambiarRol() debería cerrar el dropdown', () => {
    servicioToken.guardarInfoUsuario(usuarioMultiRol);
    fixture.detectChanges();

    componente.estaAbiertoMenuUsuario.set(true);
    const rol = componente.rolesFormateados()[0];
    componente.cambiarRol(rol, new MouseEvent('click'));

    expect(componente.estaAbiertoMenuUsuario()).toBeFalse();
  });

  // ── saludo (computed) ──────────────────────────────────────────────────────

  it('saludo() debería retornar uno de los tres saludos posibles', () => {
    fixture.detectChanges();
    const saludos = ['Buenos días', 'Buenas tardes', 'Buenas noches'];
    expect(saludos).toContain(componente.saludo());
  });

  // ── cerrarSesion ───────────────────────────────────────────────────────────

  it('cerrarSesion() debería navegar a /acceso tras éxito', () => {
    servicioAuth.cerrarSesion.and.returnValue(of({}));
    spyOn(enrutador, 'navigate');
    fixture.detectChanges();

    componente.cerrarSesion();

    expect(enrutador.navigate).toHaveBeenCalledWith(['/acceso']);
  });

  it('cerrarSesion() debería navegar a /acceso aunque el backend falle', () => {
    servicioAuth.cerrarSesion.and.returnValue(throwError(() => new Error()));
    spyOn(enrutador, 'navigate');
    fixture.detectChanges();

    componente.cerrarSesion();

    expect(enrutador.navigate).toHaveBeenCalledWith(['/acceso']);
  });

  // ── Modal cambio de contraseña ─────────────────────────────────────────────

  it('abrirCambiarContrasena() debería mostrar el modal y limpiar el formulario', () => {
    fixture.detectChanges();
    componente.formContrasena.setValue({ passwordActual: 'vieja', passwordNuevo: 'nueva1', confirmarPassword: 'nueva1' });

    componente.abrirCambiarContrasena();

    expect(componente.mostrarModalContrasena()).toBeTrue();
    expect(componente.formContrasena.get('passwordActual')?.value).toBeNull();
  });

  it('cerrarModalContrasena() debería ocultar el modal', () => {
    fixture.detectChanges();
    componente.mostrarModalContrasena.set(true);
    componente.cerrarModalContrasena();

    expect(componente.mostrarModalContrasena()).toBeFalse();
  });

  it('guardarContrasena() debería marcar campos como tocados si el formulario es inválido', () => {
    fixture.detectChanges();
    componente.mostrarModalContrasena.set(true);

    componente.guardarContrasena();

    expect(componente.formContrasena.get('passwordActual')?.touched).toBeTrue();
    expect(servicioAdmin.cambiarContrasena).not.toHaveBeenCalled();
  });

  it('guardarContrasena() debería llamar al servicio con los datos correctos', () => {
    servicioToken.guardarInfoUsuario(usuarioDocente);
    servicioAdmin.cambiarContrasena.and.returnValue(of(undefined));
    fixture.detectChanges();

    componente.formContrasena.setValue({
      passwordActual: 'actual123',
      passwordNuevo: 'nueva123',
      confirmarPassword: 'nueva123',
    });
    componente.guardarContrasena();

    expect(servicioAdmin.cambiarContrasena).toHaveBeenCalledWith(1, 'actual123', 'nueva123');
  });

  it('guardarContrasena() debería mostrar éxito tras cambio correcto', () => {
    servicioToken.guardarInfoUsuario(usuarioDocente);
    servicioAdmin.cambiarContrasena.and.returnValue(of(undefined));
    fixture.detectChanges();

    componente.formContrasena.setValue({
      passwordActual: 'actual123',
      passwordNuevo: 'nueva123',
      confirmarPassword: 'nueva123',
    });
    componente.guardarContrasena();

    expect(componente.exitoContrasena()).toBeTrue();
    expect(componente.guardandoContrasena()).toBeFalse();
  });

  it('guardarContrasena() debería mostrar el error del servidor si falla', () => {
    servicioToken.guardarInfoUsuario(usuarioDocente);
    servicioAdmin.cambiarContrasena.and.returnValue(
      throwError(() => ({ error: { message: 'Contraseña actual incorrecta' } }))
    );
    fixture.detectChanges();

    componente.formContrasena.setValue({
      passwordActual: 'mal',
      passwordNuevo: 'nueva123',
      confirmarPassword: 'nueva123',
    });
    componente.guardarContrasena();

    expect(componente.errorContrasena()).toBe('Contraseña actual incorrecta');
    expect(componente.guardandoContrasena()).toBeFalse();
  });

  it('guardarContrasena() debería usar mensaje por defecto si el error no trae message', () => {
    servicioToken.guardarInfoUsuario(usuarioDocente);
    // Error sin propiedad message — activa la rama ?? del operador nullish
    servicioAdmin.cambiarContrasena.and.returnValue(throwError(() => ({ error: {} })));
    fixture.detectChanges();

    componente.formContrasena.setValue({
      passwordActual: 'mal',
      passwordNuevo: 'nueva123',
      confirmarPassword: 'nueva123',
    });
    componente.guardarContrasena();

    expect(componente.errorContrasena()).toBe('No se pudo actualizar la contraseña.');
  });

  it('formContrasena debería ser inválido si las contraseñas no coinciden', () => {
    fixture.detectChanges();
    componente.formContrasena.setValue({
      passwordActual: 'actual123',
      passwordNuevo: 'nueva123',
      confirmarPassword: 'diferente',
    });
    componente.formContrasena.get('confirmarPassword')?.markAsTouched();

    expect(componente.formContrasena.hasError('noCoinciden')).toBeTrue();
  });

  it('errorCampoContrasena() debería retornar false si el campo no fue tocado', () => {
    fixture.detectChanges();
    // passwordActual vacío pero sin tocar — no debería mostrar error
    expect(componente.errorCampoContrasena('passwordActual', 'required')).toBeFalse();
  });

  it('debería mostrar badge simple cuando el usuario tiene solo un rol', () => {
    servicioToken.guardarInfoUsuario(usuarioDocente); // solo DOCENTE
    fixture.detectChanges();

    // Con un solo rol no se muestra el dropdown sino el badge directamente
    const dropdown = fixture.nativeElement.querySelector('.dropdown-toggle-custom');
    expect(dropdown).toBeNull();
  });
});
