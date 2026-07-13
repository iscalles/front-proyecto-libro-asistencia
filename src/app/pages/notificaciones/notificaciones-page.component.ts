import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ServicioToken } from 'lib-auth';
import { ServicioNotificaciones } from '../../services/notificacion.service';
import { ETIQUETAS_TIPO_NOTIFICACION, Notificacion } from '../../models/notificacion.models';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [],
  templateUrl: './notificaciones-page.component.html',
  styleUrl: './notificaciones-page.component.scss'
})
export class PáginaNotificaciones implements OnInit {
  private servicioToken = inject(ServicioToken);
  private servicio = inject(ServicioNotificaciones);
  private enrutador = inject(Router);

  readonly usuarioSesion = this.servicioToken.obtenerSeñalInfoUsuario();
  readonly ETIQUETAS_TIPO_NOTIFICACION = ETIQUETAS_TIPO_NOTIFICACION;

  readonly notificaciones = signal<Notificacion[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  private idUsuario(): number | null {
    const usuario = this.usuarioSesion();
    return usuario ? Number(usuario.idUsuario) : null;
  }

  cargar(): void {
    const id = this.idUsuario();
    if (!id) return;
    this.cargando.set(true);
    this.error.set(null);
    this.servicio.listarPorUsuario(id).subscribe({
      next: lista => { this.notificaciones.set(lista); this.cargando.set(false); },
      error: () => {
        this.error.set('No se pudo cargar el historial de notificaciones.');
        this.cargando.set(false);
      }
    });
  }

  marcarLeida(n: Notificacion): void {
    if (n.leida) return;
    this.servicio.marcarLeida(n.id).subscribe({
      next: () => {
        this.notificaciones.update(lista =>
          lista.map(x => x.id === n.id ? { ...x, leida: true } : x)
        );
      },
      error: () => {}
    });
  }

  marcarTodasLeidas(): void {
    const id = this.idUsuario();
    if (!id) return;
    this.servicio.marcarTodasLeidas(id).subscribe({
      next: () => this.notificaciones.update(lista => lista.map(x => ({ ...x, leida: true }))),
      error: () => {}
    });
  }

  irAlDashboard(): void {
    this.enrutador.navigate(['/dashboard']);
  }
}
