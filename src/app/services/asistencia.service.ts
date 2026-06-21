import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  RosterAlumno,
  Asistencia, AsistenciaLoteRequest,
  Conducta, ConductaRequest,
  ReporteAsistenciaDia, ReporteAsistenciaResumen, ReporteConductaAlumno,
} from '../models/asistencia.models';

// Convierte un Date a dd-MM-yyyy (formato que espera el backend)
function aFormatoBackend(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}-${mes}-${anio}`;
}

// Todas las llamadas pasan por el BFF (puerto 8080), que reenvía a MS-Asistencia.
@Injectable({ providedIn: 'root' })
export class ServicioAsistencia {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  // ── Asistencia ──────────────────────────────────────────────────────────────
  obtenerRosterCurso(idCurso: number): Observable<RosterAlumno[]> {
    return this.http.get<RosterAlumno[]>(`${this.api}/asistencia/curso/${idCurso}/roster`);
  }

  historialAsistenciaPorMatricula(idMatricula: number): Observable<Asistencia[]> {
    return this.http.get<Asistencia[]>(`${this.api}/asistencia/matricula/${idMatricula}`);
  }

  registrarAsistenciaLote(dto: AsistenciaLoteRequest): Observable<Asistencia[]> {
    return this.http.post<Asistencia[]>(`${this.api}/asistencia/lote`, dto);
  }

  // ── Conducta ────────────────────────────────────────────────────────────────
  historialConductaPorEstudiante(estudianteIdUsuario: number): Observable<Conducta[]> {
    return this.http.get<Conducta[]>(`${this.api}/conducta/estudiante/${estudianteIdUsuario}`);
  }

  crearConducta(dto: ConductaRequest): Observable<Conducta> {
    return this.http.post<Conducta>(`${this.api}/conducta`, dto);
  }

  // ── Reportes administrativos ────────────────────────────────────────────────
  // Las fechas se reciben en formato yyyy-MM-dd (del <input type="date">) y se
  // convierten a dd-MM-yyyy, que es lo que espera el backend.
  reporteAsistenciaPorCursoYFecha(idCurso: number, fechaIso: string): Observable<ReporteAsistenciaDia[]> {
    const params = new HttpParams().set('fecha', aFormatoBackend(fechaIso));
    return this.http.get<ReporteAsistenciaDia[]>(`${this.api}/asistencia/curso/${idCurso}/reporte-dia`, { params });
  }

  reporteResumenAsistenciaPorCurso(idCurso: number, desdeIso: string, hastaIso: string): Observable<ReporteAsistenciaResumen> {
    const params = new HttpParams()
      .set('desde', aFormatoBackend(desdeIso))
      .set('hasta', aFormatoBackend(hastaIso));
    return this.http.get<ReporteAsistenciaResumen>(`${this.api}/asistencia/curso/${idCurso}/reporte-resumen`, { params });
  }

  reporteConductaPorCurso(idCurso: number): Observable<ReporteConductaAlumno[]> {
    return this.http.get<ReporteConductaAlumno[]>(`${this.api}/conducta/curso/${idCurso}/reporte-resumen`);
  }
}
