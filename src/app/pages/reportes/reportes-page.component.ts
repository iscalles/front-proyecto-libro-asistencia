import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ServicioToken } from 'lib-auth';
import { ServicioAcademico } from '../../services/academico.service';
import { Curso } from '../../models/academico.models';
import { ReporteAsistenciaTab } from './tabs/reporte-asistencia-tab.component';
import { ReporteConductaTab } from './tabs/reporte-conducta-tab.component';

type Tab = 'asistencia' | 'conducta';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [ReporteAsistenciaTab, ReporteConductaTab],
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

  onCursoChange(idCurso: string): void {
    const curso = this.cursos().find(c => c.id === Number(idCurso)) ?? null;
    this.cursoSeleccionado.set(curso);
  }

  irAlDashboard(): void {
    this.enrutador.navigate(['/dashboard']);
  }
}
