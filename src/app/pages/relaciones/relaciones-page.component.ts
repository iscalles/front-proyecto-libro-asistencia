import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ServicioRelaciones } from '../../services/relaciones.service';
import { ServicioToken } from 'lib-auth';
import {
  ApoderadoResponse, EstudianteResponse,
  RelacionApEst, UsuarioAnidado, OPCIONES_PARENTESCO
} from '../../models/relaciones.models';

@Component({
  selector: 'app-relaciones',
  standalone: true,
  templateUrl: './relaciones-page.component.html',
  styleUrl: './relaciones-page.component.scss'
})
export class PáginaRelaciones implements OnInit {
  private servicio     = inject(ServicioRelaciones);
  private servicioToken = inject(ServicioToken);
  private enrutador    = inject(Router);

  readonly usuarioSesion = this.servicioToken.obtenerSeñalInfoUsuario();

  // ── Datos principales ─────────────────────────────────────────────────────
  readonly apoderados  = signal<ApoderadoResponse[]>([]);
  readonly estudiantes = signal<EstudianteResponse[]>([]);
  readonly cargando    = signal(false);
  readonly error       = signal<string | null>(null);

  // Cache de relaciones por idApoderado (cargadas bajo demanda)
  readonly relacionesPor    = signal<Map<number, RelacionApEst[]>>(new Map());
  readonly cargandoRelPor   = signal<Set<number>>(new Set());

  readonly opcionesParentesco = OPCIONES_PARENTESCO;

  // ── Búsqueda de apoderados ───────────────────────────────────────────────
  readonly busquedaApoderado = signal('');

  readonly apoderadosFiltrados = computed(() => {
    const q = this.busquedaApoderado().toLowerCase().trim();
    if (!q) return this.apoderados();
    return this.apoderados().filter(a =>
      this.nombreCompleto(a.usuario).toLowerCase().includes(q) ||
      a.usuario.rutUsuario?.toLowerCase().includes(q)
    );
  });

  // ── Modal de asignación ───────────────────────────────────────────────────
  readonly apoderadoModal       = signal<ApoderadoResponse | null>(null);
  readonly estudianteSeleccionado = signal<number | null>(null);
  readonly parentesco           = signal('');
  readonly guardando            = signal(false);
  readonly errorModal           = signal<string | null>(null);
  readonly busquedaEstudianteModal = signal('');

  // Estudiantes que aún NO están asignados al apoderado del modal
  readonly estudiantesDisponibles = computed(() => {
    const apo = this.apoderadoModal();
    if (!apo) return [];
    const relaciones = this.relacionesPor().get(apo.idApoderado) ?? [];
    const asignados  = new Set(relaciones.map(r => r.id.idEstudiante));
    return this.estudiantes().filter(e => !asignados.has(e.idEstudiante));
  });

  // Estudiantes disponibles, filtrados por RUT o nombre dentro del modal
  readonly estudiantesDisponiblesFiltrados = computed(() => {
    const q = this.busquedaEstudianteModal().toLowerCase().trim();
    const lista = this.estudiantesDisponibles();
    if (!q) return lista;
    return lista.filter(e =>
      e.usuario.rutUsuario?.toLowerCase().includes(q) ||
      this.nombreCompleto(e.usuario).toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  // ── Carga de datos ────────────────────────────────────────────────────────

  cargarDatos(): void {
    this.cargando.set(true);
    this.error.set(null);
    forkJoin({
      apoderados: this.servicio.obtenerApoderados(),
      estudiantes: this.servicio.obtenerEstudiantes(),
    }).subscribe({
      next: ({ apoderados, estudiantes }) => {
        this.apoderados.set(apoderados);
        this.estudiantes.set(estudiantes);
        this.cargando.set(false);
        // Cargar las relaciones de todos los apoderados de una vez
        apoderados.forEach(a => this.cargarRelacionesApoderado(a.idApoderado));
      },
      error: () => {
        this.error.set('No se pudo cargar la información. Verifica que los servicios estén activos.');
        this.cargando.set(false);
      }
    });
  }

  cargarRelacionesApoderado(idApoderado: number): void {
    this.cargandoRelPor.update(s => { const n = new Set(s); n.add(idApoderado); return n; });
    this.servicio.obtenerEstudiantesDeApoderado(idApoderado).subscribe({
      next: relaciones => {
        this.relacionesPor.update(m => { const n = new Map(m); n.set(idApoderado, relaciones); return n; });
        this.cargandoRelPor.update(s => { const n = new Set(s); n.delete(idApoderado); return n; });
      },
      error: () => {
        this.cargandoRelPor.update(s => { const n = new Set(s); n.delete(idApoderado); return n; });
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  nombreCompleto(u: UsuarioAnidado): string {
    return [u.nombreUsuario, u.primerApellidoUsuario, u.segundoApellidoUsuario]
      .filter(Boolean).join(' ');
  }

  obtenerEstudiante(idEstudiante: number): EstudianteResponse | undefined {
    return this.estudiantes().find(e => e.idEstudiante === idEstudiante);
  }

  relacionesDeApoderado(idApoderado: number): RelacionApEst[] {
    return this.relacionesPor().get(idApoderado) ?? [];
  }

  estaCargandoRel(idApoderado: number): boolean {
    return this.cargandoRelPor().has(idApoderado);
  }

  // True si al apoderado todavía le quedan estudiantes por asignar
  hayEstudiantesDisponibles(apo: ApoderadoResponse): boolean {
    const relaciones = this.relacionesPor().get(apo.idApoderado) ?? [];
    return this.estudiantes().length > relaciones.length;
  }

  // ── Modal asignar ─────────────────────────────────────────────────────────

  abrirAsignar(apoderado: ApoderadoResponse): void {
    this.apoderadoModal.set(apoderado);
    this.estudianteSeleccionado.set(null);
    this.parentesco.set('');
    this.errorModal.set(null);
    this.busquedaEstudianteModal.set('');
  }

  cerrarModal(): void {
    this.apoderadoModal.set(null);
  }

  seleccionarEstudianteModal(idEstudiante: number): void {
    this.estudianteSeleccionado.set(idEstudiante);
  }

  asignar(): void {
    const apo       = this.apoderadoModal();
    const idEst     = this.estudianteSeleccionado();
    const parentesco = this.parentesco().trim();

    if (!apo || !idEst || !parentesco) {
      this.errorModal.set('Debes seleccionar un estudiante y un parentesco.');
      return;
    }

    this.guardando.set(true);
    this.errorModal.set(null);

    this.servicio.crearRelacion(apo.idApoderado, idEst, parentesco).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.cargarRelacionesApoderado(apo.idApoderado);
      },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errorModal.set(e.error?.message ?? 'No se pudo crear la relación.');
      }
    });
  }

  // ── Eliminar relación ─────────────────────────────────────────────────────

  eliminar(idApoderado: number, idEstudiante: number): void {
    this.servicio.eliminarRelacion(idApoderado, idEstudiante).subscribe({
      next: () => this.cargarRelacionesApoderado(idApoderado),
      error: () => this.error.set('No se pudo eliminar la relación.')
    });
  }

  irAlDashboard(): void { this.enrutador.navigate(['/dashboard']); }
}
