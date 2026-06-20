import { Component, OnInit, OnChanges, inject, signal, computed, input } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ServicioToken } from 'lib-auth';
import { ServicioAsistencia } from '../../../services/asistencia.service';
import { CursoAsignatura } from '../../../models/academico.models';
import {
  RosterAlumno, Conducta, ConductaRequest,
  TIPOS_CONDUCTA, ETIQUETAS_TIPO_CONDUCTA,
} from '../../../models/asistencia.models';

function aFormatoBackend(fechaIso: string): string {
  const [anio, mes, dia] = fechaIso.split('-');
  return `${dia}-${mes}-${anio}`;
}

@Component({
  selector: 'app-conducta-tab',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './conducta-tab.component.html',
  styleUrls: ['../libro-clases-shared.scss']
})
export class ConductaTab implements OnInit, OnChanges {
  readonly curso = input.required<CursoAsignatura>();

  private servicio = inject(ServicioAsistencia);
  private servicioToken = inject(ServicioToken);
  private fb = inject(FormBuilder);

  readonly tipos = TIPOS_CONDUCTA;
  readonly etiquetasTipo = ETIQUETAS_TIPO_CONDUCTA;

  readonly roster = signal<RosterAlumno[]>([]);
  readonly cargandoRoster = signal(false);
  readonly errorRoster = signal<string | null>(null);

  readonly busqueda = signal('');

  readonly rosterFiltrado = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    if (!q) return this.roster();
    return this.roster().filter(a =>
      a.nombreEstudiante.toLowerCase().includes(q) ||
      a.rutEstudiante?.toLowerCase().includes(q)
    );
  });

  readonly alumnoSeleccionado = signal<RosterAlumno | null>(null);
  readonly historial = signal<Conducta[]>([]);
  readonly cargandoHistorial = signal(false);

  readonly guardando = signal(false);
  readonly errorGuardar = signal<string | null>(null);

  readonly modalCrear = signal(false);

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      tipoConducta: ['positiva', Validators.required],
      descripcionConducta: ['', Validators.required],
      fechaConducta: [new Date().toISOString().slice(0, 10), Validators.required],
    });
    this.cargarRoster();
  }

  ngOnChanges(): void {
    this.alumnoSeleccionado.set(null);
    this.historial.set([]);
    if (this.form) {
      this.cargarRoster();
    }
  }

  cargarRoster(): void {
    this.cargandoRoster.set(true);
    this.errorRoster.set(null);
    this.servicio.obtenerRosterCurso(this.curso().idCurso).subscribe({
      next: (alumnos) => {
        this.roster.set(alumnos);
        this.cargandoRoster.set(false);
      },
      error: () => {
        this.errorRoster.set('No se pudo cargar la lista de alumnos del curso.');
        this.cargandoRoster.set(false);
      }
    });
  }

  seleccionarAlumno(alumno: RosterAlumno): void {
    this.alumnoSeleccionado.set(alumno);
    this.cargarHistorial(alumno);
  }

  cargarHistorial(alumno: RosterAlumno): void {
    this.cargandoHistorial.set(true);
    this.servicio.historialConductaPorEstudiante(alumno.estudianteIdUsuario).subscribe({
      next: (registros) => {
        this.historial.set(registros);
        this.cargandoHistorial.set(false);
      },
      error: () => {
        this.cargandoHistorial.set(false);
      }
    });
  }

  etiquetaTipo(tipo: string): string {
    return ETIQUETAS_TIPO_CONDUCTA[tipo as keyof typeof ETIQUETAS_TIPO_CONDUCTA] ?? tipo;
  }

  error(campo: string, tipo: string): boolean {
    const c = this.form.get(campo);
    return !!(c?.hasError(tipo) && c.touched);
  }

  abrirCrear(): void {
    this.form.reset({
      tipoConducta: 'positiva',
      descripcionConducta: '',
      fechaConducta: new Date().toISOString().slice(0, 10),
    });
    this.errorGuardar.set(null);
    this.modalCrear.set(true);
  }

  cerrarCrear(): void {
    this.modalCrear.set(false);
  }

  guardar(): void {
    const alumno = this.alumnoSeleccionado();
    if (!alumno || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dto: ConductaRequest = {
      tipoConducta: this.form.value.tipoConducta,
      descripcionConducta: this.form.value.descripcionConducta,
      fechaConducta: aFormatoBackend(this.form.value.fechaConducta),
      docenteIdUsuario: Number(this.servicioToken.obtenerInfoUsuario()?.idUsuario),
      estudianteIdUsuario: alumno.estudianteIdUsuario,
    };

    this.guardando.set(true);
    this.errorGuardar.set(null);
    this.servicio.crearConducta(dto).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarCrear();
        this.cargarHistorial(alumno);
      },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errorGuardar.set(e.error?.message ?? 'No se pudo registrar la anotación.');
      }
    });
  }
}
