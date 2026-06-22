import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { ComponenteFormularioAcceso } from './login-formulario.component';
import { ServicioAutenticacion, AUTH_API_URL } from '../../services/auth.service';
import { RespuestaAutenticacion, ErrorAutenticacion } from '../../types/auth.types';

const respuestaMock: RespuestaAutenticacion = {
  accessToken: 'token',
  refreshToken: 'refresh',
  idUsuario: '1',
  nombre: 'Juan',
  correo: 'juan@test.com',
  roles: ['DOCENTE'],
  expiresIn: 3600,
};

describe('ComponenteFormularioAcceso', () => {
  let fixture: ComponentFixture<ComponenteFormularioAcceso>;
  let componente: ComponenteFormularioAcceso;
  let servicioAuth: jasmine.SpyObj<ServicioAutenticacion>;
  let enrutador: Router;

  beforeEach(async () => {
    // Creamos el spy con los métodos que usa el componente
    servicioAuth = jasmine.createSpyObj('ServicioAutenticacion', ['iniciarSesion']);

    await TestBed.configureTestingModule({
      imports: [ComponenteFormularioAcceso],
      providers: [
        provideRouter([]),
        { provide: ServicioAutenticacion, useValue: servicioAuth },
        { provide: AUTH_API_URL, useValue: 'http://localhost:8080' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ComponenteFormularioAcceso);
    componente = fixture.componentInstance;
    enrutador = TestBed.inject(Router);
    fixture.detectChanges(); // ejecuta ngOnInit → inicializa el formulario
  });

  afterEach(() => localStorage.clear());

  // ── Inicialización ─────────────────────────────────────────────────────────

  it('debería crear el componente', () => {
    expect(componente).toBeTruthy();
  });

  it('debería inicializar el formulario con campos vacíos', () => {
    expect(componente.loginForm.get('rutUsuario')?.value).toBe('');
    expect(componente.loginForm.get('password')?.value).toBe('');
  });

  it('el formulario debería ser inválido cuando está vacío', () => {
    expect(componente.loginForm.valid).toBeFalse();
  });

  // ── Validación del RUT ─────────────────────────────────────────────────────

  it('debería marcar el RUT como inválido si el dígito verificador es incorrecto', () => {
    const control = componente.loginForm.get('rutUsuario')!;
    control.setValue('12.345.678-0'); // DV incorrecto
    control.markAsTouched();

    expect(control.errors?.['invalidRut']).toBeTruthy();
    expect(componente.obtenerErrorRut()).toContain('RUT válido');
  });

  it('debería aceptar un RUT válido', () => {
    const control = componente.loginForm.get('rutUsuario')!;
    control.setValue('12.345.678-5');

    expect(control.errors).toBeNull();
  });

  it('debería mostrar error "requerido" si el RUT está vacío y fue tocado', () => {
    const control = componente.loginForm.get('rutUsuario')!;
    control.setValue('');
    control.markAsTouched();

    expect(componente.obtenerErrorRut()).toBe('El RUT es requerido');
  });

  // ── Validación de contraseña ───────────────────────────────────────────────

  it('debería mostrar error si la contraseña tiene menos de 6 caracteres', () => {
    const control = componente.loginForm.get('password')!;
    control.setValue('123');
    control.markAsTouched();

    expect(componente.obtenerErrorContrasena()).toContain('6 caracteres');
  });

  it('debería aceptar una contraseña de 6 o más caracteres', () => {
    componente.loginForm.get('password')!.setValue('123456');
    expect(componente.loginForm.get('password')?.errors).toBeNull();
  });

  // ── onSubmit() ─────────────────────────────────────────────────────────────

  it('no debería llamar al servicio si el formulario es inválido', () => {
    componente.onSubmit();
    expect(servicioAuth.iniciarSesion).not.toHaveBeenCalled();
  });

  it('debería navegar a /dashboard tras un login exitoso', () => {
    servicioAuth.iniciarSesion.and.returnValue(of(respuestaMock));
    spyOn(enrutador, 'navigate');

    componente.loginForm.setValue({ rutUsuario: '12.345.678-5', password: '123456' });
    componente.onSubmit();

    expect(enrutador.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('debería activar isLoading mientras espera la respuesta', () => {
    // El observable nunca completa → isLoading queda en true
    servicioAuth.iniciarSesion.and.returnValue(new Subject());

    componente.loginForm.setValue({ rutUsuario: '12.345.678-5', password: '123456' });
    componente.onSubmit();

    expect(componente.isLoading).toBeTrue();
  });

  it('debería guardar el error del servidor cuando el login falla', () => {
    const error: ErrorAutenticacion = { codigo: 'CREDENCIALES_INVALIDAS', mensaje: 'RUT o contraseña incorrectos' };
    servicioAuth.iniciarSesion.and.returnValue(throwError(() => error));

    componente.loginForm.setValue({ rutUsuario: '12.345.678-5', password: '123456' });
    componente.onSubmit();
    fixture.detectChanges();

    expect(componente.serverError).toEqual(error);
    expect(componente.isLoading).toBeFalse();
  });

  it('debería mostrar el mensaje de error en el DOM cuando falla el login', () => {
    const error: ErrorAutenticacion = { codigo: 'CREDENCIALES_INVALIDAS', mensaje: 'RUT o contraseña incorrectos' };
    servicioAuth.iniciarSesion.and.returnValue(throwError(() => error));

    componente.loginForm.setValue({ rutUsuario: '12.345.678-5', password: '123456' });
    componente.onSubmit();
    fixture.detectChanges();

    const alerta = fixture.nativeElement.querySelector('.alert-danger');
    expect(alerta).not.toBeNull();
    expect(alerta.textContent).toContain('RUT o contraseña incorrectos');
  });

  // ── onInputChange() ────────────────────────────────────────────────────────

  it('debería limpiar el error del servidor al escribir en el formulario', () => {
    componente.serverError = { codigo: 'ERROR', mensaje: 'Algo salió mal' };

    componente.onInputChange();

    expect(componente.serverError).toBeNull();
  });

  it('no debería fallar si onInputChange() se llama sin error previo', () => {
    componente.serverError = null;
    expect(() => componente.onInputChange()).not.toThrow();
  });

  // ── Getters ────────────────────────────────────────────────────────────────

  it('estaDeshabilitadoEnvio debería ser true cuando el formulario es inválido', () => {
    expect(componente.estaDeshabilitadoEnvio).toBeTrue();
  });

  it('estaDeshabilitadoEnvio debería ser false cuando el formulario es válido', () => {
    componente.loginForm.setValue({ rutUsuario: '12.345.678-5', password: '123456' });
    expect(componente.estaDeshabilitadoEnvio).toBeFalse();
  });
});
