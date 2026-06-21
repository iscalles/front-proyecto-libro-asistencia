import { Component, OnChanges, inject, signal, input } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ServicioToken } from 'lib-auth';
import { ServicioAcademico } from '../../services/academico.service';
import { Evaluacion, Matricula, CalificacionLoteRequest } from '../../models/academico.models';

@Component({
  selector: 'app-ingresar-notas',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './ingresar-notas.component.html',
  styleUrls: ['./calificaciones-shared.scss']
})
export class IngresarNotas implements OnChanges {
  readonly evaluacion = input.required<Evaluacion>();

  private servicio = inject(ServicioAcademico);
  private servicioToken = inject(ServicioToken);
  private fb = inject(FormBuilder);

  readonly roster = signal<Matricula[]>([]);
  readonly cargando = signal(false);
  readonly errorRoster = signal<string | null>(null);

  readonly guardando = signal(false);
  readonly errorGuardar = signal<string | null>(null);
  readonly exitoGuardar = signal(false);

  readonly modalConfirmacion = signal(false);

  filas!: FormArray<FormGroup>;

  ngOnChanges(): void {
    this.cargarRosterYNotas();
  }

  cargarRosterYNotas(): void {
    this.cargando.set(true);
    this.errorRoster.set(null);
    this.exitoGuardar.set(false);

    this.servicio.listarMatriculasPorCurso(this.evaluacion().idCurso).subscribe({
      next: (alumnos) => {
        this.roster.set(alumnos);
        this.servicio.listarCalificacionesPorEvaluacion(this.evaluacion().idEvaluacion).subscribe({
          next: (notas) => {
            const notaPorMatricula = new Map(notas.map(n => [n.idMatricula, n.notaCalificacion]));
            this.filas = this.fb.array(
              alumnos.map(a => this.fb.group({
                idMatricula: [a.idMatricula],
                notaCalificacion: [
                  notaPorMatricula.get(a.idMatricula) ?? null,
                  [Validators.required, Validators.min(1), Validators.max(7)],
                ],
              }))
            );
            this.cargando.set(false);
          },
          error: () => {
            this.errorRoster.set('No se pudieron cargar las notas existentes.');
            this.cargando.set(false);
          }
        });
      },
      error: () => {
        this.errorRoster.set('No se pudo cargar la lista de alumnos del curso.');
        this.cargando.set(false);
      }
    });
  }

  nombreAlumno(i: number): string {
    const idMatricula = this.filas.at(i).value.idMatricula;
    return this.roster().find(a => a.idMatricula === idMatricula)?.nombreEstudiante ?? '';
  }

  rutAlumno(i: number): string {
    const idMatricula = this.filas.at(i).value.idMatricula;
    return this.roster().find(a => a.idMatricula === idMatricula)?.rutEstudiante ?? '';
  }

  notaInvalida(i: number): boolean {
    const c = this.filas.at(i);
    return c.invalid && c.touched;
  }

  abrirConfirmacion(): void {
    if (!this.filas || this.filas.length === 0) return;
    this.filas.markAllAsTouched();
    if (this.filas.invalid) return;

    this.errorGuardar.set(null);
    this.modalConfirmacion.set(true);
  }

  cerrarConfirmacion(): void {
    this.modalConfirmacion.set(false);
  }

  confirmarGuardar(): void {
    const detalles = this.filas.controls.map(g => ({
      idMatricula: g.value.idMatricula,
      notaCalificacion: Number(g.value.notaCalificacion),
    }));

    const dto: CalificacionLoteRequest = {
      idEvaluacion: this.evaluacion().idEvaluacion,
      creadoPorIdUsuario: Number(this.servicioToken.obtenerInfoUsuario()?.idUsuario),
      detalles,
    };

    this.guardando.set(true);
    this.errorGuardar.set(null);
    this.exitoGuardar.set(false);
    this.servicio.registrarCalificacionesLote(dto).subscribe({
      next: () => {
        this.guardando.set(false);
        this.exitoGuardar.set(true);
        this.modalConfirmacion.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errorGuardar.set(e.error?.message ?? 'No se pudieron registrar las notas.');
        this.modalConfirmacion.set(false);
      }
    });
  }
}
