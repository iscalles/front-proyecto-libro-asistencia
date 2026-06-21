import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ServicioToken } from 'lib-auth';
import { ServicioAcademico } from '../../services/academico.service';
import { CursoAsignatura, Evaluacion, EvaluacionRequest } from '../../models/academico.models';
import { IngresarNotas } from './ingresar-notas.component';

@Component({
  selector: 'app-calificaciones',
  standalone: true,
  imports: [ReactiveFormsModule, IngresarNotas],
  templateUrl: './calificaciones-page.component.html',
  styleUrl: './calificaciones-shared.scss'
})
export class PáginaCalificaciones implements OnInit {
  private servicioToken = inject(ServicioToken);
  private servicioAcademico = inject(ServicioAcademico);
  private fb = inject(FormBuilder);
  private enrutador = inject(Router);

  readonly usuarioSesion = this.servicioToken.obtenerSeñalInfoUsuario();

  // ── Selección de curso-asignatura ───────────────────────────────────────────
  readonly misCursos = signal<CursoAsignatura[]>([]);
  readonly cargandoCursos = signal(false);
  readonly errorCursos = signal<string | null>(null);

  readonly busquedaCurso = signal('');

  readonly misCursosFiltrados = computed(() => {
    const q = this.busquedaCurso().toLowerCase().trim();
    if (!q) return this.misCursos();
    return this.misCursos().filter(c =>
      c.nombreAsignatura.toLowerCase().includes(q) ||
      c.gradoCurso.toLowerCase().includes(q) ||
      c.seccionCurso.toLowerCase().includes(q)
    );
  });

  readonly cursoSeleccionado = signal<CursoAsignatura | null>(null);

  // ── Evaluaciones del curso-asignatura seleccionado ──────────────────────────
  readonly evaluaciones = signal<Evaluacion[]>([]);
  readonly cargandoEvaluaciones = signal(false);
  readonly errorEvaluaciones = signal<string | null>(null);

  readonly evaluacionSeleccionada = signal<Evaluacion | null>(null);

  readonly modalCrearEvaluacion = signal(false);
  readonly guardandoEvaluacion = signal(false);
  readonly errorEvaluacionModal = signal<string | null>(null);

  formEvaluacion!: FormGroup;

  ngOnInit(): void {
    this.formEvaluacion = this.fb.group({
      nombreEvaluacion: ['', Validators.required],
      fechaEvaluacion: [new Date().toISOString().slice(0, 10), Validators.required],
    });
    this.cargarMisCursos();
  }

  colorTarjeta(i: number): string {
    return `tarjeta-curso--color-${i % 6}`;
  }

  cargarMisCursos(): void {
    const idDocente = Number(this.usuarioSesion()?.idUsuario);
    this.cargandoCursos.set(true);
    this.errorCursos.set(null);
    this.servicioAcademico.listarCursoAsignaturas().subscribe({
      next: (registros) => {
        this.misCursos.set(registros.filter(r => r.docenteIdUsuario === idDocente));
        this.cargandoCursos.set(false);
      },
      error: () => {
        this.errorCursos.set('No se pudieron cargar tus cursos asignados.');
        this.cargandoCursos.set(false);
      }
    });
  }

  seleccionarCurso(curso: CursoAsignatura): void {
    this.cursoSeleccionado.set(curso);
    this.evaluacionSeleccionada.set(null);
    this.cargarEvaluaciones();
  }

  volverASeleccion(): void {
    this.cursoSeleccionado.set(null);
    this.evaluacionSeleccionada.set(null);
  }

  cargarEvaluaciones(): void {
    const curso = this.cursoSeleccionado();
    if (!curso) return;
    this.cargandoEvaluaciones.set(true);
    this.errorEvaluaciones.set(null);
    this.servicioAcademico.listarEvaluacionesPorCursoAsignatura(curso.idCursoAsignatura).subscribe({
      next: (registros) => {
        this.evaluaciones.set(registros);
        this.cargandoEvaluaciones.set(false);
      },
      error: () => {
        this.errorEvaluaciones.set('No se pudieron cargar las evaluaciones de este curso.');
        this.cargandoEvaluaciones.set(false);
      }
    });
  }

  seleccionarEvaluacion(evaluacion: Evaluacion): void {
    this.evaluacionSeleccionada.set(evaluacion);
  }

  // ── Modal CREAR EVALUACIÓN ───────────────────────────────────────────────────
  abrirCrearEvaluacion(): void {
    this.formEvaluacion.reset({
      nombreEvaluacion: '',
      fechaEvaluacion: new Date().toISOString().slice(0, 10),
    });
    this.errorEvaluacionModal.set(null);
    this.modalCrearEvaluacion.set(true);
  }

  cerrarCrearEvaluacion(): void {
    this.modalCrearEvaluacion.set(false);
  }

  error(campo: string, tipo: string): boolean {
    const c = this.formEvaluacion.get(campo);
    return !!(c?.hasError(tipo) && c.touched);
  }

  guardarEvaluacion(): void {
    const curso = this.cursoSeleccionado();
    if (!curso || this.formEvaluacion.invalid) {
      this.formEvaluacion.markAllAsTouched();
      return;
    }

    const [anio, mes, dia] = (this.formEvaluacion.value.fechaEvaluacion as string).split('-');
    const dto: EvaluacionRequest = {
      nombreEvaluacion: this.formEvaluacion.value.nombreEvaluacion,
      fechaEvaluacion: `${dia}-${mes}-${anio}`,
      idCursoAsignatura: curso.idCursoAsignatura,
    };

    this.guardandoEvaluacion.set(true);
    this.errorEvaluacionModal.set(null);
    this.servicioAcademico.crearEvaluacion(dto).subscribe({
      next: () => {
        this.guardandoEvaluacion.set(false);
        this.cerrarCrearEvaluacion();
        this.cargarEvaluaciones();
      },
      error: (e: HttpErrorResponse) => {
        this.guardandoEvaluacion.set(false);
        this.errorEvaluacionModal.set(e.error?.message ?? 'No se pudo crear la evaluación.');
      }
    });
  }

  irAlDashboard(): void {
    this.enrutador.navigate(['/dashboard']);
  }
}
