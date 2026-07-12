import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ServicioToken } from 'lib-auth';
import { ServicioAsistencia } from '../../services/asistencia.service';
import { ServicioAcademico } from '../../services/academico.service';
import { CampanitaNotificaciones } from '../../components/notificaciones/campanita-notificaciones.component';
import { CampanitaMensajes } from '../../components/mensajes/campanita-mensajes.component';
import { FechaExcluida, PeriodoEscolar } from '../../models/asistencia.models';
import { CursoAsignatura, HorarioClase, DIAS_SEMANA } from '../../models/academico.models';

type Tab = 'periodos' | 'feriados' | 'horarios';

@Component({
  selector: 'app-configuracion-escolar',
  standalone: true,
  imports: [ReactiveFormsModule, CampanitaNotificaciones, CampanitaMensajes],
  templateUrl: './configuracion-escolar-page.component.html',
  styleUrl: './configuracion-escolar-page.component.scss'
})
export class PáginaConfiguracionEscolar implements OnInit {
  private servicio         = inject(ServicioAsistencia);
  private servicioAcademico = inject(ServicioAcademico);
  private servicioToken    = inject(ServicioToken);
  private fb               = inject(FormBuilder);
  private enrutador        = inject(Router);

  readonly usuarioSesion = this.servicioToken.obtenerSeñalInfoUsuario();

  readonly tabActiva = signal<Tab>('periodos');

  // ── Períodos escolares ─────────────────────────────────────────────────────
  readonly periodos         = signal<PeriodoEscolar[]>([]);
  readonly cargandoPeriodos = signal(false);
  readonly errorPeriodos    = signal<string | null>(null);

  // ── Feriados / días excluidos ──────────────────────────────────────────────
  readonly feriados         = signal<FechaExcluida[]>([]);
  readonly cargandoFeriados = signal(false);
  readonly errorFeriados    = signal<string | null>(null);

  // ── Formularios de alta ────────────────────────────────────────────────────
  formPeriodo!: FormGroup;
  formFeriado!: FormGroup;

  readonly guardando    = signal(false);
  readonly errorGuardar = signal<string | null>(null);
  readonly exitoGuardar = signal(false);

  // ── Modal de confirmación de eliminación (períodos y feriados) ────────────
  readonly itemEliminar  = signal<{ tipo: 'periodo' | 'feriado'; id: number; nombre: string } | null>(null);
  readonly eliminando    = signal(false);
  readonly errorEliminar = signal<string | null>(null);

  // ── Horarios de clases ─────────────────────────────────────────────────────
  readonly DIAS_SEMANA = DIAS_SEMANA;

  readonly cursoAsignaturas       = signal<CursoAsignatura[]>([]);
  readonly cargandoCursoAs        = signal(false);
  readonly errorCursoAs           = signal<string | null>(null);
  readonly cursoAsignaturaActivo  = signal<CursoAsignatura | null>(null);
  readonly busquedaHorario        = signal('');

  readonly cursoAsignaturasFiltradas = computed(() => {
    const q = this.busquedaHorario().toLowerCase().trim();
    const lista = q
      ? this.cursoAsignaturas().filter(ca =>
          ca.gradoCurso.toLowerCase().includes(q) ||
          ca.seccionCurso.toLowerCase().includes(q) ||
          ca.nombreAsignatura.toLowerCase().includes(q) ||
          (ca.gradoCurso + ' ' + ca.seccionCurso).toLowerCase().includes(q)
        )
      : this.cursoAsignaturas();

    return [...lista].sort((a, b) => {
      const keyA = `${a.gradoCurso} ${a.seccionCurso} ${a.nombreAsignatura}`.toLowerCase();
      const keyB = `${b.gradoCurso} ${b.seccionCurso} ${b.nombreAsignatura}`.toLowerCase();
      return keyA.localeCompare(keyB, 'es');
    });
  });

  readonly horarios               = signal<HorarioClase[]>([]);
  readonly cargandoHorarios       = signal(false);
  readonly errorHorarios          = signal<string | null>(null);
  readonly togglando              = signal<string | null>(null); // diaSemana en proceso

