import { Component, HostListener, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServicioToken } from 'lib-auth';
import { ServicioNotificaciones } from '../../services/notificacion.service';
import { ETIQUETAS_TIPO_NOTIFICACION, Notificacion } from '../../models/notificacion.models';

// Cada cuántos ms se vuelve a consultar el contador de no leídas mientras hay sesión activa.
const INTERVALO_POLLING_MS = 30000;

@Component({
  selector: 'app-campanita-notificaciones',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './campanita-notificaciones.component.html',
  styleUrl: './campanita-notificaciones.component.scss'
})
export class CampanitaNotificaciones implements OnDestroy {
  private servicioToken = inject(ServicioToken);
  private servicio = inject(ServicioNotificaciones);

  readonly ETIQUETAS_TIPO_NOTIFICACION = ETIQUETAS_TIPO_NOTIFICACION;

  readonly idUsuario = computed(() => {
    const usuario = this.servicioToken.obtenerSeñalInfoUsuario()();
    return usuario ? Number(usuario.idUsuario) : null;
  });

  readonly abierto = signal(false);
  readonly cargando = signal(false);
  readonly noLeidas = signal(0);
  readonly notificaciones = signal<Notificacion[]>([]);

  private timerPolling: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Reacciona al login/logout: arranca o detiene el polling según haya sesión.
    effect(() => {
      const id = this.idUsuario();
      if (id) {
        this.actualizarContador(id);
        this.iniciarPolling(id);
      } else {
        this.detenerPolling();
        this.noLeidas.set(0);
        this.notificaciones.set([]);
        this.abierto.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.detenerPolling();
  }

  private iniciarPolling(idUsuario: number): void {
    this.detenerPolling();
    this.timerPolling = setInterval(() => this.actualizarContador(idUsuario), INTERVALO_POLLING_MS);
  }

  private detenerPolling(): void {
    if (this.timerPolling) {
      clearInterval(this.timerPolling);
      this.timerPolling = null;
    }
  }

  private actualizarContador(idUsuario: number): void {
    this.servicio.contarNoLeidas(idUsuario).subscribe({
      next: total => this.noLeidas.set(total),
      error: () => {}
    });
  }

  toggle(evento: MouseEvent): void {
    evento.stopPropagation();
    const yaAbierto = this.abierto();
    this.abierto.set(!yaAbierto);
    if (!yaAbierto) {
      this.cargarLista();
    }
  }

  @HostListener('document:click')
  cerrar(): void {
    this.abierto.set(false);
  }

  private cargarLista(): void {
    const id = this.idUsuario();
    if (!id) return;
    this.cargando.set(true);
    this.servicio.listarPorUsuario(id).subscribe({
      next: lista => { this.notificaciones.set(lista); this.cargando.set(false); },
      error: () => { this.cargando.set(false); }
    });
  }

  marcarLeida(n: Notificacion, evento: MouseEvent): void {
    evento.stopPropagation();
    if (n.leida) return;
    this.servicio.marcarLeida(n.id).subscribe({
      next: () => {
        this.notificaciones.update(lista =>
          lista.map(x => x.id === n.id ? { ...x, leida: true } : x)
        );
        this.noLeidas.update(total => Math.max(0, total - 1));
      },
      error: () => {}
    });
  }

  marcarTodasLeidas(evento: MouseEvent): void {
    evento.stopPropagation();
    const id = this.idUsuario();
    if (!id) return;
    this.servicio.marcarTodasLeidas(id).subscribe({
      next: () => {
        this.notificaciones.update(lista => lista.map(x => ({ ...x, leida: true })));
        this.noLeidas.set(0);
      },
      error: () => {}
    });
  }
}
