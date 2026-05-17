import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ServicioToken, ServicioAutenticacion } from 'lib-auth';

const CONFIG_ROLES: Record<string, { etiqueta: string; clase: string }> = {
  DOCENTE:   { etiqueta: 'Docente',        clase: 'bg-success' },
  APODERADO: { etiqueta: 'Apoderado',      clase: 'bg-primary' },
  ADMIN:     { etiqueta: 'Administrador',  clase: 'bg-danger'  },
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss'
})
export class PáginaDashboard {
  private servicioToken = inject(ServicioToken);
  private servicioAuth  = inject(ServicioAutenticacion);
  private enrutador     = inject(Router);

  readonly usuario = this.servicioToken.obtenerSeñalInfoUsuario();

  readonly rolesFormateados = computed(() => {
    const roles = this.usuario()?.roles ?? [];
    return roles.map(rol => CONFIG_ROLES[rol] ?? { etiqueta: rol, clase: 'bg-secondary' });
  });

  // Guarda el rol que el usuario eligió; null = usar el primero disponible
  private readonly _rolSeleccionado = signal<string | null>(null);

  // Rol activo: el seleccionado por el usuario, o el primero de la lista.
  // Un usuario autenticado siempre tiene al menos un rol, así que roles[0] es seguro.
  readonly rolActivo = computed(() => {
    const roles = this.rolesFormateados();
    const seleccionado = this._rolSeleccionado();
    return roles.find(r => r.etiqueta === seleccionado) ?? roles[0];
  });

  readonly estaAbiertoDropdown = signal(false);

  readonly saludo = computed(() => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  });

  toggleDropdown(evento: MouseEvent): void {
    evento.stopPropagation(); // evita que el click llegue al HostListener del documento
    this.estaAbiertoDropdown.update(v => !v);
  }

  // Cierra el dropdown cuando se hace click en cualquier otro lugar de la página
  @HostListener('document:click')
  cerrarDropdown(): void {
    this.estaAbiertoDropdown.set(false);
  }

  cambiarRol(rol: { etiqueta: string; clase: string }, evento: MouseEvent): void {
    evento.stopPropagation();
    this._rolSeleccionado.set(rol.etiqueta);
    this.estaAbiertoDropdown.set(false);
  }

  cerrarSesion(): void {
    this.servicioAuth.cerrarSesion().subscribe({
      next: () => this.enrutador.navigate(['/acceso']),
      error: () => this.enrutador.navigate(['/acceso']),
    });
  }
}
