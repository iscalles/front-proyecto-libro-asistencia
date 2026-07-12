import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of, Observable } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { ServicioToken } from 'lib-auth';
import { CampanitaNotificaciones } from '../../components/notificaciones/campanita-notificaciones.component';
import { ServicioMensajeria } from '../../services/mensajeria.service';
import { ServicioRelaciones } from '../../services/relaciones.service';
import { ServicioAcademico } from '../../services/academico.service';
import { Mensaje, ContactoMensajeria } from '../../models/mensajeria.models';
import { EstudianteResponse, UsuarioAnidado, RelacionApEst } from '../../models/relaciones.models';

// Cada cuántos ms se refresca la bandeja y la conversación abierta, simulando un chat
// en vivo sin necesidad de WebSockets (mismo enfoque de polling que la campanita de
// notificaciones, pero más agresivo para que se sienta casi instantáneo).
const INTERVALO_POLLING_MS = 3000;

@Component({
  selector: 'app-mensajes',
  standalone: true,
  imports: [FormsModule, CampanitaNotificaciones],
  templateUrl: './mensajes-page.component.html',
  styleUrl: './mensajes-page.component.scss'
})
export class PáginaMensajes implements OnInit, OnDestroy {
  private servicioToken = inject(ServicioToken);
  private servicioMensajeria = inject(ServicioMensajeria);
  private servicioRelaciones = inject(ServicioRelaciones);
  private servicioAcademico = inject(ServicioAcademico);
  private enrutador = inject(Router);

  readonly usuarioSesion = this.servicioToken.obtenerSeñalInfoUsuario();

  private miIdUsuario = 0;

  readonly cargandoContactos = signal(false);
  readonly errorContactos = signal<string | null>(null);
  readonly contactos = signal<ContactoMensajeria[]>([]);

  readonly contactoSeleccionado = signal<ContactoMensajeria | null>(null);
  readonly mensajes = signal<Mensaje[]>([]);
  readonly cargandoMensajes = signal(false);
  readonly errorMensajes = signal<string | null>(null);
  readonly enviando = signal(false);
  readonly textoNuevoMensaje = signal('');

  private readonly bandejaEntrada = signal<Mensaje[]>([]);

  readonly noLeidosPorContacto = computed(() => {
    const conteo = new Map<number, number>();
    for (const m of this.bandejaEntrada()) {
      if (m.estadoMensaje === 'NO_LEIDO') {
        conteo.set(m.idUsuarioEmisor, (conteo.get(m.idUsuarioEmisor) ?? 0) + 1);
      }
    }
    return conteo;
  });

