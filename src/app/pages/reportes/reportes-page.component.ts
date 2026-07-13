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
  selector: 'app-reportes',
  standalone: true,
  imports: [ReporteAsistenciaTab, ReporteConductaTab, ReporteAlumnosTab, CampanitaNotificaciones, CampanitaMensajes],
  templateUrl: './reportes-page.component.html',
  styleUrl: './reportes-shared.scss'
})
export class PáginaReportes implements OnInit {
  private servicioToken = inject(ServicioToken);
  private servicioAcademico = inject(ServicioAcademico);
  private enrutador = inject(Router);

  readonly usuarioSesion = this.servicioToken.obtenerSeñalInfoUsuario();

  readonly cursos = signal<Curso[]>([]);
  readonly cargandoCursos = signal(false);
  readonly errorCursos = signal<string | null>(null);

  readonly cursoSeleccionado = signal<Curso | null>(null);
  readonly tabActiva = signal<Tab>('asistencia');

  // ── Búsqueda y filtro de año sobre la grilla de tarjetas ────────────────────
  readonly busquedaCurso = signal('');

  // Por defecto se filtra por el año en curso; "" significa "todos los años"
  readonly anioSeleccionado = signal<string>(String(new Date().getFullYear()));

  readonly aniosDisponibles = computed(() => {
    const anios = new Set(this.cursos().map(c => c.anioCurso));
    return [...anios].sort((a, b) => b - a);
  });

  readonly cursosOrdenados = computed(() =>
    [...this.cursos()].sort((a, b) =>
      a.gradoCurso.localeCompare(b.gradoCurso, 'es', { numeric: true }) ||
      a.seccionCurso.localeCompare(b.seccionCurso, 'es')
    )
  );

  readonly cursosFiltrados = computed(() => {
    const q = this.busquedaCurso().toLowerCase().trim();
    const anio = this.anioSeleccionado();
    let lista = this.cursosOrdenados();

    if (anio) {
      lista = lista.filter(c => String(c.anioCurso) === anio);
    }
    if (q) {
      lista = lista.filter(c => `${c.gradoCurso} ${c.seccionCurso}`.toLowerCase().includes(q));
    }
    return lista;
  });

  ngOnInit(): void {
    this.cargarCursos();
  }

  cargarCursos(): void {
    this.cargandoCursos.set(true);
    this.errorCursos.set(null);
    this.servicioAcademico.listarCursos().subscribe({
      next: (cursos) => {
        this.cursos.set(cursos);
        this.cargandoCursos.set(false);
      },
      error: () => {
        this.errorCursos.set('No se pudieron cargar los cursos.');
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
