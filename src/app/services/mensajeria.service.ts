import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Mensaje, MensajeRequest } from '../models/mensajeria.models';

// Todas las llamadas pasan por el BFF (puerto 8080), que reenvía a MS-Mensajeria
// e inyecta el header X-User-Id a partir del JWT (ver MicroserviceProxy en bff-service).
@Injectable({ providedIn: 'root' })
export class ServicioMensajeria {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  enviarMensaje(dto: MensajeRequest): Observable<Mensaje> {
    return this.http.post<Mensaje>(`${this.api}/mensajes`, dto);
  }

  listarConversacion(idUsuario1: number, idUsuario2: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.api}/mensajes/conversacion`, {
      params: { usuario1: idUsuario1, usuario2: idUsuario2 }
    });
  }

  listarBandejaEntrada(idUsuario: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.api}/mensajes/bandeja/${idUsuario}`);
  }

  contarNoLeidos(idUsuario: number): Observable<number> {
    return this.http.get<number>(`${this.api}/mensajes/bandeja/${idUsuario}/no-leidos/count`);
  }

  marcarLeido(id: number): Observable<Mensaje> {
    return this.http.put<Mensaje>(`${this.api}/mensajes/${id}/marcar-leido`, {});
  }
}
