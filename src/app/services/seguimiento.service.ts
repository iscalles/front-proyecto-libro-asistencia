import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Asistencia } from '../models/seguimiento.models';
import { ApoderadoResponse } from '../models/relaciones.models';

@Injectable({ providedIn: 'root' })
export class ServicioSeguimiento {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  obtenerApoderados(): Observable<ApoderadoResponse[]> {
    return this.http.get<ApoderadoResponse[]>(`${this.api}/apoderado`);
  }

  obtenerAsistencias(): Observable<Asistencia[]> {
    return this.http.get<Asistencia[]>(`${this.api}/asistencia`);
  }
}
