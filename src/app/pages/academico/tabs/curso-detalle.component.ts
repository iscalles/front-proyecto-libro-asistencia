import { Component, OnInit, inject, signal, input, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ServicioAcademico } from '../../../services/academico.service';
import { ServicioUsuarioAdmin } from '../../../services/usuario-admin.service';
import {
  Curso, CursoAsignatura, CursoAsignaturaRequest, Asignatura,
} from '../../../models/academico.models';
import { UsuarioDTOResponse } from '../../../models/usuario-admin.models';

@Component({
  selector: 'app-curso-detalle',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './curso-detalle.component.html',
  styleUrls: ['../academico-shared.scss']
})
export class CursoDetalle implements OnInit {
  // Curso seleccionado (entra desde el componente padre)
  readonly curso = input.required<Curso>();
  // Avisa al padre que se quiere volver al listado de cursos
  readonly volver = output<void>();

  private servicio         = inject(ServicioAcademico);
  private servicioUsuarios = inject(ServicioUsuarioAdmin);
  private fb               = inject(FormBuilder);

  // Registros curso-asignatura SOLO de este curso
  readonly registros = signal<CursoAsignatura[]>([]);

  // Datos para los desplegables
  readonly asignaturas = signal<Asignatura[]>([]);
  readonly docentes    = signal<UsuarioDTOResponse[]>([]);

  readonly cargando   = signal(false);
  readonly errorTabla = signal<string | null>(null);

  readonly guardando        = signal(false);
  readonly errorModal       = signal<string | null>(null);
  readonly modalCrear       = signal(false);
  readonly registroEditando = signal<CursoAsignatura | null>(null);
  readonly registroEliminar = signal<CursoAsignatura | null>(null);

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      idAsignatura:     ['', [Validators.required]],
      docenteIdUsuario: ['', [Validators.required]],
    });
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.errorTabla.set(null);
    // forkJoin: ejecuta las 3 llamadas en paralelo y espera a que todas terminen
    forkJoin({
      cursoAsignaturas: this.servicio.listarCursoAsignaturas(),
      asignaturas:      this.servicio.listarAsignaturas(),
      usuarios:         this.servicioUsuarios.listarUsuarios(),
    }).subscribe({
      next: ({ cursoAsignaturas, asignaturas, usuarios }) => {
        // Filtra solo los registros que pertenecen a este curso
        this.registros.set(
          [...cursoAsignaturas.filter(ca => ca.idCurso === this.curso().id)].sort((a, b) =>
            a.nombreAsignatura.localeCompare(b.nombreAsignatura, 'es')
          )
        );
        this.asignaturas.set([...asignaturas].sort((a, b) =>
          a.nombreAsignatura.localeCompare(b.nombreAsignatura, 'es')
        ));
        const docentesFiltrados = usuarios.filter(u => u.roles.includes('DOCENTE'));
        this.docentes.set([...docentesFiltrados].sort((a, b) => {
          const keyA = `${a.primerApellidoUsuario ?? ''} ${a.nombreUsuario ?? ''}`.toLowerCase();
          const keyB = `${b.primerApellidoUsuario ?? ''} ${b.nombreUsuario ?? ''}`.toLowerCase();
          return keyA.localeCompare(keyB, 'es');
        }));
        this.cargando.set(false);
      },
      error: () => {
        this.errorTabla.set('No se pudieron cargar los datos del curso.');
        this.cargando.set(false);
      }
    });
  }

  error(campo: string, tipo: string): boolean {
    const c = this.form.get(campo);
    return !!(c?.hasError(tipo) && c.touched);
  }

  nombreDocente(d: UsuarioDTOResponse): string {
    return [d.nombreUsuario, d.primerApellidoUsuario, d.segundoApellidoUsuario]
      .filter(Boolean).join(' ');
  }

  // Arma el DTO; el idCurso es fijo (el curso seleccionado).
  // Los <select> devuelven strings, por eso se convierten con Number().
  private construirDto(): CursoAsignaturaRequest {
    return {
      idCurso:          this.curso().id,
      idAsignatura:     Number(this.form.value.idAsignatura),
      docenteIdUsuario: Number(this.form.value.docenteIdUsuario),
    };
  }

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
    this.servicio.crearCursoAsignatura(this.construirDto()).subscribe({
      next: () => { this.guardando.set(false); this.cerrarCrear(); this.cargar(); },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errorModal.set(e.error?.message ?? 'Error al asignar la asignatura.');
      }
    });
  }

  // ── Modal EDITAR ───────────────────────────────────────────────────────────
  abrirEditar(r: CursoAsignatura): void {
    this.registroEditando.set(r);
    this.errorModal.set(null);
    this.form.patchValue({
      idAsignatura:     r.idAsignatura,
      docenteIdUsuario: r.docenteIdUsuario,
    });
  }

  cerrarEditar(): void { this.registroEditando.set(null); }

  guardarEditar(): void {
    const r = this.registroEditando();
    if (!r || this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    this.errorModal.set(null);
    this.servicio.actualizarCursoAsignatura(r.idCursoAsignatura, this.construirDto()).subscribe({
      next: () => { this.guardando.set(false); this.cerrarEditar(); this.cargar(); },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errorModal.set(e.error?.message ?? 'Error al actualizar la asignación.');
      }
    });
  }

  // ── Modal ELIMINAR ─────────────────────────────────────────────────────────
  abrirEliminar(r: CursoAsignatura): void {
    this.registroEliminar.set(r);
    this.errorModal.set(null);
  }

  cerrarEliminar(): void { this.registroEliminar.set(null); }

  confirmarEliminar(): void {
    const r = this.registroEliminar();
    if (!r) return;
    this.guardando.set(true);
    this.servicio.eliminarCursoAsignatura(r.idCursoAsignatura).subscribe({
      next: () => { this.guardando.set(false); this.cerrarEliminar(); this.cargar(); },
      error: () => {
        this.guardando.set(false);
        this.errorModal.set('No se pudo eliminar la asignación.');
      }
    });
  }
}
