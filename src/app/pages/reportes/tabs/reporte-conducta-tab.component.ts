import { Component, OnChanges, inject, signal, input } from '@angular/core';
import { ServicioAsistencia } from '../../../services/asistencia.service';
import { ExportarService } from '../../../services/exportar.service';
import { Curso } from '../../../models/academico.models';
import { ReporteConductaAlumno, Conducta, ETIQUETAS_TIPO_CONDUCTA } from '../../../models/asistencia.models';

@Component({
  selector: 'app-reporte-conducta-tab',
  standalone: true,
  imports: [],
  templateUrl: './reporte-conducta-tab.component.html',
  styleUrls: ['../reportes-shared.scss']
})
export class ReporteConductaTab implements OnChanges {
  readonly curso = input.required<Curso>();

  private servicio = inject(ServicioAsistencia);
  private exportar = inject(ExportarService);

  readonly resumen = signal<ReporteConductaAlumno[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly alumnoExpandido = signal<number | null>(null);
  readonly historial = signal<Conducta[]>([]);
  readonly cargandoHistorial = signal(false);

  ngOnChanges(): void {
    this.cargarResumen();
  }

  cargarResumen(): void {
    this.alumnoExpandido.set(null);
    this.cargando.set(true);
    this.error.set(null);
    this.servicio.reporteConductaPorCurso(this.curso().id).subscribe({
      next: (registros) => {
        this.resumen.set([...registros].sort((a, b) =>
          a.nombreEstudiante.localeCompare(b.nombreEstudiante, 'es')
        ));
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el resumen de conducta.');
        this.cargando.set(false);
      }
    });
  }

  toggleDetalle(alumno: ReporteConductaAlumno): void {
    if (this.alumnoExpandido() === alumno.estudianteIdUsuario) {
      this.alumnoExpandido.set(null);
      return;
    }
    this.alumnoExpandido.set(alumno.estudianteIdUsuario);
    this.cargandoHistorial.set(true);
    this.servicio.historialConductaPorEstudiante(alumno.estudianteIdUsuario).subscribe({
      next: (registros) => {
        this.historial.set(registros);
        this.cargandoHistorial.set(false);
      },
      error: () => {
        this.cargandoHistorial.set(false);
      }
    });
  }

  etiquetaTipo(tipo: string): string {
    return ETIQUETAS_TIPO_CONDUCTA[tipo as keyof typeof ETIQUETAS_TIPO_CONDUCTA] ?? tipo;
  }

  exportarPdf(): void {
    this.exportar.conductaPdf(this.resumen(), this.curso());
  }

  exportarExcel(): void {
    this.exportar.conductaExcel(this.resumen(), this.curso());
  }
}
