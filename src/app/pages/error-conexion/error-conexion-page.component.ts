import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * PáginaErrorConexion
 * Se muestra cuando un microservicio no responde (status 0, 502, 503 o 504).
 * El interceptor de conexión redirige aquí conservando la URL de origen
 * en el query param `retornarA` para poder reintentar.
 */
@Component({
  selector: 'app-pagina-error-conexion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-conexion-page.component.html',
  styleUrl: './error-conexion-page.component.scss'
})
export class PáginaErrorConexion {
  private ruta = inject(ActivatedRoute);
  private enrutador = inject(Router);

  reintentar(): void {
    const retornarA = this.ruta.snapshot.queryParamMap.get('retornarA') || '/dashboard';
    this.enrutador.navigateByUrl(retornarA);
  }

  irAlDashboard(): void {
    this.enrutador.navigate(['/dashboard']);
  }
}
