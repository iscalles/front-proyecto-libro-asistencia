import { Component, HostListener, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServicioToken } from 'lib-auth';
import { ServicioMensajeria } from '../../services/mensajeria.service';
import { ServicioUsuarioAdmin } from '../../services/usuario-admin.service';
import { UsuarioDTOResponse } from '../../models/usuario-admin.models';

// Cada cuántos ms se vuelve a consultar el contador de no leídos mientras hay sesión activa.
// Es un poco menos agresivo que el de la página de Mensajes porque esta campanita vive en
// TODAS las páginas (navbar), no solo mientras se está chateando.
const INTERVALO_POLLING_MS = 30000;

interface ResumenRemitente {
  idUsuario: number;
  nombre: string;
  cantidad: number;
}

@Component({
  selector: 'app-campanita-mensajes',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './campanita-mensajes.component.html',
  styleUrl: './campanita-mensajes.component.scss'
})
export class CampanitaMensajes implements OnDestroy {
  private servicioToken = inject(ServicioToken);
  private servicioMensajeria = inject(ServicioMensajeria);
  private servicioUsuarioAdmin = inject(ServicioUsuarioAdmin);

  readonly idUsuario = computed(() => {
    const usuario = this.servicioToken.obtenerSeñalInfoUsuario()();
    return usuario ? Number(usuario.idUsuario) : null;
  });

  readonly abierto = signal(false);
  readonly cargando = signal(false);
  readonly totalNoLeidos = signal(0);
  readonly resumenPorRemitente = signal<ResumenRemitente[]>([]);

  private timerPolling: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Reacciona al login/logout: arranca o detiene el polling según haya sesión.
    effect(() => {
      const id = this.idUsuario();
      if (id) {
        this.actualizar(id);
        this.iniciarPolling(id);
      } else {
        this.detenerPolling();
        this.totalNoLeidos.set(0);
        this.resumenPorRemitente.set([]);
        this.abierto.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.detenerPolling();
  }

  private iniciarPolling(idUsuario: number): void {
    this.detenerPolling();
    this.timerPolling = setInterval(() => this.actualizar(idUsuario), INTERVALO_POLLING_MS);
  }

  private detenerPolling(): void {
    if (this.timerPolling) {
      clearInterval(this.timerPolling);
      this.timerPolling = null;
    }
  }

  private actualizar(idUsuario: number): void {
    this.cargando.set(true);
    this.servicioMensajeria.listarBandejaEntrada(idUsuario).subscribe({
      next: mensajes => {
        const noLeidos = mensajes.filter(m => m.estadoMensaje === 'NO_LEIDO');
        this.totalNoLeidos.set(noLeidos.length);

        if (noLeidos.length === 0) {
          this.resumenPorRemitente.set([]);
          this.cargando.set(false);
          return;
        }

        const conteoPorEmisor = new Map<number, number>();
        for (const m of noLeidos) {
          conteoPorEmisor.set(m.idUsuarioEmisor, (conteoPorEmisor.get(m.idUsuarioEmisor) ?? 0) + 1);
        }

        this.servicioUsuarioAdmin.listarUsuarios().subscribe({
          next: usuarios => {
            const nombrePorId = new Map(usuarios.map(u => [u.idUsuario, this.nombreCompleto(u)]));
            this.resumenPorRemitente.set(
              Array.from(conteoPorEmisor.entries()).map(([idUsuarioEmisor, cantidad]) => ({
                idUsuario: idUsuarioEmisor,
                nombre: nombrePorId.get(idUsuarioEmisor) ?? `Usuario ${idUsuarioEmisor}`,
                cantidad
              }))
            );
            this.cargando.set(false);
          },
          error: () => this.cargando.set(false)
        });
      },
      error: () => this.cargando.set(false)
    });
  }

  private nombreCompleto(u: UsuarioDTOResponse): string {
    return [u.nombreUsuario, u.primerApellidoUsuario, u.segundoApellidoUsuario]
      .filter(Boolean)
      .join(' ');
  }

  toggle(evento: MouseEvent): void {
    evento.stopPropagation();
    this.abierto.update(v => !v);
  }

  @HostListener('document:click')
  cerrar(): void {
    this.abierto.set(false);
  }
}
