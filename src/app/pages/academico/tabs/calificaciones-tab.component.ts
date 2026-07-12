import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ServicioToken } from 'lib-auth';
import { ServicioAcademico } from '../../../services/academico.service';
import {
  Calificacion, CalificacionRequest,
  Matricula, Evaluacion,
} from '../../../models/academico.models';

@Component({
  selector: 'app-calificaciones-tab',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './calificaciones-tab.component.html',
  styleUrls: ['../academico-shared.scss']
})
export class CalificacionesTab implements OnInit {
  private servicio      = inject(ServicioAcademico);
  private servicioToken = inject(ServicioToken);
  private fb            = inject(FormBuilder);

  readonly calificaciones = signal<Calificacion[]>([]);
  readonly busqueda       = signal('');
  readonly cargando       = signal(false);
  readonly errorTabla     = signal<string | null>(null);

  // Datos para los desplegables
  readonly matriculas   = signal<Matricula[]>([]);
  readonly evaluaciones = signal<Evaluacion[]>([]);

  // Curso de la evaluación seleccionada en el formulario; null si no hay
  readonly cursoDeEvaluacion = signal<number | null>(null);

  // Matrículas válidas para la evaluación elegida (deben ser del mismo curso)
  readonly matriculasDisponibles = computed(() => {
    const curso = this.cursoDeEvaluacion();
    if (curso === null) return [];
    return [...this.matriculas().filter(m => m.idCurso === curso)].sort((a, b) =>
      a.nombreEstudiante.localeCompare(b.nombreEstudiante, 'es')
    );
  });

  readonly calificacionesFiltradas = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    const lista = q
      ? this.calificaciones().filter(c =>
          c.nombreEvaluacion.toLowerCase().includes(q) ||
          this.etiquetaMatricula(c.idMatricula).toLowerCase().includes(q)
        )
      : this.calificaciones();
    return [...lista].sort((a, b) =>
      a.nombreEvaluacion.localeCompare(b.nombreEvaluacion, 'es')
    );
  });

  readonly guardando            = signal(false);
  readonly errorModal           = signal<string | null>(null);
  readonly modalCrear           = signal(false);
  readonly calificacionEditando = signal<Calificacion | null>(null);
  readonly calificacionEliminar = signal<Calificacion | null>(null);

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      idEvaluacion:     ['', [Validators.required]],
      idMatricula:      ['', [Validators.required]],
      notaCalificacion: ['', [Validators.required, Validators.min(1), Validators.max(7)]],
    });
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.errorTabla.set(null);
    forkJoin({
      calificaciones: this.servicio.listarCalificaciones(),
      matriculas:     this.servicio.listarMatriculas(),
      evaluaciones:   this.servicio.listarEvaluaciones(),
    }).subscribe({
      next: ({ calificaciones, matriculas, evaluaciones }) => {
        this.calificaciones.set(calificaciones);
        this.matriculas.set(matriculas);
        this.evaluaciones.set([...evaluaciones].sort((a, b) => {
          const keyA = `${a.nombreAsignatura} ${a.nombreEvaluacion}`.toLowerCase();
          const keyB = `${b.nombreAsignatura} ${b.nombreEvaluacion}`.toLowerCase();
          return keyA.localeCompare(keyB, 'es');
        }));
        this.cargando.set(false);
      },
      error: () => {
        this.errorTabla.set('No se pudo cargar la información de calificaciones.');
        this.cargando.set(false);
      }
    });
  }

  error(campo: string, tipo: string): boolean {
    const c = this.form.get(campo);
    return !!(c?.hasError(tipo) && c.touched);
  }

  // Busca la matrícula en la lista cargada y arma una etiqueta legible
  etiquetaMatricula(idMatricula: number): string {
    const m = this.matriculas().find(x => x.idMatricula === idMatricula);
    return m ? `${m.nombreEstudiante} — ${m.gradoCurso} ${m.seccionCurso}` : `Matrícula #${idMatricula}`;
  }

  // Al cambiar la evaluación: recalcula su curso y limpia la matrícula elegida,
  // porque la lista de matrículas válidas cambió.
  onEvaluacionChange(): void {
    const idEval = Number(this.form.value.idEvaluacion);
    const evaluacion = this.evaluaciones().find(e => e.idEvaluacion === idEval);
    this.cursoDeEvaluacion.set(evaluacion ? evaluacion.idCurso : null);
    this.form.patchValue({ idMatricula: '' });
  }

  // Los <select> devuelven strings; creadoPorIdUsuario sale del usuario logueado
  private construirDto(): CalificacionRequest {
    const idUsuario = Number(this.servicioToken.obtenerInfoUsuario()?.idUsuario ?? 0);
    return {
      idMatricula:        Number(this.form.value.idMatricula),
      idEvaluacion:       Number(this.form.value.idEvaluacion),
      notaCalificacion:   Number(this.form.value.notaCalificacion),
      creadoPorIdUsuario: idUsuario,
    };
  }

  // ── Modal CREAR ────────────────────────────────────────────────────────────
  abrirCrear(): void {
    this.form.reset();
    this.cursoDeEvaluacion.set(null);
    this.errorModal.set(null);
    this.modalCrear.set(true);
  }

  cerrarCrear(): void { this.modalCrear.set(false); }

  guardarCrear(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    this.errorModal.set(null);
    this.servicio.crearCalificacion(this.construirDto()).subscribe({
      next: () => { this.guardando.set(false); this.cerrarCrear(); this.cargar(); },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errorModal.set(e.error?.message ?? 'Error al registrar la calificación.');
      }
    });
  }

  // ── Modal EDITAR ───────────────────────────────────────────────────────────
  abrirEditar(c: Calificacion): void {
    this.calificacionEditando.set(c);
    this.errorModal.set(null);
    // Fija el curso de la evaluación para que el desplegable de matrícula
    // muestre la lista correcta (incluida la matrícula ya asignada)
    const evaluacion = this.evaluaciones().find(e => e.idEvaluacion === c.idEvaluacion);
    this.cursoDeEvaluacion.set(evaluacion ? evaluacion.idCurso : null);
    this.form.patchValue({
      idEvaluacion:     c.idEvaluacion,
      idMatricula:      c.idMatricula,
      notaCalificacion: c.notaCalificacion,
    });
  }

  cerrarEditar(): void { this.calificacionEditando.set(null); }

  guardarEditar(): void {
    const c = this.calificacionEditando();
    if (!c || this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    this.errorModal.set(null);
    this.servicio.actualizarCalificacion(c.idCalificacion, this.construirDto()).subscribe({
      next: () => { this.guardando.set(false); this.cerrarEditar(); this.cargar(); },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errorModal.set(e.error?.message ?? 'Error al actualizar la calificación.');
      }
    });
  }

  // ── Modal ELIMINAR ─────────────────────────────────────────────────────────
  abrirEliminar(c: Calificacion): void {
    this.calificacionEliminar.set(c);
    this.errorModal.set(null);
  }

  cerrarEliminar(): void { this.calificacionEliminar.set(null); }

  confirmarEliminar(): void {
    const c = this.calificacionEliminar();
    if (!c) return;
    this.guardando.set(true);
    this.servicio.eliminarCalificacion(c.idCalificacion).subscribe({
      next: () => { this.guardando.set(false); this.cerrarEliminar(); this.cargar(); },
      error: () => {
        this.guardando.set(false);
        this.errorModal.set('No se pudo eliminar la calificación.');
      }
    });
  }
}
