import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ServicioAcademico } from '../../../services/academico.service';
import { Asignatura, AsignaturaRequest } from '../../../models/academico.models';

@Component({
  selector: 'app-asignaturas-tab',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './asignaturas-tab.component.html',
  styleUrls: ['../academico-shared.scss']
})
export class AsignaturasTab implements OnInit {
  private servicio = inject(ServicioAcademico);
  private fb       = inject(FormBuilder);

  readonly asignaturas = signal<Asignatura[]>([]);
  readonly busqueda    = signal('');
  readonly cargando    = signal(false);
  readonly errorTabla  = signal<string | null>(null);

  readonly asignaturasFiltradas = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    if (!q) return this.asignaturas();
    return this.asignaturas().filter(a =>
      a.nombreAsignatura.toLowerCase().includes(q)
    );
  });

  readonly guardando          = signal(false);
  readonly errorModal         = signal<string | null>(null);
  readonly modalCrear         = signal(false);
  readonly asignaturaEditando = signal<Asignatura | null>(null);
  readonly asignaturaEliminar = signal<Asignatura | null>(null);

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      nombreAsignatura: ['', [Validators.required, Validators.maxLength(60)]],
    });
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.errorTabla.set(null);
    this.servicio.listarAsignaturas().subscribe({
      next: lista => { this.asignaturas.set(lista); this.cargando.set(false); },
      error: () => {
        this.errorTabla.set('No se pudo cargar la lista de asignaturas.');
        this.cargando.set(false);
      }
    });
  }

  error(campo: string, tipo: string): boolean {
    const c = this.form.get(campo);
    return !!(c?.hasError(tipo) && c.touched);
  }

  abrirCrear(): void {
    this.form.reset();
    this.errorModal.set(null);
    this.modalCrear.set(true);
  }

  cerrarCrear(): void { this.modalCrear.set(false); }

  guardarCrear(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    this.errorModal.set(null);
    const dto: AsignaturaRequest = this.form.value;
    this.servicio.crearAsignatura(dto).subscribe({
      next: () => { this.guardando.set(false); this.cerrarCrear(); this.cargar(); },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errorModal.set(e.error?.message ?? 'Error al crear la asignatura.');
      }
    });
  }

  abrirEditar(a: Asignatura): void {
    this.asignaturaEditando.set(a);
    this.errorModal.set(null);
    this.form.patchValue({ nombreAsignatura: a.nombreAsignatura });
  }

  cerrarEditar(): void { this.asignaturaEditando.set(null); }

  guardarEditar(): void {
    const a = this.asignaturaEditando();
    if (!a || this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    this.errorModal.set(null);
    const dto: AsignaturaRequest = this.form.value;
    this.servicio.actualizarAsignatura(a.id_asignatura, dto).subscribe({
      next: () => { this.guardando.set(false); this.cerrarEditar(); this.cargar(); },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errorModal.set(e.error?.message ?? 'Error al actualizar la asignatura.');
      }
    });
  }

  abrirEliminar(a: Asignatura): void {
    this.asignaturaEliminar.set(a);
    this.errorModal.set(null);
  }

  cerrarEliminar(): void { this.asignaturaEliminar.set(null); }

  confirmarEliminar(): void {
    const a = this.asignaturaEliminar();
    if (!a) return;
    this.guardando.set(true);
    this.servicio.eliminarAsignatura(a.id_asignatura).subscribe({
      next: () => { this.guardando.set(false); this.cerrarEliminar(); this.cargar(); },
      error: () => {
        this.guardando.set(false);
        this.errorModal.set('No se pudo eliminar la asignatura.');
      }
    });
  }
}