  private timerPolling: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.cargarContactos();
  }

  ngOnDestroy(): void {
    this.detenerPolling();
  }

  irAlDashboard(): void {
    this.enrutador.navigate(['/dashboard']);
  }

  // ── Contactos ─────────────────────────────────────────────────────────────────

  private cargarContactos(): void {
    const usuario = this.servicioToken.obtenerInfoUsuario();
    if (!usuario) return;
    this.miIdUsuario = Number(usuario.idUsuario);

    const roles = usuario.roles ?? [];
    const fuentes: Observable<ContactoMensajeria[]>[] = [];
    if (roles.includes('DOCENTE')) fuentes.push(this.resolverContactosDocente(this.miIdUsuario));
    if (roles.includes('APODERADO')) fuentes.push(this.resolverContactosApoderado(this.miIdUsuario));
    if (roles.includes('ESTUDIANTE')) fuentes.push(this.resolverContactosEstudiante(this.miIdUsuario));

    if (fuentes.length === 0) {
      this.contactos.set([]);
      return;
    }

    this.cargandoContactos.set(true);
    this.errorContactos.set(null);
    forkJoin(fuentes).subscribe({
      next: (listas) => {
        const combinados = new Map<number, ContactoMensajeria>();
        for (const lista of listas) {
          for (const c of lista) combinados.set(c.idUsuario, c);
        }
        this.contactos.set(Array.from(combinados.values()));
        this.cargandoContactos.set(false);
        this.cargarBandejaEntrada();
        this.iniciarPolling();
      },
      error: () => {
        this.errorContactos.set('No se pudo cargar la lista de contactos.');
        this.cargandoContactos.set(false);
      }
    });
  }

  // Docente → cursos que dicta → alumnos matriculados (contactos directos)
  // y también los apoderados de esos alumnos.
  private resolverContactosDocente(miId: number): Observable<ContactoMensajeria[]> {
    return forkJoin({
      cursosAsignatura: this.servicioAcademico.listarCursoAsignaturas(),
      matriculas: this.servicioAcademico.listarMatriculas(),
      estudiantes: this.servicioRelaciones.obtenerEstudiantes(),
      apoderados: this.servicioRelaciones.obtenerApoderados(),
    }).pipe(
      switchMap(({ cursosAsignatura, matriculas, estudiantes, apoderados }) => {
        const misCursosIds = new Set(
          cursosAsignatura.filter(c => c.docenteIdUsuario === miId).map(c => c.idCurso)
        );
        const idsUsuarioEstudiantes = new Set(
          matriculas.filter(m => misCursosIds.has(m.idCurso)).map(m => m.estudianteIdUsuario)
        );
        const misEstudiantes = estudiantes.filter(e => idsUsuarioEstudiantes.has(e.usuario.idUsuario));

        const contactosPorUsuario = new Map<number, ContactoMensajeria>();
        for (const est of misEstudiantes) {
          this.agregarOAmpliarContacto(
            contactosPorUsuario,
            est.usuario.idUsuario,
            this.nombreCompleto(est.usuario),
            'Alumno/a'
          );
        }

        if (misEstudiantes.length === 0) return of(Array.from(contactosPorUsuario.values()));

        return forkJoin(
          misEstudiantes.map(est =>
            this.servicioRelaciones.obtenerApoderadosDeEstudiante(est.idEstudiante).pipe(
              map(relaciones => ({ estudiante: est, relaciones })),
              catchError(() => of({ estudiante: est, relaciones: [] as RelacionApEst[] }))
            )
          )
        ).pipe(
          map(resultados => {
            const apoderadoPorId = new Map(apoderados.map(a => [a.idApoderado, a]));

            for (const { estudiante, relaciones } of resultados) {
              const nombreEstudiante = this.nombreCompleto(estudiante.usuario);
              for (const rel of relaciones) {
                const apoderado = apoderadoPorId.get(rel.id.idApoderado);
                if (!apoderado) continue;
                this.agregarOAmpliarContacto(
                  contactosPorUsuario,
                  apoderado.usuario.idUsuario,
                  this.nombreCompleto(apoderado.usuario),
                  `${rel.parentescoApoderadoEstudiante} de ${nombreEstudiante}`
                );
              }
            }
            return Array.from(contactosPorUsuario.values());
          })
        );
      })
    );
  }

  // Apoderado → sus hijos → cursos de esos hijos → docentes de esos cursos
  private resolverContactosApoderado(miId: number): Observable<ContactoMensajeria[]> {
    return forkJoin({
      apoderados: this.servicioRelaciones.obtenerApoderados(),
      estudiantes: this.servicioRelaciones.obtenerEstudiantes(),
      matriculas: this.servicioAcademico.listarMatriculas(),
      cursosAsignatura: this.servicioAcademico.listarCursoAsignaturas(),
    }).pipe(
      switchMap(({ apoderados, estudiantes, matriculas, cursosAsignatura }) => {
        const yo = apoderados.find(a => a.usuario.idUsuario === miId);
        if (!yo) return of([] as ContactoMensajeria[]);

        return this.servicioRelaciones.obtenerEstudiantesDeApoderado(yo.idApoderado).pipe(
          map(relaciones => {
            const estudianteMap = new Map(estudiantes.map(e => [e.idEstudiante, e]));
            const misHijos = relaciones
              .map(r => estudianteMap.get(r.id.idEstudiante))
              .filter((e): e is EstudianteResponse => !!e);

            const contactosPorUsuario = new Map<number, ContactoMensajeria>();

            for (const hijo of misHijos) {
              const nombreHijo = this.nombreCompleto(hijo.usuario);
              const idsCurso = new Set(
                matriculas
                  .filter(m => m.estudianteIdUsuario === hijo.usuario.idUsuario)
                  .map(m => m.idCurso)
              );
              const docentesDelHijo = cursosAsignatura.filter(ca => idsCurso.has(ca.idCurso));

              for (const ca of docentesDelHijo) {
                this.agregarOAmpliarContacto(
                  contactosPorUsuario,
                  ca.docenteIdUsuario,
                  ca.nombreDocente,
                  `Profesor(a) de ${ca.nombreAsignatura} de ${nombreHijo}`
                );
              }
            }
            return Array.from(contactosPorUsuario.values());
          })
        );
      })
    );
  }

  // Estudiante → cursos en los que está matriculado → docentes de esos cursos
  private resolverContactosEstudiante(miId: number): Observable<ContactoMensajeria[]> {
    return forkJoin({
      matriculas: this.servicioAcademico.listarMatriculas(),
      cursosAsignatura: this.servicioAcademico.listarCursoAsignaturas(),
    }).pipe(
      map(({ matriculas, cursosAsignatura }) => {
        const idsCurso = new Set(
          matriculas.filter(m => m.estudianteIdUsuario === miId).map(m => m.idCurso)
        );
        const misDocentes = cursosAsignatura.filter(ca => idsCurso.has(ca.idCurso));

        const contactosPorUsuario = new Map<number, ContactoMensajeria>();
        for (const ca of misDocentes) {
          this.agregarOAmpliarContacto(
            contactosPorUsuario,
            ca.docenteIdUsuario,
            ca.nombreDocente,
            `Profesor(a) de ${ca.nombreAsignatura}`
          );
        }
        return Array.from(contactosPorUsuario.values());
      })
    );
  }

  private agregarOAmpliarContacto(
    mapa: Map<number, ContactoMensajeria>,
    idUsuario: number,
    nombre: string,
    detalleNuevo: string
  ): void {
    const existente = mapa.get(idUsuario);
    if (existente) {
      if (!existente.detalle.includes(detalleNuevo)) {
        existente.detalle += `, ${detalleNuevo}`;
      }
    } else {
      mapa.set(idUsuario, { idUsuario, nombre, detalle: detalleNuevo });
    }
  }

  private nombreCompleto(u: UsuarioAnidado): string {
    return [u.nombreUsuario, u.primerApellidoUsuario, u.segundoApellidoUsuario]
      .filter(Boolean)
      .join(' ');
  }

  // ── Bandeja de entrada (para el contador de no leídos por contacto) ────────────

  private cargarBandejaEntrada(): void {
    this.servicioMensajeria.listarBandejaEntrada(this.miIdUsuario).subscribe({
      next: lista => this.bandejaEntrada.set(lista),
      error: () => {}
    });
  }

  // ── Conversación ────────────────────────────────────────────────────────────────

  seleccionarContacto(contacto: ContactoMensajeria): void {
    this.contactoSeleccionado.set(contacto);
    this.cargarConversacion(contacto, true);
  }

  volverALista(): void {
    this.contactoSeleccionado.set(null);
    this.mensajes.set([]);
  }

  private cargarConversacion(contacto: ContactoMensajeria, mostrarCargando: boolean): void {
    if (mostrarCargando) {
      this.cargandoMensajes.set(true);
      this.errorMensajes.set(null);
    }
    this.servicioMensajeria.listarConversacion(this.miIdUsuario, contacto.idUsuario).subscribe({
      next: lista => {
        this.mensajes.set(lista);
        this.cargandoMensajes.set(false);
        this.marcarNoLeidosComoLeidos(lista);
      },
      error: () => {
        if (mostrarCargando) {
          this.errorMensajes.set('No se pudo cargar la conversación.');
          this.cargandoMensajes.set(false);
        }
      }
    });
  }

  private marcarNoLeidosComoLeidos(lista: Mensaje[]): void {
    const pendientes = lista.filter(
      m => m.idUsuarioReceptor === this.miIdUsuario && m.estadoMensaje === 'NO_LEIDO'
    );
    pendientes.forEach(m => {
      this.servicioMensajeria.marcarLeido(m.idMensaje).subscribe({
        next: actualizado => {
          this.mensajes.update(lst => lst.map(x => x.idMensaje === actualizado.idMensaje ? actualizado : x));
          this.bandejaEntrada.update(lst => lst.map(x => x.idMensaje === actualizado.idMensaje ? actualizado : x));
        },
        error: () => {}
      });
    });
  }

  enviarMensaje(): void {
    const texto = this.textoNuevoMensaje().trim();
    const contacto = this.contactoSeleccionado();
    if (!texto || !contacto || this.enviando()) return;

    this.enviando.set(true);
    this.errorMensajes.set(null);
    this.servicioMensajeria.enviarMensaje({ cuerpoMensaje: texto, idUsuarioReceptor: contacto.idUsuario }).subscribe({
      next: (nuevo) => {
        this.mensajes.update(lst => [...lst, nuevo]);
        this.textoNuevoMensaje.set('');
        this.enviando.set(false);
      },
      error: () => {
        this.errorMensajes.set('No se pudo enviar el mensaje.');
        this.enviando.set(false);
      }
    });
  }

  esMio(m: Mensaje): boolean {
    return m.idUsuarioEmisor === this.miIdUsuario;
  }

  // Un único timer para toda la vida de la página: refresca la bandeja de entrada
  // siempre (para los contadores de no leídos) y, si hay una conversación abierta,
  // también la refresca — así los mensajes entrantes aparecen sin recargar la página.
  private iniciarPolling(): void {
    this.detenerPolling();
    this.timerPolling = setInterval(() => {
      this.cargarBandejaEntrada();
      const contacto = this.contactoSeleccionado();
      if (contacto) {
        this.cargarConversacion(contacto, false);
      }
    }, INTERVALO_POLLING_MS);
  }

  private detenerPolling(): void {
    if (this.timerPolling) {
      clearInterval(this.timerPolling);
      this.timerPolling = null;
    }
  }
}
