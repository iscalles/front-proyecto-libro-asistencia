import { Component, OnChanges, inject, signal, input } from '@angular/core';
import { ServicioAsistencia } from '../../../services/asistencia.service';
import { ExportarService } from '../../../services/exportar.service';
import { Curso } from '../../../models/academico.models';
import { ReporteAsistenciaDia, ReporteAsistenciaResumen, ETIQUETAS_ESTADO_ASISTENCIA } from '../../../models/asistencia.models';

function hoyIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function haceUnaSemanaIso(): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - 7);
  return fecha.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-reporte-asistencia-tab',
  standalone: true,
  imports: [],
  templateUrl: './reporte-asistencia-tab.component.html',
  styleUrls: ['../reportes-shared.scss']
})
export class ReporteAsistenciaTab implements OnChanges {
  readonly curso = input.required<Curso>();

  private servicio = inject(ServicioAsistencia);
  private exportar = inject(ExportarService);

  readonly etiquetasEstado = ETIQUETAS_ESTADO_ASISTENCIA;

  // ── Vista por día ────────────────────────────────────────────────────────────
  readonly fecha = signal(hoyIso());
  readonly reporteDia = signal<ReporteAsistenciaDia[]>([]);
  readonly cargandoDia = signal(false);
  readonly errorDia = signal<string | null>(null);

  // ── Resumen / % asistencia ──────────────────────────────────────────────────
  readonly desde = signal(haceUnaSemanaIso());
  readonly hasta = signal(hoyIso());
  readonly resumen = signal<ReporteAsistenciaResumen | null>(null);
  readonly cargandoResumen = signal(false);
  readonly errorResumen = signal<string | null>(null);

  ngOnChanges(): void {
    this.cargarDia();
    this.cargarResumen();
  }

  onFechaChange(evento: Event): void {
    this.fecha.set((evento.target as HTMLInputElement).value);
    this.cargarDia();
  }

  onDesdeChange(evento: Event): void {
    this.desde.set((evento.target as HTMLInputElement).value);
  }

  onHastaChange(evento: Event): void {
    this.hasta.set((evento.target as HTMLInputElement).value);
  }

  cargarDia(): void {
    this.cargandoDia.set(true);
    this.errorDia.set(null);
    this.servicio.reporteAsistenciaPorCursoYFecha(this.curso().id, this.fecha()).subscribe({
      next: (registros) => {
        this.reporteDia.set([...registros].sort((a, b) =>
          a.nombreEstudiante.localeCompare(b.nombreEstudiante, 'es')
        ));
        this.cargandoDia.set(false);
      },
      error: () => {
        this.errorDia.set('No se pudo cargar el reporte del día.');
        this.cargandoDia.set(false);
      }
    });
  }

  cargarResumen(): void {
    this.cargandoResumen.set(true);
    this.errorResumen.set(null);
    this.servicio.reporteResumenAsistenciaPorCurso(this.curso().id, this.desde(), this.hasta()).subscribe({
      next: (r) => {
        this.resumen.set(r);
        this.cargandoResumen.set(false);
      },
      error: () => {
        this.errorResumen.set('No se pudo calcular el resumen del periodo.');
        this.cargandoResumen.set(false);
      }
    });
  }

  etiquetaEstado(estado: string): string {
    return this.etiquetasEstado[estado as keyof typeof ETIQUETAS_ESTADO_ASISTENCIA] ?? estado;
  }

  exportarPdf(): void {
    this.exportar.asistenciaPdf(this.reporteDia(), this.curso(), this.fecha());
  }

  exportarExcel(): void {
    this.exportar.asistenciaExcel(this.reporteDia(), this.curso(), this.fecha());
  }
}