  ngOnInit(): void {
    this.cargarCursoAsignaturas();
    this.formPeriodo = this.fb.group({
      nombre:      ['', [Validators.required, Validators.maxLength(100)]],
      fechaInicio: ['', Validators.required],
      fechaFin:    ['', Validators.required],
    });
    this.formFeriado = this.fb.group({
      fecha:       ['', Validators.required],
      descripcion: ['', [Validators.required, Validators.maxLength(200)]],
    });
    this.cargarPeriodos();
    this.cargarFeriados();
  }

  // ── Carga ──────────────────────────────────────────────────────────────────

  cargarPeriodos(): void {
    this.cargandoPeriodos.set(true);
    this.errorPeriodos.set(null);
    this.servicio.listarPeriodosEscolares().subscribe({
      next: lista => { this.periodos.set(lista); this.cargandoPeriodos.set(false); },
      error: () => {
        this.errorPeriodos.set('No se pudieron cargar los períodos. Verifica que ms-asistencia esté activo.');
        this.cargandoPeriodos.set(false);
      }
    });
  }

  cargarFeriados(): void {
    this.cargandoFeriados.set(true);
    this.errorFeriados.set(null);
    this.servicio.listarFechasExcluidas().subscribe({
      next: lista => { this.feriados.set(lista); this.cargandoFeriados.set(false); },
      error: () => {
        this.errorFeriados.set('No se pudieron cargar los feriados. Verifica que ms-asistencia esté activo.');
        this.cargandoFeriados.set(false);
      }
    });
  }

  // ── Alta de período ────────────────────────────────────────────────────────

