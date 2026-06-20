import { Component, OnInit, OnChanges, inject, signal, input } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ServicioAsistencia } from '../../../services/asistencia.service';
import { CursoAsignatura } from '../../../models/academico.models';
import {
  RosterAlumno, AsistenciaLoteRequest, EstadoAsistencia,
  ESTADOS_ASISTENCIA, ETIQUETAS_ESTADO_ASISTENCIA,
} from '../../../models/asistencia.models';

// Convierte yyyy-MM-dd (formato del <input type="date">) a dd-MM-yyyy (formato que espera el backend)
function aFormatoBackend(fechaIso: string): string {
  const [anio, mes, dia] = fechaIso.split('-');
  return `${dia}-${mes}-${anio}`;
}

@Component({
  selector: 'app-tomar-asistencia-tab',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './tomar-asistencia-tab.component.html',
  styleUrls: ['../libro-clases-shared.scss']
})
export class TomarAsistenciaTab implements OnInit, OnChanges {
  readonly curso = input.required<CursoAsignatura>();

  private servicio = inject(ServicioAsistencia);
  private fb = inject(FormBuilder);

  readonly estados = ESTADOS_ASISTENCIA;
  readonly etiquetasEstado = ETIQUETAS_ESTADO_ASISTENCIA;

  readonly roster = signal<RosterAlumno[]>([]);
  readonly cargando = signal(false);
  readonly errorRoster = signal<string | null>(null);

  readonly guardando = signal(false);
  readonly errorGuardar = signal<string | null>(null);
  readonly exitoGuardar = signal(false);

  readonly modalConfirmacion = signal(false);
  readonly resumenConfirmacion = signal<{ presentes: number; ausentes: number; justificados: number }>({
    presentes: 0, ausentes: 0, justificados: 0,
  });

  readonly fecha = signal(new Date().toISOString().slice(0, 10));

  filas!: FormArray<FormGroup>;

  onFechaChange(evento: Event): void {
    this.fecha.set((evento.target as HTMLInputElement).value);
  }

  ngOnInit(): void {
    this.cargarRoster();
  }

  ngOnChanges(): void {
    this.cargarRoster();
  }

  cargarRoster(): void {
    this.cargando.set(true);
    this.errorRoster.set(null);
    this.exitoGuardar.set(false);
    this.servicio.obtenerRosterCurso(this.curso().idCurso).subscribe({
      next: (alumnos) => {
        this.roster.set(alumnos);
        this.filas = this.fb.array(
          alumnos.map(a => this.fb.group({
            idMatricula: [a.idMatricula],
            estadoAsistencia: ['Presente' as EstadoAsistencia, Validators.required],
            justificacionAsistencia: [''],
          }))
        );
        this.cargando.set(false);
      },
      error: () => {
        this.errorRoster.set('No se pudo cargar la lista de alumnos del curso.');
        this.cargando.set(false);
      }
    });
  }

  necesitaJustificacion(i: number): boolean {
    return this.filas.at(i).value.estadoAsistencia === 'Justificado';
  }

  nombreAlumno(i: number): string {
    const idMatricula = this.filas.at(i).value.idMatricula;
    return this.roster().find(a => a.idMatricula === idMatricula)?.nombreEstudiante ?? '';
  }

  rutAlumno(i: number): string {
    const idMatricula = this.filas.at(i).value.idMatricula;
    return this.roster().find(a => a.idMatricula === idMatricula)?.rutEstudiante ?? '';
  }

  // ── Confirmación antes de guardar ───────────────────────────────────────────
  abrirConfirmacion(): void {
    if (!this.filas || this.filas.length === 0) return;
    this.filas.markAllAsTouched();

    const estados = this.filas.controls.map(g => g.value.estadoAsistencia as EstadoAsistencia);
    this.resumenConfirmacion.set({
      presentes: estados.filter(e => e === 'Presente').length,
      ausentes: estados.filter(e => e === 'Ausente').length,
      justificados: estados.filter(e => e === 'Justificado').length,
    });
    this.errorGuardar.set(null);
    this.modalConfirmacion.set(true);
  }

  cerrarConfirmacion(): void {
    this.modalConfirmacion.set(false);
  }

  confirmarGuardar(): void {
    const detalles = this.filas.controls.map(g => ({
      idMatricula: g.value.idMatricula,
      estadoAsistencia: g.value.estadoAsistencia as EstadoAsistencia,
      justificacionAsistencia: g.value.justificacionAsistencia || undefined,
    }));

    const dto: AsistenciaLoteRequest = {
      idCurso: this.curso().idCurso,
      fechaAsistencia: aFormatoBackend(this.fecha()),
      detalles,
    };

    this.guardando.set(true);
    this.errorGuardar.set(null);
    this.exitoGuardar.set(false);
    this.servicio.registrarAsistenciaLote(dto).subscribe({
      next: () => {
        this.guardando.set(false);
        this.exitoGuardar.set(true);
        this.modalConfirmacion.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errorGuardar.set(e.error?.message ?? 'No se pudo registrar la asistencia.');
        this.modalConfirmacion.set(false);
      }
    });
  }
}
