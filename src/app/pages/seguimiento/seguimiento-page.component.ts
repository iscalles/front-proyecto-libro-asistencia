import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ServicioToken } from 'lib-auth';
import { ServicioRelaciones } from '../../services/relaciones.service';
import { ServicioAcademico } from '../../services/academico.service';
import { ServicioSeguimiento } from '../../services/seguimiento.service';
import { EstudianteResponse, RelacionApEst } from '../../models/relaciones.models';
import { Matricula, Calificacion } from '../../models/academico.models';
import { Asistencia, ResumenCalificaciones, ResumenAsistencia } from '../../models/seguimiento.models';

interface AlumnoConParentesco {
  estudiante: EstudianteResponse;
  parentesco: string;
}

@Component({
  selector: 'app-seguimiento-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './seguimiento-page.component.html',
})
export class PáginaSeguimiento implements OnInit {
  private servicioToken = inject(ServicioToken);
  private servicioRelaciones = inject(ServicioRelaciones);
  private servicioAcademico = inject(ServicioAcademico);
  private servicioSeguimiento = inject(ServicioSeguimiento);

  // ── Estado general ───────────────────────────────────────────────────────────
  cargandoAlumnos = signal(false);
  errorAlumnos = signal('');
  alumnos = signal<AlumnoConParentesco[]>([]);

  // ── Alumno seleccionado ──────────────────────────────────────────────────────
  alumnoSeleccionado = signal<AlumnoConParentesco | null>(null);
  tabActiva = signal<'calificaciones' | 'asistencia'>('calificaciones');

  // ── Datos del alumno ─────────────────────────────────────────────────────────
  cargandoDetalle = signal(false);
  errorDetalle = signal('');
  errorAsistencia = signal('');
  matriculas = signal<Matricula[]>([]);
  calificaciones = signal<Calificacion[]>([]);
  asistencias = signal<Asistencia[]>([]);

  // ── Computed: resumen calificaciones ────────────────────────────────────────
  resumenCalificaciones = computed<ResumenCalificaciones[]>(() => {
    const cals = this.calificaciones();
    if (!cals.length) return [];

    const porAsignatura = new Map<string, { nota: number; nombre: string; fecha: string }[]>();

    for (const c of cals) {
      const asignatura = c.nombreAsignatura ?? 'Sin asignatura';
      if (!porAsignatura.has(asignatura)) porAsignatura.set(asignatura, []);
      porAsignatura.get(asignatura)!.push({
        nota: c.notaCalificacion,
        nombre: c.nombreEvaluacion,
        fecha: c.fechaEvaluacion,
      });
    }

    return Array.from(porAsignatura.entries()).map(([nombre, items]) => ({
      nombreAsignatura: nombre,
      promedio: +(items.reduce((s, i) => s + i.nota, 0) / items.length).toFixed(1),
      calificaciones: items,
    }));
  });

  promedioGeneral = computed(() => {
    const resumen = this.resumenCalificaciones();
    if (!resumen.length) return null;
    return +(resumen.reduce((s, r) => s + r.promedio, 0) / resumen.length).toFixed(1);
  });

  // ── Computed: resumen asistencia ─────────────────────────────────────────────
  resumenAsistencia = computed<ResumenAsistencia>(() => {
    const asis = this.asistencias();
    const total = asis.length;
    const presentes = asis.filter(a => a.estadoAsistencia === 'Presente').length;
    const ausentes = asis.filter(a => a.estadoAsistencia === 'Ausente').length;
    const justificados = asis.filter(a => a.estadoAsistencia === 'Justificado').length;
    const porcentaje = total > 0 ? +((presentes + justificados) / total * 100).toFixed(1) : 0;
    return { total, presentes, ausentes, justificados, porcentajeAsistencia: porcentaje };
  });

  // ── Asistencias ordenadas ────────────────────────────────────────────────────
  asistenciasOrdenadas = computed(() =>
    [...this.asistencias()].sort((a, b) => {
      const [da, ma, ya] = a.fechaAsistencia.split('-').map(Number);
      const [db, mb, yb] = b.fechaAsistencia.split('-').map(Number);
      return new Date(yb, mb - 1, db).getTime() - new Date(ya, ma - 1, da).getTime();
    })
  );

  ngOnInit(): void {
    this.cargarAlumnos();
  }

