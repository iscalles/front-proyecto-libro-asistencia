import { Component, HostListener, computed, inject, signal, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ServicioToken, ServicioAutenticacion } from 'lib-auth';
import { ServicioUsuarioAdmin } from '../../services/usuario-admin.service';

const CONFIG_ROLES: Record<string, { etiqueta: string; clase: string }> = {
  DOCENTE:        { etiqueta: 'Docente',        clase: 'bg-success' },
  APODERADO:      { etiqueta: 'Apoderado',      clase: 'bg-primary' },
  ADMINISTRATIVO: { etiqueta: 'Administrativo', clase: 'bg-danger'  },
  ESTUDIANTE:     { etiqueta: 'Estudiante',     clase: 'bg-warning text-dark' },
};

// Validador de grupo: confirmar contraseña debe coincidir con passwordNuevo
function passwordsCoinciden(group: AbstractControl) {
  const nuevo     = group.get('passwordNuevo')?.value;
  const confirmar = group.get('confirmarPassword')?.value;
  return nuevo === confirmar ? null : { noCoinciden: true };
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss'
})
export class PáginaDashboard {
  private servicioToken  = inject(ServicioToken);
  private servicioAuth   = inject(ServicioAutenticacion);
  private servicioAdmin  = inject(ServicioUsuarioAdmin);
  private fb             = inject(FormBuilder);
  private enrutador      = inject(Router);

  readonly usuario = this.servicioToken.obtenerSeñalInfoUsuario();

  readonly rolesFormateados = computed(() => {
    const roles = this.usuario()?.roles ?? [];
    return roles.map(rol => CONFIG_ROLES[rol] ?? { etiqueta: rol, clase: 'bg-secondary' });
  });

  private readonly _rolSeleccionado = signal<string | null>(this.servicioToken.obtenerRolActivo());

  readonly rolActivo = computed(() => {
    const roles = this.rolesFormateados();
    const seleccionado = this._rolSeleccionado();
    return roles.find(r => r.etiqueta === seleccionado) ?? roles[0];
  });

  // Si la cuenta se creó recién (contraseña temporal enviada por correo), se obliga a
  // definir una propia antes de poder usar el resto de la app.
  readonly debeCambiarPassword = computed(() => this.usuario()?.debeCambiarPassword ?? false);

  constructor() {
    effect(() => {
      if (this.debeCambiarPassword()) {
        this.mostrarModalContrasena.set(true);
      }
    });
  }

  readonly saludo = computed(() => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  });

  //Dropdown de rol
  readonly estaAbiertoDropdownRol   = signal(false);
  readonly estaAbiertoMenuUsuario   = signal(false);

  toggleDropdownRol(evento: MouseEvent): void {
    evento.stopPropagation();
    this.estaAbiertoDropdownRol.update(v => !v);
    this.estaAbiertoMenuUsuario.set(false);
  }

  toggleMenuUsuario(evento: MouseEvent): void {
    evento.stopPropagation();
    this.estaAbiertoMenuUsuario.update(v => !v);
    this.estaAbiertoDropdownRol.set(false);
  }

  @HostListener('document:click')
  cerrarDropdowns(): void {
    this.estaAbiertoDropdownRol.set(false);
    this.estaAbiertoMenuUsuario.set(false);
  }

  cambiarRol(rol: { etiqueta: string; clase: string }, evento: MouseEvent): void {
    evento.stopPropagation();
    this._rolSeleccionado.set(rol.etiqueta);
    this.servicioToken.guardarRolActivo(rol.etiqueta);
    this.estaAbiertoDropdownRol.set(false);
  }

  //Modal cambio de contraseña
  readonly mostrarModalContrasena = signal(false);
  readonly guardandoContrasena    = signal(false);
  readonly errorContrasena        = signal<string | null>(null);
  readonly exitoContrasena        = signal(false);

  readonly formContrasena = this.fb.group(
    {
      passwordActual:    ['', Validators.required],
      passwordNuevo:     ['', [Validators.required, Validators.minLength(6)]],
      confirmarPassword: ['', Validators.required],
    },
    { validators: passwordsCoinciden }
  );

  abrirCambiarContrasena(): void {
    this.estaAbiertoMenuUsuario.set(false);
    this.formContrasena.reset();
    this.errorContrasena.set(null);
    this.exitoContrasena.set(false);
    this.mostrarModalContrasena.set(true);
  }

  cerrarModalContrasena(): void {
    this.mostrarModalContrasena.set(false);
  }

  errorCampoContrasena(campo: string, tipo: string): boolean {
    const c = this.formContrasena.get(campo);
    return !!(c?.hasError(tipo) && c.touched);
  }

  guardarContrasena(): void {
    if (this.formContrasena.invalid) {
      this.formContrasena.markAllAsTouched();
      return;
    }
    const idUsuario = Number(this.usuario()?.idUsuario);
    const { passwordActual, passwordNuevo } = this.formContrasena.value;

    this.guardandoContrasena.set(true);
    this.errorContrasena.set(null);

    this.servicioAdmin.cambiarContrasena(idUsuario, passwordActual!, passwordNuevo!).subscribe({
      next: () => {
        this.guardandoContrasena.set(false);
        this.exitoContrasena.set(true);

        // Limpia el flag localmente: si era un cambio obligatorio, deja de serlo
        // y el modal ya puede cerrarse sin volver a forzarse.
        const infoActual = this.usuario();
        if (infoActual) {
          this.servicioToken.guardarInfoUsuario({ ...infoActual, debeCambiarPassword: false });
        }

        // Cierra el modal automáticamente tras 2 segundos
        setTimeout(() => this.cerrarModalContrasena(), 2000);
      },
      error: (e: HttpErrorResponse) => {
        this.guardandoContrasena.set(false);
        this.errorContrasena.set(e.error?.message ?? 'No se pudo actualizar la contraseña.');
      }
    });
  }

  cerrarSesion(): void {
    this.servicioAuth.cerrarSesion().subscribe({
      next: () => this.enrutador.navigate(['/acceso']),
      error: () => this.enrutador.navigate(['/acceso']),
    });
  }
}
