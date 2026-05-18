import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ServicioAcademico } from '../../../services/academico.service';
import { Evaluacion, EvaluacionRequest, CursoAsignatura } from '../../../models/academico.models';

@Component({
  selector: 'app-evaluaciones-tab',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './evaluaciones-tab.component.html',
  styleUrls: ['../academico-shared.scss']
})
export class EvaluacionesTab implements OnInit {
  private servicio = inject(ServicioAcademico);
  private fb       = inject(FormBuilder);

  readonly evaluaciones = signal<Evaluacion[]>([]);
  // Curso-asignaturas para el desplegable
  readonly cursoAsignaturas = signal<CursoAsignatura[]>([]);
  readonly busqueda     = signal('');
  readonly cargando     = signal(false);
  readonly errorTabla   = signal<string | null>(null);

  readonly evaluacionesFiltradas = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    if (!q) return this.evaluaciones();
    return this.evaluaciones().filter(e =>
      e.nombreEvaluacion.toLowerCase().includes(q) ||
      e.fechaEvaluacion.includes(q) ||
      e.nombreAsignatura.toLowerCase().includes(q)
    );
  });

  readonly guardando          = signal(false);
  readonly errorModal         = signal<string | null>(null);
  readonly modalCrear         = signal(false);
  readonly evaluacionEditando = signal<Evaluacion | null>(null);
  readonly evaluacionEliminar = signal<Evaluacion | null>(null);

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      nombreEvaluacion:  ['', [Validators.required, Validators.maxLength(60)]],
      fechaEvaluacion:   ['', [Validators.required]],
      idCursoAsignatura: ['', [Validators.required]],
    });
    this.cargar();
  }

  // dd-MM-yyyy (backend) → yyyy-MM-dd (input date)
  private aIso(fecha: string): string {
    if (!fecha) return '';
    const [d, m, a] = fecha.split('-');
    return `${a}-${m}-${d}`;
  }

  // yyyy-MM-dd (input date) → dd-MM-yyyy (backend)
  private aBackend(fecha: string): string {
    if (!fecha) return '';
    const [a, m, d] = fecha.split('-');
    return `${d}-${m}-${a}`;
  }

  cargar(): void {
    this.cargando.set(true);
    this.errorTabla.set(null);
    forkJoin({
      evaluaciones:     this.servicio.listarEvaluaciones(),
      cursoAsignaturas: this.servicio.listarCursoAsignaturas(),
    }).subscribe({
      next: ({ evaluaciones, cursoAsignaturas }) => {
        this.evaluaciones.set(evaluaciones);
        this.cursoAsignaturas.set(cursoAsignaturas);
        this.cargando.set(false);
      },
      error: () => {
        this.errorTabla.set('No se pudo cargar la lista de evaluaciones.');
        this.cargando.set(false);
      }
    });
  }

  error(campo: string, tipo: string): boolean {
    const c = this.form.get(campo);
    return !!(c?.hasError(tipo) && c.touched);
  }

  etiquetaCursoAsignatura(ca: CursoAsignatura): string {
    return `${ca.nombreAsignatura} — ${ca.gradoCurso} ${ca.seccionCurso}`;
  }

  // Arma el DTO convirtiendo la fecha al formato del backend
  private construirDto(): EvaluacionRequest {
    return {
      nombreEvaluacion:  this.form.value.nombreEvaluacion,
      fechaEvaluacion:   this.aBackend(this.form.value.fechaEvaluacion),
      idCursoAsignatura: Number(this.form.value.idCursoAsignatura),
    };
  }

  abrirCrear(): void {
    this.form.reset();
    this.errorModal.set(null);
    this.modalCrear.set(true);
  }

  cerrarCrear(): void { this.modalCrear.set(false); }

  guardarCrear(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    this.errorModal.set(null);
    this.servicio.crearEvaluacion(this.construirDto()).subscribe({
      next: () => { this.guardando.set(false); this.cerrarCrear(); this.cargar(); },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errorModal.set(e.error?.message ?? 'Error al crear la evaluación.');
      }
    });
  }

  abrirEditar(ev: Evaluacion): void {
    this.evaluacionEditando.set(ev);
    this.errorModal.set(null);
    this.form.patchValue({
      nombreEvaluacion:  ev.nombreEvaluacion,
      fechaEvaluacion:   this.aIso(ev.fechaEvaluacion),
      idCursoAsignatura: ev.idCursoAsignatura,
    });
  }

  cerrarEditar(): void { this.evaluacionEditando.set(null); }

  guardarEditar(): void {
    const ev = this.evaluacionEditando();
    if (!ev || this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    this.errorModal.set(null);
    this.servicio.actualizarEvaluacion(ev.idEvaluacion, this.construirDto()).subscribe({
      next: () => { this.guardando.set(false); this.cerrarEditar(); this.cargar(); },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errorModal.set(e.error?.message ?? 'Error al actualizar la evaluación.');
      }
    });
  }

  abrirEliminar(ev: Evaluacion): void {
    this.evaluacionEliminar.set(ev);
    this.errorModal.set(null);
  }

  cerrarEliminar(): void { this.evaluacionEliminar.set(null); }

  confirmarEliminar(): void {
    const ev = this.evaluacionEliminar();
    if (!ev) return;
    this.guardando.set(true);
    this.servicio.eliminarEvaluacion(ev.idEvaluacion).subscribe({
      next: () => { this.guardando.set(false); this.cerrarEliminar(); this.cargar(); },
      error: () => {
        this.guardando.set(false);
        this.errorModal.set('No se pudo eliminar la evaluación.');
      }
    });
  }
}
