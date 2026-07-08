import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ServicioToken } from 'lib-auth';
import { ServicioAcademico } from '../../services/academico.service';
import { ServicioAsistencia } from '../../services/asistencia.service';
import { CursoAsignatura } from '../../models/academico.models';
import { TomarAsistenciaTab } from './tabs/tomar-asistencia-tab.component';
import { ConductaTab } from './tabs/conducta-tab.component';
import { CampanitaNotificaciones } from '../../components/notificaciones/campanita-notificaciones.component';

type Tab = 'asistencia' | 'conducta';
type EstadoModal = 'seleccion' | 'confirmar-existente';

@Component({
  selector: 'app-libro-clases',
  standalone: true,
  imports: [TomarAsistenciaTab, ConductaTab, CampanitaNotificaciones],
  templateUrl: './libro-clases-page.component.html',
  styleUrl: './libro-clases-shared.scss'
})
export class PáginaLibroClases implements OnInit {
  private servicioToken    = inject(ServicioToken);
  private servicioAcademico = inject(ServicioAcademico);
  private servicioAsistencia = inject(ServicioAsistencia);
  private enrutador        = inject(Router);

  readonly usuarioSesion = this.servicioToken.obtenerSeñalInfoUsuario();

  readonly misCursos        = signal<CursoAsignatura[]>([]);
  readonly cargandoCursos   = signal(false);
  readonly errorCursos      = signal<string | null>(null);
  readonly busquedaCurso    = signal('');

  readonly misCursosFiltrados = computed(() => {
    const q = this.busquedaCurso().toLowerCase().trim();
    if (!q) return this.misCursos();
    return this.misCursos().filter(c =>
      c.nombreAsignatura.toLowerCase().includes(q) ||
      c.gradoCurso.toLowerCase().includes(q) ||
      c.seccionCurso.toLowerCase().includes(q)
    );
  });

  readonly cursoSeleccionado = signal<CursoAsignatura | null>(null);
  readonly tabActiva         = signal<Tab>('asistencia');

  // ── Fecha pasada al tab de asistencia ──────────────────────────────────────
  readonly fechaSeleccionada = signal(new Date().toISOString().slice(0, 10));

  // ── Modal de selección de fecha ────────────────────────────────────────────
  readonly hoy = new Date().toISOString().slice(0, 10);

  readonly modalAbierta          = signal(false);
  readonly cursoParaModal        = signal<CursoAsignatura | null>(null);
  readonly estadoModal           = signal<EstadoModal>('seleccion');
  readonly fechaModal            = signal(this.hoy);
  readonly validandoModal        = signal(false);
  readonly errorValidacionModal  = signal<string | null>(null);
  readonly tieneRegistrosModal   = signal(false);

  ngOnInit(): void {
    this.cargarMisCursos();
  }

  cargarMisCursos(): void {
    const idDocente = Number(this.usuarioSesion()?.idUsuario);
    this.cargandoCursos.set(true);
    this.errorCursos.set(null);
    this.servicioAcademico.listarCursoAsignaturas().subscribe({
      next: (registros) => {
        this.misCursos.set(registros.filter(r => r.docenteIdUsuario === idDocente));
        this.cargandoCursos.set(false);
      },
      error: () => {
        this.errorCursos.set('No se pudieron cargar tus cursos asignados.');
        this.cargandoCursos.set(false);
      }
    });
  }

  colorTarjeta(i: number): string {
    return `tarjeta-curso--color-${i % 6}`;
  }

  // ── Abrir modal al hacer clic en un curso ──────────────────────────────────
  seleccionarCurso(curso: CursoAsignatura): void {
    this.cursoParaModal.set(curso);
    this.fechaModal.set(this.hoy);
    this.estadoModal.set('seleccion');
    this.errorValidacionModal.set(null);
    this.validandoModal.set(false);
    this.tieneRegistrosModal.set(false);
    this.modalAbierta.set(true);
  }

  // ── Helpers modal ──────────────────────────────────────────────────────────
  formatearFechaDisplay(fechaIso: string): string {
    const [a, m, d] = fechaIso.split('-');
    return `${d}/${m}/${a}`;
  }

  onFechaModalChange(evento: Event): void {
    this.fechaModal.set((evento.target as HTMLInputElement).value);
    this.errorValidacionModal.set(null);
  }

  usarFechaHoy(): void {
    this.fechaModal.set(this.hoy);
    this.errorValidacionModal.set(null);
  }

  cancelarModal(): void {
    this.modalAbierta.set(false);
    this.cursoParaModal.set(null);
  }

  volverSeleccionFecha(): void {
    this.estadoModal.set('seleccion');
    this.tieneRegistrosModal.set(false);
    this.errorValidacionModal.set(null);
  }

  // Valida la fecha y decide si mostrar el estado 2 (registros existentes) o abrir el formulario
  confirmarFechaModal(): void {
    const fecha  = this.fechaModal();
    const curso  = this.cursoParaModal()!;

    this.validandoModal.set(true);
    this.errorValidacionModal.set(null);

    this.servicioAsistencia.validarFechaAsistencia(fecha).subscribe({
      next: (validacion) => {
        if (!validacion.valida) {
          this.errorValidacionModal.set(validacion.motivo);
          this.validandoModal.set(false);
          return;
        }
        // Fecha válida → verificar si ya hay registros
        this.servicioAsistencia.reporteAsistenciaPorCursoYFecha(curso.idCurso, fecha).subscribe({
          next: (registros) => {
            this.validandoModal.set(false);
            const conDatos = registros.filter(r => r.estadoAsistencia !== 'sin registro');
            if (conDatos.length > 0) {
              this.tieneRegistrosModal.set(true);
              this.estadoModal.set('confirmar-existente');
            } else {
              this.abrirFormulario();
            }
          },
          error: () => {
            this.validandoModal.set(false);
            this.abrirFormulario();
          }
        });
      },
      error: () => {
        // Si la validación falla por red, no bloqueamos
        this.validandoModal.set(false);
        this.abrirFormulario();
      }
    });
  }

  abrirFormulario(): void {
    this.fechaSeleccionada.set(this.fechaModal());
    this.cursoSeleccionado.set(this.cursoParaModal());
    this.modalAbierta.set(false);
    this.tabActiva.set('asistencia');
  }

  // ── Eventos del tab ────────────────────────────────────────────────────────
  onAsistenciaGuardada(): void {
    this.volverASeleccion();
  }

  volverASeleccion(): void {
    this.cursoSeleccionado.set(null);
  }

  irAlDashboard(): void {
    this.enrutador.navigate(['/dashboard']);
  }
}