  private cargarAlumnos(): void {
    const usuario = this.servicioToken.obtenerInfoUsuario();
    if (!usuario) return;

    this.cargandoAlumnos.set(true);
    this.errorAlumnos.set('');

    forkJoin({
      apoderados: this.servicioSeguimiento.obtenerApoderados(),
      estudiantes: this.servicioRelaciones.obtenerEstudiantes(),
    }).subscribe({
      next: ({ apoderados, estudiantes }) => {
        const apoderado = apoderados.find(a => a.usuario.idUsuario === Number(usuario.idUsuario));
        if (!apoderado) {
          this.errorAlumnos.set('No se encontró un perfil de apoderado para tu cuenta.');
          this.cargandoAlumnos.set(false);
          return;
        }

        this.servicioRelaciones.obtenerEstudiantesDeApoderado(apoderado.idApoderado).subscribe({
          next: (relaciones: RelacionApEst[]) => {
            const estudianteMap = new Map<number, EstudianteResponse>(
              estudiantes.map(e => [e.idEstudiante, e])
            );
            const lista: AlumnoConParentesco[] = relaciones
              .map(rel => {
                const est = estudianteMap.get(rel.id.idEstudiante);
                return est ? { estudiante: est, parentesco: rel.parentescoApoderadoEstudiante } : null;
              })
              .filter((x): x is AlumnoConParentesco => x !== null);

            this.alumnos.set(lista);
            this.cargandoAlumnos.set(false);
          },
          error: () => {
            this.errorAlumnos.set('Error al cargar los alumnos asignados.');
            this.cargandoAlumnos.set(false);
          },
        });
      },
      error: () => {
        this.errorAlumnos.set('Error al cargar la información. Intenta de nuevo.');
        this.cargandoAlumnos.set(false);
      },
    });
  }

  seleccionarAlumno(alumno: AlumnoConParentesco): void {
    this.alumnoSeleccionado.set(alumno);
    this.tabActiva.set('calificaciones');
    this.cargarDetalleAlumno(alumno.estudiante);
  }

  volverALista(): void {
    this.alumnoSeleccionado.set(null);
    this.calificaciones.set([]);
    this.asistencias.set([]);
    this.matriculas.set([]);
    this.errorDetalle.set('');
    this.errorAsistencia.set('');
  }

  private cargarDetalleAlumno(estudiante: EstudianteResponse): void {
    this.cargandoDetalle.set(true);
    this.errorDetalle.set('');

    forkJoin({
      matriculas: this.servicioAcademico.listarMatriculas(),
      asistencias: this.servicioSeguimiento.obtenerAsistencias().pipe(
        catchError(() => {
          this.errorAsistencia.set('El servicio de asistencia no está disponible en este momento.');
          return of([] as import('../../models/seguimiento.models').Asistencia[]);
        })
      ),
    }).subscribe({
      next: ({ matriculas, asistencias }) => {
        const matriculasAlumno = matriculas.filter(
          m => m.estudianteIdUsuario === estudiante.usuario.idUsuario
        );
        this.matriculas.set(matriculasAlumno);

        const idsMatricula = matriculasAlumno.map(m => m.idMatricula);

        this.asistencias.set(
          asistencias.filter(a => idsMatricula.includes(a.idMatricula))
        );

        if (!matriculasAlumno.length) {
          this.calificaciones.set([]);
          this.cargandoDetalle.set(false);
          return;
        }

        forkJoin(
          matriculasAlumno.map(m =>
            this.servicioAcademico.listarCalificacionesPorMatricula(m.idMatricula)
          )
        ).subscribe({
          next: (resultados) => {
            this.calificaciones.set(resultados.flat());
            this.cargandoDetalle.set(false);
          },
          error: () => {
            this.errorDetalle.set('Error al cargar las calificaciones.');
            this.cargandoDetalle.set(false);
          },
        });
      },
      error: () => {
        this.errorDetalle.set('Error al cargar los datos del alumno.');
        this.cargandoDetalle.set(false);
      },
    });
  }

  nombreCompleto(est: EstudianteResponse): string {
    const u = est.usuario;
    return [u.nombreUsuario, u.primerApellidoUsuario, u.segundoApellidoUsuario]
      .filter(Boolean)
      .join(' ');
  }

  cursoPrincipal(): string {
    const mats = this.matriculas();
    if (!mats.length) return 'Sin matrícula';
    const m = mats[mats.length - 1];
    return `${m.gradoCurso} ${m.seccionCurso} (${m.anioCurso})`;
  }

  colorPromedio(nota: number): string {
    if (nota >= 6) return 'text-success fw-bold';
    if (nota >= 4) return 'text-warning fw-bold';
    return 'text-danger fw-bold';
  }

  colorEstado(estado: string): string {
    switch (estado) {
      case 'Presente': return 'badge bg-success';
      case 'Ausente': return 'badge bg-danger';
      case 'Justificado': return 'badge bg-warning text-dark';
      default: return 'badge bg-secondary';
    }
  }
}
