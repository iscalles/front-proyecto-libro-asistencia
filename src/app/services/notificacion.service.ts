import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Notificacion } from '../models/notificacion.models';

// Todas las llamadas pasan por el BFF (puerto 8080), que reenvía a MS-Notificacion.
@Injectable({ providedIn: 'root' })
export class ServicioNotificaciones {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  listarPorUsuario(idUsuario: number): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${this.api}/notificaciones/usuario/${idUsuario}`);
  }

  contarNoLeidas(idUsuario: number): Observable<number> {
    return this.http.get<number>(`${this.api}/notificaciones/usuario/${idUsuario}/no-leidas/count`);
  }

  marcarLeida(id: number): Observable<Notificacion> {
    return this.http.put<Notificacion>(`${this.api}/notificaciones/${id}/marcar-leida`, {});
  }

  marcarTodasLeidas(idUsuario: number): Observable<void> {
    return this.http.put<void>(`${this.api}/notificaciones/usuario/${idUsuario}/marcar-todas-leidas`, {});
  }
}
