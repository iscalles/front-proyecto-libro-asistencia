import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ComponenteModalExpiracionSesion } from 'lib-auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ComponenteModalExpiracionSesion],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'front-proyecto-libro-asistencia';
}
