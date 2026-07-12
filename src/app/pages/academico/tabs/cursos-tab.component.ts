import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ServicioAcademico } from '../../../services/academico.service';
import { Curso, CursoRequest } from '../../../models/academico.models';
import { CursoDetalle } from './curso-detalle.component';

@Component({
  selector: 'app-cursos-tab',
  standalone: true,
  imports: [ReactiveFormsModule, CursoDetalle],
  templateUrl: './cursos-tab.component.html',
  styleUrls: ['../academico-shared.scss']
})
export class CursosTab implements OnInit {
  private servicio = inject(ServicioAcademico);
  private fb       = inject(FormBuilder);

  // ── Tabla y búsqueda ───────────────────────────────────────────────────────
  readonly cursos     = signal<Curso[]>([]);
  readonly busqueda   = signal('');
  readonly cargando   = signal(false);
  readonly errorTabla = signal<string | null>(null);

  readonly cursosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    const lista = q
      ? this.cursos().filter(c =>
          c.gradoCurso.toLowerCase().includes(q) ||
          c.seccionCurso.toLowerCase().includes(q) ||
          String(c.anioCurso).includes(q)
        )
      : this.cursos();
    return [...lista].sort((a, b) => {
      const keyA = `${a.gradoCurso} ${a.seccionCurso}`.toLowerCase();
      const keyB = `${b.gradoCurso} ${b.seccionCurso}`.toLowerCase();
      return keyA.localeCompare(keyB, 'es');
    });
  });

  // ── Estado de modales ──────────────────────────────────────────────────────
  readonly guardando     = signal(false);
  readonly errorModal    = signal<string | null>(null);
  readonly modalCrear    = signal(false);
  readonly cursoEditando = signal<Curso | null>(null);
  readonly cursoEliminar = signal<Curso | null>(null);

  // Curso cuyo detalle (asignaturas) se está viendo; null = mostrar la tabla
  readonly cursoSeleccionado = signal<Curso | null>(null);

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      gradoCurso:   ['', [Validators.required, Validators.maxLength(10)]],
      seccionCurso: ['', [Validators.required, Validators.maxLength(10)]],
      anioCurso:    ['', [Validators.required]],
    });
    this.cargar();
  }

  // ── Tabla ──────────────────────────────────────────────────────────────────
  cargar(): void {
    this.cargando.set(true);
    this.errorTabla.set(null);
    this.servicio.listarCursos().subscribe({
      next: lista => { this.cursos.set(lista); this.cargando.set(false); },
      error: () => {
        this.errorTabla.set('No se pudo cargar la lista de cursos.');
        this.cargando.set(false);
      }
    });
  }

  error(campo: string, tipo: string): boolean {
    const c = this.form.get(campo);
    return !!(c?.hasError(tipo) && c.touched);
  }

  // ── Detalle (asignaturas del curso) ────────────────────────────────────────
  verDetalle(c: Curso): void { this.cursoSeleccionado.set(c); }
  cerrarDetalle(): void { this.cursoSeleccionado.set(null); }

  // ── Modal CREAR ────────────────────────────────────────────────────────────
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
    const dto: CursoRequest = this.form.value;
    this.servicio.crearCurso(dto).subscribe({
      next: () => { this.guardando.set(false); this.cerrarCrear(); this.cargar(); },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errorModal.set(e.error?.message ?? 'Error al crear el curso.');
      }
    });
  }

  // ── Modal EDITAR ───────────────────────────────────────────────────────────
  abrirEditar(c: Curso): void {
    this.cursoEditando.set(c);
    this.errorModal.set(null);
    this.form.patchValue({
      gradoCurso:   c.gradoCurso,
      seccionCurso: c.seccionCurso,
      anioCurso:    c.anioCurso,
    });
  }

  cerrarEditar(): void { this.cursoEditando.set(null); }

  guardarEditar(): void {
    const c = this.cursoEditando();
    if (!c || this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    this.errorModal.set(null);
    const dto: CursoRequest = this.form.value;
    this.servicio.actualizarCurso(c.id, dto).subscribe({
      next: () => { this.guardando.set(false); this.cerrarEditar(); this.cargar(); },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errorModal.set(e.error?.message ?? 'Error al actualizar el curso.');
      }
    });
  }

  // ── Modal ELIMINAR ─────────────────────────────────────────────────────────
  abrirEliminar(c: Curso): void {
    this.cursoEliminar.set(c);
    this.errorModal.set(null);
  }

  cerrarEliminar(): void { this.cursoEliminar.set(null); }

  confirmarEliminar(): void {
    const c = this.cursoEliminar();
    if (!c) return;
    this.guardando.set(true);
    this.servicio.eliminarCurso(c.id).subscribe({
      next: () => { this.guardando.set(false); this.cerrarEliminar(); this.cargar(); },
      error: () => {
        this.guardando.set(false);
        this.errorModal.set('No se pudo eliminar el curso.');
      }
    });
  }
}
