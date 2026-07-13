import { Component, OnChanges, inject, signal, input } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ServicioAsistencia } from '../../../services/asistencia.service';
import { ExportarService } from '../../../services/exportar.service';
import { Curso } from '../../../models/academico.models';
import { ReporteAlumnoCompleto } from '../../../models/asistencia.models';
import { periodoSemestreActual, primerSemestre, segundoSemestre, TipoPeriodo } from '../reportes-fechas.util';

@Component({
  selector: 'app-reporte-alumnos-tab',
  standalone: true,
  imports: [],
  templateUrl: './reporte-alumnos-tab.component.html',
  styleUrls: ['../reportes-shared.scss']
})
export class ReporteAlumnosTab implements OnChanges {
  readonly curso = input.required<Curso>();

  private servicio = inject(ServicioAsistencia);
  private exportar = inject(ExportarService);

  private readonly periodoPorDefecto = periodoSemestreActual();
  readonly tipoPeriodo = signal<TipoPeriodo | 'personalizado'>(this.periodoPorDefecto.tipo);
  readonly desde = signal(this.periodoPorDefecto.desde);
  readonly hasta = signal(this.periodoPorDefecto.hasta);

  readonly alumnos = signal<ReporteAlumnoCompleto[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  ngOnChanges(): void {
    this.cargar();
  }

  onTipoPeriodoChange(evento: Event): void {
    const valor = (evento.target as HTMLSelectElement).value as TipoPeriodo | 'personalizado';
    this.tipoPeriodo.set(valor);
    if (valor === 'personalizado') {
      return;
    }
    const anio = new Date().getFullYear();
    const { desde, hasta } = valor === '1' ? primerSemestre(anio) : segundoSemestre(anio);
    this.desde.set(desde);
    this.hasta.set(hasta);
    this.cargar();
  }

  onDesdeChange(evento: Event): void {
    this.desde.set((evento.target as HTMLInputElement).value);
    this.tipoPeriodo.set('personalizado');
  }

  onHastaChange(evento: Event): void {
    this.hasta.set((evento.target as HTMLInputElement).value);
    this.tipoPeriodo.set('personalizado');
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    forkJoin({
      asistencia: this.servicio.reporteAlumnoPorCurso(this.curso().id, this.desde(), this.hasta()),
      conducta: this.servicio.reporteConductaPorCurso(this.curso().id)
    }).subscribe({
      next: ({ asistencia, conducta }) => {
        const conductaMap = new Map(conducta.map(c => [c.estudianteIdUsuario, c]));
        const combinado: ReporteAlumnoCompleto[] = asistencia
          .map(a => {
            const cond = conductaMap.get(a.estudianteIdUsuario);
            return {
              ...a,
              totalPositivas: cond?.totalPositivas ?? 0,
              totalNegativas: cond?.totalNegativas ?? 0
            };
          })
          .sort((a, b) => a.nombreEstudiante.localeCompare(b.nombreEstudiante, 'es'));
        this.alumnos.set(combinado);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el reporte por alumno.');
        this.cargando.set(false);
      }
    });
  }

  exportarPdf(): void {
    this.exportar.alumnosPdf(this.alumnos(), this.curso(), this.desde(), this.hasta());
  }

  exportarExcel(): void {
    this.exportar.alumnosExcel(this.alumnos(), this.curso(), this.desde(), this.hasta());
  }
}
