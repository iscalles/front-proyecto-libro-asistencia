import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  RosterAlumno,
  Asistencia, AsistenciaLoteRequest,
  Conducta, ConductaRequest,
} from '../models/asistencia.models';

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
}
