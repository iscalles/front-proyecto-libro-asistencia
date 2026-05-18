import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ServicioToken } from 'lib-auth';
import { CursosTab } from './tabs/cursos-tab.component';

// Identificador de cada pestaña del mantenedor
type Tab = 'cursos' | 'asignaturas' | 'evaluaciones'
         | 'matriculas' | 'curso-asignatura' | 'calificaciones';

@Component({
  selector: 'app-academico',
  standalone: true,
  imports: [CursosTab],
  templateUrl: './academico-page.component.html',
  styleUrl: './academico-page.component.scss'
})
export class PáginaAcademico {
  private servicioToken = inject(ServicioToken);
  private enrutador     = inject(Router);

  readonly usuarioSesion = this.servicioToken.obtenerSeñalInfoUsuario();

  // Pestaña actualmente visible
  readonly tabActiva = signal<Tab>('cursos');

  readonly tabs: { id: Tab; etiqueta: string }[] = [
    { id: 'cursos',           etiqueta: 'Cursos' },
    { id: 'asignaturas',      etiqueta: 'Asignaturas' },
    { id: 'evaluaciones',     etiqueta: 'Evaluaciones' },
    { id: 'matriculas',       etiqueta: 'Matrículas' },
    { id: 'curso-asignatura', etiqueta: 'Curso-Asignatura' },
    { id: 'calificaciones',   etiqueta: 'Calificaciones' },
  ];

  irAlDashboard(): void { this.enrutador.navigate(['/dashboard']); }
}
