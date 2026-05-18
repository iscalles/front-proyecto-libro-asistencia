import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApoderadoResponse, EstudianteResponse, RelacionApEst } from '../models/relaciones.models';

@Injectable({ providedIn: 'root' })
export class ServicioRelaciones {
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  obtenerApoderados(): Observable<ApoderadoResponse[]> {
    return this.http.get<ApoderadoResponse[]>(`${this.api}/apoderado`);
  }

  obtenerEstudiantes(): Observable<EstudianteResponse[]> {
    return this.http.get<EstudianteResponse[]>(`${this.api}/estudiante`);
  }

  obtenerEstudiantesDeApoderado(idApoderado: number): Observable<RelacionApEst[]> {
    return this.http.get<RelacionApEst[]>(
      `${this.api}/apoderado-estudiante/apoderado/${idApoderado}/estudiantes`
    );
  }

  crearRelacion(idApoderado: number, idEstudiante: number, parentesco: string): Observable<RelacionApEst> {
    return this.http.post<RelacionApEst>(`${this.api}/apoderado-estudiante`, {
      idApoderado,
      idEstudiante,
      parentescoApoderadoEstudiante: parentesco,
    });
  }

  eliminarRelacion(idApoderado: number, idEstudiante: number): Observable<void> {
    return this.http.delete<void>(
      `${this.api}/apoderado-estudiante/apoderado/${idApoderado}/estudiante/${idEstudiante}`
    );
  }
}
