import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Curso, CursoRequest,
  Asignatura, AsignaturaRequest,
  Evaluacion, EvaluacionRequest,
  Matricula, MatriculaRequest,
  CursoAsignatura, CursoAsignaturaRequest,
  Calificacion, CalificacionRequest,
} from '../models/academico.models';

// Todas las llamadas pasan por el BFF (puerto 8080), que reenvía a MS-Academico.
@Injectable({ providedIn: 'root' })
export class ServicioAcademico {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  // ── Cursos ──────────────────────────────────────────────────────────────────
  listarCursos(): Observable<Curso[]> {
    return this.http.get<Curso[]>(`${this.api}/cursos`);
  }
  crearCurso(dto: CursoRequest): Observable<Curso> {
    return this.http.post<Curso>(`${this.api}/cursos`, dto);
  }
  actualizarCurso(id: number, dto: CursoRequest): Observable<Curso> {
    return this.http.put<Curso>(`${this.api}/cursos/${id}`, dto);
  }
  eliminarCurso(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/cursos/${id}`);
  }

  // ── Asignaturas ─────────────────────────────────────────────────────────────
  listarAsignaturas(): Observable<Asignatura[]> {
    return this.http.get<Asignatura[]>(`${this.api}/asignaturas`);
  }
  crearAsignatura(dto: AsignaturaRequest): Observable<Asignatura> {
    return this.http.post<Asignatura>(`${this.api}/asignaturas`, dto);
  }
  actualizarAsignatura(id: number, dto: AsignaturaRequest): Observable<Asignatura> {
    return this.http.put<Asignatura>(`${this.api}/asignaturas/${id}`, dto);
  }
  eliminarAsignatura(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/asignaturas/${id}`);
  }

  // ── Evaluaciones ────────────────────────────────────────────────────────────
  listarEvaluaciones(): Observable<Evaluacion[]> {
    return this.http.get<Evaluacion[]>(`${this.api}/evaluaciones`);
  }
  crearEvaluacion(dto: EvaluacionRequest): Observable<Evaluacion> {
    return this.http.post<Evaluacion>(`${this.api}/evaluaciones`, dto);
  }
  actualizarEvaluacion(id: number, dto: EvaluacionRequest): Observable<Evaluacion> {
    return this.http.put<Evaluacion>(`${this.api}/evaluaciones/${id}`, dto);
  }
  eliminarEvaluacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/evaluaciones/${id}`);
  }

  // ── Matriculas ──────────────────────────────────────────────────────────────
  listarMatriculas(): Observable<Matricula[]> {
    return this.http.get<Matricula[]>(`${this.api}/matriculas`);
  }
  crearMatricula(dto: MatriculaRequest): Observable<Matricula> {
    return this.http.post<Matricula>(`${this.api}/matriculas`, dto);
  }
  actualizarMatricula(id: number, dto: MatriculaRequest): Observable<Matricula> {
    return this.http.put<Matricula>(`${this.api}/matriculas/${id}`, dto);
  }
  eliminarMatricula(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/matriculas/${id}`);
  }

  // ── Curso-Asignatura ────────────────────────────────────────────────────────
  listarCursoAsignaturas(): Observable<CursoAsignatura[]> {
    return this.http.get<CursoAsignatura[]>(`${this.api}/curso-asignatura`);
  }
  crearCursoAsignatura(dto: CursoAsignaturaRequest): Observable<CursoAsignatura> {
    return this.http.post<CursoAsignatura>(`${this.api}/curso-asignatura`, dto);
  }
  actualizarCursoAsignatura(id: number, dto: CursoAsignaturaRequest): Observable<CursoAsignatura> {
    return this.http.put<CursoAsignatura>(`${this.api}/curso-asignatura/${id}`, dto);
  }
  eliminarCursoAsignatura(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/curso-asignatura/${id}`);
  }

  // ── Calificaciones ──────────────────────────────────────────────────────────
  listarCalificaciones(): Observable<Calificacion[]> {
    return this.http.get<Calificacion[]>(`${this.api}/calificaciones`);
  }
  crearCalificacion(dto: CalificacionRequest): Observable<Calificacion> {
    return this.http.post<Calificacion>(`${this.api}/calificaciones`, dto);
  }
  actualizarCalificacion(id: number, dto: CalificacionRequest): Observable<Calificacion> {
    return this.http.put<Calificacion>(`${this.api}/calificaciones/${id}`, dto);
  }
  eliminarCalificacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/calificaciones/${id}`);
  }
}