  guardarPeriodo(): void {
    if (this.formPeriodo.invalid) { this.formPeriodo.markAllAsTouched(); return; }
    const v = this.formPeriodo.value as { nombre: string; fechaInicio: string; fechaFin: string };
    if (v.fechaFin < v.fechaInicio) {
      this.errorGuardar.set('La fecha de término debe ser igual o posterior al inicio.');
      return;
    }
    this.guardando.set(true);
    this.errorGuardar.set(null);
    this.exitoGuardar.set(false);
    this.servicio.agregarPeriodoEscolar(v).subscribe({
      next: () => {
        this.guardando.set(false);
        this.exitoGuardar.set(true);
        this.formPeriodo.reset();
        this.cargarPeriodos();
        setTimeout(() => this.exitoGuardar.set(false), 3000);
      },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errorGuardar.set(this.mensajeError(e, 'No se pudo guardar el período escolar.'));
      }
    });
  }

  // ── Alta de feriado ────────────────────────────────────────────────────────

  guardarFeriado(): void {
    if (this.formFeriado.invalid) { this.formFeriado.markAllAsTouched(); return; }
    this.guardando.set(true);
    this.errorGuardar.set(null);
    this.exitoGuardar.set(false);
    this.servicio.agregarFechaExcluida(this.formFeriado.value as Omit<FechaExcluida, 'id'>).subscribe({
      next: () => {
        this.guardando.set(false);
        this.exitoGuardar.set(true);
        this.formFeriado.reset();
        this.cargarFeriados();
        setTimeout(() => this.exitoGuardar.set(false), 3000);
      },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errorGuardar.set(this.mensajeError(e, 'No se pudo guardar el feriado.'));
      }
    });
  }

  // ── Eliminación ────────────────────────────────────────────────────────────

  abrirEliminar(tipo: 'periodo' | 'feriado', id: number, nombre: string): void {
    this.itemEliminar.set({ tipo, id, nombre });
    this.errorEliminar.set(null);
  }

  cerrarEliminar(): void { this.itemEliminar.set(null); }

  confirmarEliminar(): void {
    const item = this.itemEliminar();
    if (!item) return;
    this.eliminando.set(true);
    this.errorEliminar.set(null);
    const obs = item.tipo === 'periodo'
      ? this.servicio.eliminarPeriodoEscolar(item.id)
      : this.servicio.eliminarFechaExcluida(item.id);
    obs.subscribe({
      next: () => {
        this.eliminando.set(false);
        this.cerrarEliminar();
        if (item.tipo === 'periodo') this.cargarPeriodos();
        else this.cargarFeriados();
      },
      error: (e: HttpErrorResponse) => {
        this.eliminando.set(false);
        this.errorEliminar.set(this.mensajeError(e, 'No se pudo eliminar el registro.'));
      }
    });
  }

  // ── Horarios ───────────────────────────────────────────────────────────────

  cargarCursoAsignaturas(): void {
    this.cargandoCursoAs.set(true);
    this.errorCursoAs.set(null);
    this.servicioAcademico.listarCursoAsignaturas().subscribe({
      next: lista => { this.cursoAsignaturas.set(lista); this.cargandoCursoAs.set(false); },
      error: () => {
        this.errorCursoAs.set('No se pudo cargar la lista de cursos-asignaturas.');
        this.cargandoCursoAs.set(false);
      }
    });
  }

  seleccionarCursoAsignatura(ca: CursoAsignatura): void {
    this.cursoAsignaturaActivo.set(ca);
    this.cargarHorarios(ca.idCursoAsignatura);
  }

  cargarHorarios(idCursoAsignatura: number): void {
    this.cargandoHorarios.set(true);
    this.errorHorarios.set(null);
    this.servicioAcademico.listarHorarioCursoAsignatura(idCursoAsignatura).subscribe({
      next: lista => { this.horarios.set(lista); this.cargandoHorarios.set(false); },
      error: () => {
        this.errorHorarios.set('No se pudo cargar el horario.');
        this.cargandoHorarios.set(false);
      }
    });
  }

  tieneDia(diaSemana: string): boolean {
    return this.horarios().some(h => h.diaSemana === diaSemana);
  }

  horarioIdParaDia(diaSemana: string): number | undefined {
    return this.horarios().find(h => h.diaSemana === diaSemana)?.id;
  }

  toggleDia(diaSemana: string): void {
    const ca = this.cursoAsignaturaActivo();
    if (!ca || this.togglando() === diaSemana) return;

    this.togglando.set(diaSemana);

    if (this.tieneDia(diaSemana)) {
      const id = this.horarioIdParaDia(diaSemana)!;
      this.servicioAcademico.eliminarHorarioClase(id).subscribe({
        next: () => { this.togglando.set(null); this.cargarHorarios(ca.idCursoAsignatura); },
        error: () => { this.togglando.set(null); }
      });
    } else {
      this.servicioAcademico.agregarHorarioClase({ idCursoAsignatura: ca.idCursoAsignatura, diaSemana }).subscribe({
        next: () => { this.togglando.set(null); this.cargarHorarios(ca.idCursoAsignatura); },
        error: () => { this.togglando.set(null); }
      });
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  errorCampo(form: FormGroup, campo: string, tipo: string): boolean {
    const c = form.get(campo);
    return !!(c?.hasError(tipo) && c.touched);
  }

  // El backend devuelve fechas como dd-MM-yyyy; sólo reemplazamos el separador.
  formatearFecha(fecha: string): string {
    if (!fecha) return '—';
    return fecha.replace(/-/g, '/');
  }

  private mensajeError(e: HttpErrorResponse, fallback: string): string {
    if (e.status === 0) return 'No se pudo conectar con el servidor. Verifica que los servicios estén activos.';
    if (e.status === 409) return 'Ya existe un registro con esa fecha. Por favor elige otra.';
    if (e.status === 400) return 'Los datos ingresados no son válidos. Revisa los campos e intenta de nuevo.';
    if (e.status >= 500) return 'Ocurrió un error en el servidor. Por favor intenta más tarde.';
    const msg = e.error?.message as string | undefined;
    if (msg && !msg.includes('Exception') && !msg.includes('java.') && msg.length < 120) return msg;
    return fallback;
  }

  irAlDashboard(): void { this.enrutador.navigate(['/dashboard']); }
}
