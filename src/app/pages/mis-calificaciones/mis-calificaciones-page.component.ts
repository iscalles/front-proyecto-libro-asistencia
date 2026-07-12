import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ServicioToken } from 'lib-auth';
import { ServicioAcademico } from '../../services/academico.service';
import { Matricula, Calificacion, CursoAsignatura } from '../../models/academico.models';
import { ResumenCalificaciones } from '../../models/seguimiento.models';
import { CampanitaNotificaciones } from '../../components/notificaciones/campanita-notificaciones.component';
import { CampanitaMensajes } from '../../components/mensajes/campanita-mensajes.component';

@Component({
  selector: 'app-mis-calificaciones',
  standalone: true,
  imports: [CampanitaNotificaciones, CampanitaMensajes],
  templateUrl: './mis-calificaciones-page.component.html',
  styleUrl: './mis-calificaciones-shared.scss'
})
export class PáginaMisCalificaciones implements OnInit {
  private servicioToken = inject(ServicioToken);
  private servicioAcademico = inject(ServicioAcademico);
  private enrutador = inject(Router);

  readonly usuarioSesion = this.servicioToken.obtenerSeñalInfoUsuario();

  readonly tabActiva = signal<'calificaciones' | 'asignaturas'>('calificaciones');

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly matriculas = signal<Matricula[]>([]);
  readonly calificaciones = signal<Calificacion[]>([]);
  readonly cursoAsignaturas = signal<CursoAsignatura[]>([]);

  // ── Matrícula vigente (la más reciente) ─────────────────────────────────────
  readonly matriculaActual = computed<Matricula | null>(() => {
    const mats = this.matriculas();
    return mats.length ? mats[mats.length - 1] : null;
  });

  // ── Asignaturas del curso de la matrícula actual ────────────────────────────
  readonly misAsignaturas = computed<CursoAsignatura[]>(() => {
    const curso = this.matriculaActual();
    if (!curso) return [];
    return this.cursoAsignaturas().filter(ca => ca.idCurso === curso.idCurso);
  });

  // ── Resumen de calificaciones por asignatura ────────────────────────────────
  readonly resumenCalificaciones = computed<ResumenCalificaciones[]>(() => {
    const cals = this.calificaciones();
    if (!cals.length) return [];

    const porAsignatura = new Map<string, { nota: number; nombre: string; fecha: string }[]>();
    const docentePorAsignatura = new Map<string, string>();

    for (const c of cals) {
      const asignatura = c.nombreAsignatura ?? 'Sin asignatura';
      if (!porAsignatura.has(asignatura)) porAsignatura.set(asignatura, []);
      porAsignatura.get(asignatura)!.push({
        nota: c.notaCalificacion,
        nombre: c.nombreEvaluacion,
        fecha: c.fechaEvaluacion,
      });
      if (c.nombreDocente && !docentePorAsignatura.has(asignatura)) {
        docentePorAsignatura.set(asignatura, c.nombreDocente);
      }
    }

    return Array.from(porAsignatura.entries()).map(([nombre, items]) => ({
      nombreAsignatura: nombre,
      nombreDocente: docentePorAsignatura.get(nombre) ?? 'Sin docente asignado',
      promedio: +(items.reduce((s, i) => s + i.nota, 0) / items.length).toFixed(1),
      calificaciones: items,
    }));
  });

  readonly promedioGeneral = computed(() => {
    const resumen = this.resumenCalificaciones();
    if (!resumen.length) return null;
    return +(resumen.reduce((s, r) => s + r.promedio, 0) / resumen.length).toFixed(1);
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    const idUsuario = Number(this.usuarioSesion()?.idUsuario);
    this.cargando.set(true);
    this.error.set(null);

    forkJoin({
      matriculas: this.servicioAcademico.listarMatriculas(),
      cursoAsignaturas: this.servicioAcademico.listarCursoAsignaturas(),
    }).subscribe({
      next: ({ matriculas, cursoAsignaturas }) => {
        const misMatriculas = matriculas.filter(m => m.estudianteIdUsuario === idUsuario);
        this.matriculas.set(misMatriculas);
        this.cursoAsignaturas.set(cursoAsignaturas);

        if (!misMatriculas.length) {
          this.calificaciones.set([]);
          this.cargando.set(false);
          return;
        }

        forkJoin(
          misMatriculas.map(m => this.servicioAcademico.listarCalificacionesPorMatricula(m.idMatricula))
        ).subscribe({
          next: (resultados) => {
            this.calificaciones.set(resultados.flat());
            this.cargando.set(false);
          },
          error: () => {
            this.error.set('No se pudieron cargar tus calificaciones.');
            this.cargando.set(false);
          },
        });
      },
      error: () => {
        this.error.set('No se pudo cargar tu información académica.');
        this.cargando.set(false);
      },
    });
  }

  colorTarjeta(i: number): string {
    return `tarjeta-curso--color-${i % 6}`;
  }

  colorPromedio(nota: number): string {
    if (nota >= 6) return 'text-success fw-bold';
    if (nota >= 4) return 'text-warning fw-bold';
    return 'text-danger fw-bold';
  }

  nivelRendimiento(nota: number): 'alto' | 'medio' | 'bajo' {
    if (nota >= 6) return 'alto';
    if (nota >= 4) return 'medio';
    return 'bajo';
  }

  irAlDashboard(): void {
    this.enrutador.navigate(['/dashboard']);
  }
}
