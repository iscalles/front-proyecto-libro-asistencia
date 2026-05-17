import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponenteFormularioAcceso } from 'lib-auth';

/**
 * PáginaAcceso
 * Componente de página que contiene el formulario de acceso
 * Se utiliza como página enrutable
 */
@Component({
  selector: 'app-pagina-acceso',
  standalone: true,
  imports: [CommonModule, ComponenteFormularioAcceso],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class PáginaAcceso {}
