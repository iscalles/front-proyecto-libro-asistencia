import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ServicioToken } from 'lib-auth';
import { ServicioAcademico } from '../../services/academico.service';
import { Curso } from '../../models/academico.models';
import { ReporteAsistenciaTab } from './tabs/reporte-asistencia-tab.component';
import { ReporteConductaTab } from './tabs/reporte-conducta-tab.component';
import { ReporteAlumnosTab } from './tabs/reporte-alumnos-tab.component';
import { CampanitaNotificaciones } from '../../components/notificaciones/campanita-notificaciones.component';
import { CampanitaMensajes } from '../../components/mensajes/campanita-mensajes.component';

type Tab = 'asistencia' | 'conducta' | 'alumnos';

@Component({
  selector: 'app-reportes-docente',
  standalone: true,
  imports: [ReporteAsistenciaTab, ReporteConductaTab, ReporteAlumnosTab, CampanitaNotificaciones, CampanitaMensajes],
  templateUrl: './reportes-docente-page.component.html',
  styleUrl: './reportes-shared.scss'
})
export class PáginaReportesDocente implements OnInit {
  private servicioToken    = inject(ServicioToken);
  private servicioAcademico = inject(ServicioAcademico);
  private enrutador        = inject(Router);

  readonly usuarioSesion = this.servicioToken.obtenerSeñalInfoUsuario();

  readonly cursos         = signal<Curso[]>([]);
  readonly cargandoCursos = signal(false);
  readonly errorCursos    = signal<string | null>(null);

  readonly cursoSeleccionado = signal<Curso | null>(null);
  readonly tabActiva         = signal<Tab>('asistencia');
  readonly busquedaCurso     = signal('');

  readonly cursosFiltrados = computed(() => {
    const q = this.busquedaCurso().toLowerCase().trim();
    const lista = q
      ? this.cursos().filter(c => `${c.gradoCurso} ${c.seccionCurso}`.toLowerCase().includes(q))
      : this.cursos();
    return [...lista].sort((a, b) =>
      a.gradoCurso.localeCompare(b.gradoCurso, 'es', { numeric: true }) ||
      a.seccionCurso.localeCompare(b.seccionCurso, 'es')
    );
  });

  ngOnInit(): void {
    this.cargarCursos();
  }

  cargarCursos(): void {
    const idDocente = Number(this.usuarioSesion()?.idUsuario);
    this.cargandoCursos.set(true);
    this.errorCursos.set(null);
    this.servicioAcademico.listarCursoAsignaturas().subscribe({
      next: (registros) => {
        const misCursoAsig = registros.filter(r => r.docenteIdUsuario === idDocente);
        const vistos = new Set<number>();
        const cursos: Curso[] = [];
        for (const ca of misCursoAsig) {
          if (!vistos.has(ca.idCurso)) {
            vistos.add(ca.idCurso);
            cursos.push({
              id: ca.idCurso,
              gradoCurso: ca.gradoCurso,
              seccionCurso: ca.seccionCurso,
              anioCurso: ca.anioCurso
            });
          }
        }
        this.cursos.set(cursos);
        this.cargandoCursos.set(false);
      },
      error: () => {
        this.errorCursos.set('No se pudieron cargar tus cursos asignados.');
        this.cargandoCursos.set(false);
      }
    });
  }

  colorTarjeta(i: number): string {
    return `tarjeta-curso--color-${i % 6}`;
  }

  seleccionarCurso(curso: Curso): void {
    this.cursoSeleccionado.set(curso);
    this.tabActiva.set('asistencia');
  }

  volverASeleccion(): void {
    this.cursoSeleccionado.set(null);
  }

  irAlDashboard(): void {
    this.enrutador.navigate(['/dashboard']);
  }
}
