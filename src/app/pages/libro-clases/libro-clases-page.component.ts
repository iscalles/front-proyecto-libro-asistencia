import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ServicioToken } from 'lib-auth';
import { ServicioAcademico } from '../../services/academico.service';
import { CursoAsignatura } from '../../models/academico.models';
import { TomarAsistenciaTab } from './tabs/tomar-asistencia-tab.component';
import { ConductaTab } from './tabs/conducta-tab.component';

type Tab = 'asistencia' | 'conducta';

@Component({
  selector: 'app-libro-clases',
  standalone: true,
  imports: [TomarAsistenciaTab, ConductaTab],
  templateUrl: './libro-clases-page.component.html',
  styleUrl: './libro-clases-shared.scss'
})
export class PáginaLibroClases implements OnInit {
  private servicioToken = inject(ServicioToken);
  private servicioAcademico = inject(ServicioAcademico);
  private enrutador = inject(Router);

  readonly usuarioSesion = this.servicioToken.obtenerSeñalInfoUsuario();

  // Cursos-asignatura del docente autenticado (un docente puede dictar varias asignaturas/cursos)
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
  readonly tabActiva = signal<Tab>('asistencia');

  ngOnInit(): void {
    this.cargarMisCursos();
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

  colorTarjeta(i: number): string {
    return `tarjeta-curso--color-${i % 6}`;
  }

  seleccionarCurso(curso: CursoAsignatura): void {
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
