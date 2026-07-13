import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ServicioAcademico } from '../../../services/academico.service';
import { ServicioUsuarioAdmin } from '../../../services/usuario-admin.service';
import { Matricula, MatriculaRequest, Curso } from '../../../models/academico.models';
import { UsuarioDTOResponse } from '../../../models/usuario-admin.models';

@Component({
  selector: 'app-matriculas-tab',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './matriculas-tab.component.html',
  styleUrls: ['../academico-shared.scss']
})
export class MatriculasTab implements OnInit {
  private servicio         = inject(ServicioAcademico);
  private servicioUsuarios = inject(ServicioUsuarioAdmin);
  private fb               = inject(FormBuilder);

  readonly matriculas  = signal<Matricula[]>([]);
  readonly busqueda    = signal('');
  readonly cargando    = signal(false);
  readonly errorTabla  = signal<string | null>(null);

  // Datos para los desplegables
  readonly cursos      = signal<Curso[]>([]);
  readonly estudiantes = signal<UsuarioDTOResponse[]>([]);

  // Año del curso seleccionado; el año de la matrícula se deriva de este
  readonly anioDelCurso = signal<number | null>(null);

  readonly matriculasFiltradas = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    const lista = q
      ? this.matriculas().filter(m =>
          m.nombreEstudiante.toLowerCase().includes(q) ||
          m.gradoCurso.toLowerCase().includes(q) ||
          m.seccionCurso.toLowerCase().includes(q) ||
          String(m.anioAcademicoMatricula).includes(q)
        )
      : this.matriculas();
    return [...lista].sort((a, b) =>
      a.nombreEstudiante.localeCompare(b.nombreEstudiante, 'es')
    );
  });

  readonly guardando         = signal(false);
  readonly errorModal        = signal<string | null>(null);
  readonly modalCrear        = signal(false);
  readonly matriculaEditando = signal<Matricula | null>(null);
  readonly matriculaEliminar = signal<Matricula | null>(null);

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      estudianteIdUsuario: ['', [Validators.required]],
      idCurso:             ['', [Validators.required]],
    });
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.errorTabla.set(null);
    forkJoin({
      matriculas: this.servicio.listarMatriculas(),
      cursos:     this.servicio.listarCursos(),
      usuarios:   this.servicioUsuarios.listarUsuarios(),
    }).subscribe({
      next: ({ matriculas, cursos, usuarios }) => {
        this.matriculas.set(matriculas);
        this.cursos.set([...cursos].sort((a, b) => {
          const keyA = `${a.gradoCurso} ${a.seccionCurso}`.toLowerCase();
          const keyB = `${b.gradoCurso} ${b.seccionCurso}`.toLowerCase();
          return keyA.localeCompare(keyB, 'es');
        }));
        const estFiltrados = usuarios.filter(u => u.roles.includes('ESTUDIANTE'));
        this.estudiantes.set([...estFiltrados].sort((a, b) => {
          const keyA = `${a.primerApellidoUsuario ?? ''} ${a.nombreUsuario ?? ''}`.toLowerCase();
          const keyB = `${b.primerApellidoUsuario ?? ''} ${b.nombreUsuario ?? ''}`.toLowerCase();
          return keyA.localeCompare(keyB, 'es');
        }));
        this.cargando.set(false);
      },
      error: () => {
        this.errorTabla.set('No se pudo cargar la información de matrículas.');
        this.cargando.set(false);
      }
    });
  }

  error(campo: string, tipo: string): boolean {
    const c = this.form.get(campo);
    return !!(c?.hasError(tipo) && c.touched);
  }

  nombreEstudiante(u: UsuarioDTOResponse): string {
    return [u.nombreUsuario, u.primerApellidoUsuario, u.segundoApellidoUsuario]
      .filter(Boolean).join(' ');
  }

  // Al cambiar el curso: muestra su año (el año de la matrícula se deriva de él)
  onCursoChange(): void {
    const idCurso = Number(this.form.value.idCurso);
    const curso = this.cursos().find(c => c.id === idCurso);
    this.anioDelCurso.set(curso ? curso.anioCurso : null);
  }

  // El año académico ya no se envía: el backend lo deriva del curso
  private construirDto(): MatriculaRequest {
    return {
      idCurso:             Number(this.form.value.idCurso),
      estudianteIdUsuario: Number(this.form.value.estudianteIdUsuario),
    };
  }

  // ── Modal CREAR ────────────────────────────────────────────────────────────
  abrirCrear(): void {
    this.form.reset();
    this.anioDelCurso.set(null);
    this.errorModal.set(null);
    this.modalCrear.set(true);
  }

  cerrarCrear(): void { this.modalCrear.set(false); }

  guardarCrear(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    this.errorModal.set(null);
    this.servicio.crearMatricula(this.construirDto()).subscribe({
      next: () => { this.guardando.set(false); this.cerrarCrear(); this.cargar(); },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errorModal.set(e.error?.message ?? 'Error al crear la matrícula.');
      }
    });
  }

  // ── Modal EDITAR ───────────────────────────────────────────────────────────
  abrirEditar(m: Matricula): void {
    this.matriculaEditando.set(m);
    this.errorModal.set(null);
    this.anioDelCurso.set(m.anioCurso);
    this.form.patchValue({
      estudianteIdUsuario: m.estudianteIdUsuario,
      idCurso:             m.idCurso,
    });
  }

  cerrarEditar(): void { this.matriculaEditando.set(null); }

  guardarEditar(): void {
    const m = this.matriculaEditando();
    if (!m || this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    this.errorModal.set(null);
    this.servicio.actualizarMatricula(m.idMatricula, this.construirDto()).subscribe({
      next: () => { this.guardando.set(false); this.cerrarEditar(); this.cargar(); },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errorModal.set(e.error?.message ?? 'Error al actualizar la matrícula.');
      }
    });
  }

  // ── Modal ELIMINAR ─────────────────────────────────────────────────────────
  abrirEliminar(m: Matricula): void {
    this.matriculaEliminar.set(m);
    this.errorModal.set(null);
  }

  cerrarEliminar(): void { this.matriculaEliminar.set(null); }

  confirmarEliminar(): void {
    const m = this.matriculaEliminar();
    if (!m) return;
    this.guardando.set(true);
    this.servicio.eliminarMatricula(m.idMatricula).subscribe({
      next: () => { this.guardando.set(false); this.cerrarEliminar(); this.cargar(); },
      error: () => {
        this.guardando.set(false);
        this.errorModal.set('No se pudo eliminar la matrícula.');
      }
    });
  }
}
