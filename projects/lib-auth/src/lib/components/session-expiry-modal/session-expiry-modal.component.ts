import { Component, inject, computed } from '@angular/core';
import { ServicioExpiracionSesion } from '../../services/session-expiry.service';

/**
 * ComponenteModalExpiracionSesion
 * Modal global que avisa al usuario un par de minutos antes de que su sesión expire,
 * permitiéndole extenderla (refresh token) o cerrarla. Se monta una sola vez en la
 * raíz de la app (app.component.html); el propio ServicioExpiracionSesion decide
 * cuándo mostrarlo.
 */
@Component({
  selector: 'app-modal-expiracion-sesion',
  standalone: true,
  imports: [],
  templateUrl: './session-expiry-modal.component.html',
  styleUrl: './session-expiry-modal.component.scss'
})
export class ComponenteModalExpiracionSesion {
  private servicio = inject(ServicioExpiracionSesion);

  readonly mostrar = this.servicio.mostrarModal;
  readonly extendiendo = this.servicio.extendiendo;
  readonly error = this.servicio.errorExtender;

  readonly tiempoFormateado = computed(() => {
    const segundos = this.servicio.segundosRestantes();
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${min}:${seg.toString().padStart(2, '0')}`;
  });

  extenderSesion(): void {
    this.servicio.extenderSesion();
  }

  cerrarSesion(): void {
    this.servicio.cerrarSesionManual();
  }
}
