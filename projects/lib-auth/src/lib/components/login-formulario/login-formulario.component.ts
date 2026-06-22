import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ComponenteEntradaFormulario } from '../input-formulario/input-formulario.component';
import { ComponenteContrasenaConmutable } from '../password-input/password-input.component';
import { ServicioAutenticacion } from '../../services/auth.service';
import { ServicioValidadorRut } from '../../services/rut-validator.service';
import { ErrorAutenticacion } from '../../types/auth.types';

/**
 * ComponenteFormularioAcceso
 * Componente principal del formulario de login
 * Gestiona el flujo de autenticación del usuario con validación y manejo de errores
 */
@Component({
  selector: 'app-formulario-acceso',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ComponenteEntradaFormulario,
    ComponenteContrasenaConmutable
  ],
  templateUrl: './login-formulario.component.html',
  styleUrl: './login-formulario.component.scss'
})
export class ComponenteFormularioAcceso implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  serverError: ErrorAutenticacion | null = null;
  showPassword = false;

  // ── Recuperar contraseña ─────────────────────────────────────────────────────
  mostrarRecuperar = false;
  recuperarForm!: FormGroup;
  recuperarEnviando = false;
  recuperarExito = false;

  constructor(
    private constructorFormulario: FormBuilder,
    private servicioAutenticacion: ServicioAutenticacion,
    private validadorRut: ServicioValidadorRut,
    private enrutador: Router
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.recuperarForm = this.constructorFormulario.group({
      correo: ['', [Validators.required, Validators.email]]
    });
  }

  abrirRecuperar(evento: Event): void {
    evento.preventDefault();
    this.mostrarRecuperar = true;
    this.recuperarExito = false;
    this.recuperarForm.reset();
  }

  volverAlLogin(): void {
    this.mostrarRecuperar = false;
  }

  get errorCorreoRecuperar(): string | null {
    const control = this.recuperarForm.get('correo');
    if (!control?.errors || !control?.touched) return null;
    if (control.errors['required']) return 'El correo es requerido';
    if (control.errors['email']) return 'Ingresa un correo válido';
    return null;
  }

  enviarRecuperacion(): void {
    if (this.recuperarForm.invalid) {
      this.recuperarForm.markAllAsTouched();
      return;
    }
    this.recuperarEnviando = true;
    this.servicioAutenticacion.recuperarPassword(this.recuperarForm.value.correo).subscribe({
      next: () => {
        this.recuperarEnviando = false;
        this.recuperarExito = true;
      },
      error: () => {
        // Aun si la llamada falla por un problema de red, no se distingue el motivo
        // al usuario: el mensaje de éxito es siempre el mismo por seguridad.
        this.recuperarEnviando = false;
        this.recuperarExito = true;
      }
    });
  }

  /**
   * Inicializa el formulario reactivo con validadores
   */
  private inicializarFormulario(): void {
    this.loginForm = this.constructorFormulario.group({
      rutUsuario: [  
        '',
        [Validators.required, this.validadorRutFn.bind(this)]
      ],
      password: [
        '',
        [Validators.required, Validators.minLength(6)]
      ]
    });
  }

  /**
   * Validador personalizado para el campo RUT
   */
  private validadorRutFn(control: any): { [key: string]: any } | null {
    if (!control.value) {
      return null;
    }

    if (!this.validadorRut.validateRut(control.value)) {
      return { invalidRut: { value: control.value } };
    }

    return null;
  }

  /**
   * Obtiene errores del control RUT para mostrar
   */
  obtenerErrorRut(): string | null {
    const rutControl = this.loginForm.get('rutUsuario');
    if (!rutControl?.errors || !rutControl?.touched) {
      return null;
    }

    if (rutControl.errors['required']) {
      return 'El RUT es requerido';
    }
    if (rutControl.errors['invalidRut']) {
      return 'Por favor ingrese un RUT válido (ej: 12.345.678-9)';
    }

    return null;
  }

  /**
   * Obtiene errores del control de contraseña para mostrar
   */
  obtenerErrorContrasena(): string | null {
    const passwordControl = this.loginForm.get('password');
    if (!passwordControl?.errors || !passwordControl?.touched) {
      return null;
    }

    if (passwordControl.errors['required']) {
      return 'La contraseña es requerida';
    }
    if (passwordControl.errors['minlength']) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }

    return null;
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (!this.loginForm.valid) return;

    this.isLoading = true;
    const credenciales = {
      // formatRut normaliza a xx.xxx.xxx-x antes de enviar al backend,
      // independiente de si el usuario escribió con o sin puntos
      rutUsuario: this.validadorRut.formatRut(this.loginForm.get('rutUsuario')?.value),
      password: this.loginForm.get('password')?.value
    };

    this.servicioAutenticacion.iniciarSesion(credenciales)
      .subscribe({
        next: () => {
          this.enrutador.navigate(['/dashboard']);
        },
        error: (error: ErrorAutenticacion) => {
          this.serverError = error;
          this.isLoading = false;
        }
      });
  }

  /**
   * Limpia el error del servidor cuando el usuario comienza a escribir
   */
  onInputChange(): void {
    if (this.serverError) {
      this.serverError = null;
    }
  }

  /**
   * Getter para validez del formulario
   */
  get esFormularioValido(): boolean {
    return this.loginForm.valid && !this.isLoading;
  }

  /**
   * Getter para estado deshabilitado del botón
   */
  get estaDeshabilitadoEnvio(): boolean {
    return this.loginForm.invalid || this.isLoading;
  }
}
