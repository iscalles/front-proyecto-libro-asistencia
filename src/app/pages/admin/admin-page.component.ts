import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ServicioToken } from 'lib-auth';
import { ServicioUsuarioAdmin } from '../../services/usuario-admin.service';
import {
  UsuarioDTOInternal, UsuarioDTO,
  TipoRol, ROLES_DISPONIBLES, ETIQUETAS_ROL, CLASE_ROL
} from '../../models/usuario-admin.models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.scss'
})
export class PáginaAdmin implements OnInit {
  private servicioToken = inject(ServicioToken);
  private servicioAdmin = inject(ServicioUsuarioAdmin);
  private fb           = inject(FormBuilder);
  private enrutador    = inject(Router);

  readonly usuarioSesion = this.servicioToken.obtenerSeñalInfoUsuario();

  // ── Tabla y búsqueda ───────────────────────────────────────────────────────
  readonly usuarios     = signal<UsuarioDTOInternal[]>([]);
  readonly busqueda     = signal('');
  readonly cargando     = signal(false);
  readonly errorTabla   = signal<string | null>(null);

  // Filtra client-side por RUT o nombre completo (sin distinguir mayúsculas)
  readonly usuariosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    if (!q) return this.usuarios();
    return this.usuarios().filter(u =>
      u.rutUsuario?.toLowerCase().includes(q) ||
      this.nombreCompleto(u).toLowerCase().includes(q)
    );
  });

  // ── Estado de modales ──────────────────────────────────────────────────────
  readonly guardando    = signal(false);
  readonly errorModal   = signal<string | null>(null);

  // Señales de apertura de cada modal
  readonly modalCrear       = signal(false);
  readonly usuarioEditando  = signal<UsuarioDTOInternal | null>(null);
  readonly usuarioRoles     = signal<UsuarioDTOInternal | null>(null);
  readonly usuarioEliminar  = signal<UsuarioDTOInternal | null>(null);
  // Muestra la contraseña generada tras crear un usuario exitosamente
  readonly credencialesNuevo = signal<{ nombre: string; correo: string; contrasena: string } | null>(null);

  // Roles en el modal de crear
  readonly rolesParaCrear   = signal<Set<TipoRol>>(new Set());
  // Roles en el modal de gestionar roles (copia editable)
  readonly rolesEditables   = signal<Set<TipoRol>>(new Set());

  // Constantes para el template — cast a Record<string,string> porque
  // u.roles viene del backend como string[], no como TipoRol[]
  readonly rolesDisponibles = ROLES_DISPONIBLES;
  readonly etiquetasRol     = ETIQUETAS_ROL as Record<string, string>;
  readonly claseRol         = CLASE_ROL    as Record<string, string>;

  // Formulario compartido entre crear y editar
  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      rutUsuario:             ['', [Validators.required, Validators.pattern(/^\d{1,2}\.\d{3}\.\d{3}-[0-9kK]$/)]],
      nombreUsuario:          ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
      primerApellidoUsuario:  ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
      segundoApellidoUsuario: ['', [Validators.maxLength(40)]],
      correoUsuario:          ['', [Validators.required, Validators.email]],
      fechaNacUsuario:        ['', [Validators.required]],
    });
    this.cargarUsuarios();
  }

  // ── Tabla ──────────────────────────────────────────────────────────────────

  cargarUsuarios(): void {
    this.cargando.set(true);
    this.errorTabla.set(null);
    this.servicioAdmin.obtenerUsuarios().subscribe({
      next: lista => { this.usuarios.set(lista); this.cargando.set(false); },
      error: () => {
        this.errorTabla.set('No se pudo cargar la lista. Verifica que los servicios estén activos.');
        this.cargando.set(false);
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  nombreCompleto(u: { nombreUsuario: string; primerApellidoUsuario: string; segundoApellidoUsuario?: string }): string {
    return [u.nombreUsuario, u.primerApellidoUsuario, u.segundoApellidoUsuario]
      .filter(Boolean).join(' ');
  }

  error(campo: string, tipo: string): boolean {
    const c = this.form.get(campo);
    return !!(c?.hasError(tipo) && c.touched);
  }

  // ── Modal CREAR ────────────────────────────────────────────────────────────

  abrirCrear(): void {
    this.form.reset();
    this.form.get('rutUsuario')?.enable();
    this.rolesParaCrear.set(new Set());
    this.errorModal.set(null);
    this.modalCrear.set(true);
  }

  cerrarCrear(): void { this.modalCrear.set(false); }

  toggleRolCrear(rol: TipoRol): void {
    this.rolesParaCrear.update(s => {
      const n = new Set(s);
      n.has(rol) ? n.delete(rol) : n.add(rol);
      return n;
    });
  }

  guardarCrear(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    this.errorModal.set(null);
    const dto: UsuarioDTO = this.form.value;
    const roles = [...this.rolesParaCrear()] as TipoRol[];
    this.servicioAdmin.crearUsuarioCompleto(dto, roles).subscribe({
      next: ({ usuario, contrasena }) => {
        this.guardando.set(false);
        this.cerrarCrear();
        this.cargarUsuarios();
        // Muestra las credenciales al admin para que las comunique al usuario
        this.credencialesNuevo.set({
          nombre:    `${usuario.nombreUsuario} ${usuario.primerApellidoUsuario}`,
          correo:    usuario.correoUsuario,
          contrasena
        });
      },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errorModal.set(e.error?.message ?? 'Error al crear el usuario. Revisa los datos.');
      }
    });
  }

  // ── Modal EDITAR ───────────────────────────────────────────────────────────

  abrirEditar(u: UsuarioDTOInternal): void {
    this.errorModal.set(null);
    // Ya tenemos el RUT porque usamos el endpoint interno para listar
    this.servicioAdmin.obtenerUsuarioInterno(u.idUsuario).subscribe({
      next: interno => {
        this.usuarioEditando.set(interno);
        this.form.patchValue({
          rutUsuario:             interno.rutUsuario,
          nombreUsuario:          interno.nombreUsuario,
          primerApellidoUsuario:  interno.primerApellidoUsuario,
          segundoApellidoUsuario: interno.segundoApellidoUsuario ?? '',
          correoUsuario:          interno.correoUsuario,
          fechaNacUsuario:        interno.fechaNacUsuario?.split('T')[0] ?? '',
        });
        this.form.get('rutUsuario')?.disable(); // el RUT no se modifica
      },
      error: () => this.errorTabla.set('No se pudo cargar los datos del usuario.')
    });
  }

  cerrarEditar(): void {
    this.usuarioEditando.set(null);
    this.form.get('rutUsuario')?.enable();
  }

  guardarEditar(): void {
    const u = this.usuarioEditando();
    if (!u || this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    this.errorModal.set(null);
    // getRawValue() incluye campos disabled (rutUsuario)
    const dto: UsuarioDTO = this.form.getRawValue();
    this.servicioAdmin.actualizarUsuario(u.idUsuario, dto).subscribe({
      next: () => { this.guardando.set(false); this.cerrarEditar(); this.cargarUsuarios(); },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errorModal.set(e.error?.message ?? 'Error al actualizar el usuario.');
      }
    });
  }

  // ── Modal ROLES ────────────────────────────────────────────────────────────

  abrirRoles(u: UsuarioDTOInternal): void {
    this.usuarioRoles.set(u);
    this.rolesEditables.set(new Set(u.roles as TipoRol[]));
    this.errorModal.set(null);
  }

  cerrarRoles(): void { this.usuarioRoles.set(null); }

  toggleRolEditable(rol: TipoRol): void {
    this.rolesEditables.update(s => {
      const n = new Set(s);
      n.has(rol) ? n.delete(rol) : n.add(rol);
      return n;
    });
  }

  guardarRoles(): void {
    const u = this.usuarioRoles();
    if (!u) return;
    this.guardando.set(true);
    this.errorModal.set(null);
    const originales = new Set(u.roles as TipoRol[]);
    const nuevos     = this.rolesEditables();
    const agregar = [...nuevos].filter(r => !originales.has(r)) as TipoRol[];
    const quitar  = [...originales].filter(r => !nuevos.has(r)) as TipoRol[];
    this.servicioAdmin.sincronizarRoles(u.idUsuario, agregar, quitar).subscribe({
      next: () => { this.guardando.set(false); this.cerrarRoles(); this.cargarUsuarios(); },
      error: () => {
        this.guardando.set(false);
        this.errorModal.set('Error al actualizar los roles. Algunos cambios pueden no haberse guardado.');
      }
    });
  }

  // ── Modal ELIMINAR ─────────────────────────────────────────────────────────

  abrirEliminar(u: UsuarioDTOInternal): void {
    this.usuarioEliminar.set(u);
    this.errorModal.set(null);
  }

  cerrarEliminar(): void { this.usuarioEliminar.set(null); }

  confirmarEliminar(): void {
    const u = this.usuarioEliminar();
    if (!u) return;
    this.guardando.set(true);
    this.servicioAdmin.eliminarUsuario(u.idUsuario).subscribe({
      next: () => { this.guardando.set(false); this.cerrarEliminar(); this.cargarUsuarios(); },
      error: () => {
        this.guardando.set(false);
        this.errorModal.set('No se pudo eliminar el usuario.');
      }
    });
  }

  irAlDashboard(): void { this.enrutador.navigate(['/dashboard']); }
}
