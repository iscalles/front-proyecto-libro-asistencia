import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TomarAsistenciaTab } from './tomar-asistencia-tab.component';
import { ServicioAsistencia } from '../../../services/asistencia.service';
import { CursoAsignatura } from '../../../models/academico.models';
import { RosterAlumno } from '../../../models/asistencia.models';

const cursoMock: CursoAsignatura = {
  idCursoAsignatura: 1,
  docenteIdUsuario: 10,
  nombreDocente: 'Docente Test',
  idCurso: 1,
  gradoCurso: '1°',
  seccionCurso: 'A',
  anioCurso: 2026,
  idAsignatura: 5,
  nombreAsignatura: 'Matemáticas',
};

const rosterMock: RosterAlumno[] = [
  { idMatricula: 1, estudianteIdUsuario: 100, nombreEstudiante: 'Ana López',  rutEstudiante: '11111111-1', idCurso: 1 },
  { idMatricula: 2, estudianteIdUsuario: 101, nombreEstudiante: 'Luis Pérez', rutEstudiante: '22222222-2', idCurso: 1 },
];

describe('TomarAsistenciaTab', () => {
  let fixture: ComponentFixture<TomarAsistenciaTab>;
  let componente: TomarAsistenciaTab;
  let servicioAsistencia: jasmine.SpyObj<ServicioAsistencia>;

  beforeEach(async () => {
    servicioAsistencia = jasmine.createSpyObj('ServicioAsistencia', [
      'obtenerRosterCurso',
      'registrarAsistenciaLote',
    ]);
    servicioAsistencia.obtenerRosterCurso.and.returnValue(of(rosterMock));

    await TestBed.configureTestingModule({
      imports: [TomarAsistenciaTab],
      providers: [
        { provide: ServicioAsistencia, useValue: servicioAsistencia },
      ],
    }).compileComponents();

    fixture    = TestBed.createComponent(TomarAsistenciaTab);
    componente = fixture.componentInstance;

    // setInput() es la forma de pasar input.required() en tests
    fixture.componentRef.setInput('curso', cursoMock);
    fixture.detectChanges(); // ejecuta ngOnInit → cargarRoster()
  });

  // ── Inicialización ─────────────────────────────────────────────────────────

  it('debería crear el componente', () => {
    expect(componente).toBeTruthy();
  });

  it('debería cargar el roster al iniciar', () => {
    expect(servicioAsistencia.obtenerRosterCurso).toHaveBeenCalledWith(1);
    expect(componente.roster().length).toBe(2);
  });

  it('debería crear una fila en el FormArray por cada alumno', () => {
    expect(componente.filas.length).toBe(2);
  });

  it('debería inicializar cada fila con estado "Presente"', () => {
    expect(componente.filas.at(0).value.estadoAsistencia).toBe('Presente');
    expect(componente.filas.at(1).value.estadoAsistencia).toBe('Presente');
  });

  it('debería mostrar error si cargarRoster() falla', () => {
    servicioAsistencia.obtenerRosterCurso.and.returnValue(throwError(() => new Error()));
    componente.cargarRoster();

    expect(componente.errorRoster()).toContain('No se pudo cargar');
    expect(componente.cargando()).toBeFalse();
  });

  // ── Helpers ────────────────────────────────────────────────────────────────

  it('nombreAlumno() debería retornar el nombre del alumno por índice', () => {
    expect(componente.nombreAlumno(0)).toBe('Ana López');
    expect(componente.nombreAlumno(1)).toBe('Luis Pérez');
  });

  it('rutAlumno() debería retornar el RUT del alumno por índice', () => {
    expect(componente.rutAlumno(0)).toBe('11111111-1');
  });

  it('necesitaJustificacion() debería retornar true solo cuando el estado es "Justificado"', () => {
    componente.filas.at(0).patchValue({ estadoAsistencia: 'Justificado' });
    expect(componente.necesitaJustificacion(0)).toBeTrue();

    componente.filas.at(0).patchValue({ estadoAsistencia: 'Ausente' });
    expect(componente.necesitaJustificacion(0)).toBeFalse();
  });

  // ── Modal de confirmación ──────────────────────────────────────────────────

  it('abrirConfirmacion() debería calcular el resumen correctamente', () => {
    componente.filas.at(0).patchValue({ estadoAsistencia: 'Ausente' });
    componente.filas.at(1).patchValue({ estadoAsistencia: 'Presente' });

    componente.abrirConfirmacion();

    expect(componente.modalConfirmacion()).toBeTrue();
    expect(componente.resumenConfirmacion().presentes).toBe(1);
    expect(componente.resumenConfirmacion().ausentes).toBe(1);
    expect(componente.resumenConfirmacion().justificados).toBe(0);
  });

  it('abrirConfirmacion() no debería abrirse si el roster está vacío', () => {
    servicioAsistencia.obtenerRosterCurso.and.returnValue(of([]));
    componente.cargarRoster();
    componente.abrirConfirmacion();

    expect(componente.modalConfirmacion()).toBeFalse();
  });

  it('cerrarConfirmacion() debería ocultar el modal', () => {
    componente.modalConfirmacion.set(true);
    componente.cerrarConfirmacion();
    expect(componente.modalConfirmacion()).toBeFalse();
  });

  // ── confirmarGuardar() ─────────────────────────────────────────────────────

  it('confirmarGuardar() debería enviar el lote con la fecha convertida a dd-MM-yyyy', () => {
    servicioAsistencia.registrarAsistenciaLote.and.returnValue(of([]));
    componente.fecha.set('2026-06-21');

    componente.confirmarGuardar();

    const dto = servicioAsistencia.registrarAsistenciaLote.calls.mostRecent().args[0];
    expect(dto.fechaAsistencia).toBe('21-06-2026');
    expect(dto.idCurso).toBe(1);
  });

  it('confirmarGuardar() debería enviar el estado correcto de cada alumno', () => {
    servicioAsistencia.registrarAsistenciaLote.and.returnValue(of([]));
    componente.filas.at(0).patchValue({ estadoAsistencia: 'Ausente' });
    componente.filas.at(1).patchValue({ estadoAsistencia: 'Justificado', justificacionAsistencia: 'Certificado médico' });

    componente.confirmarGuardar();

    const dto = servicioAsistencia.registrarAsistenciaLote.calls.mostRecent().args[0];
    expect(dto.detalles[0].estadoAsistencia).toBe('Ausente');
    expect(dto.detalles[1].estadoAsistencia).toBe('Justificado');
    expect(dto.detalles[1].justificacionAsistencia).toBe('Certificado médico');
  });

  it('confirmarGuardar() debería marcar exitoGuardar en true tras éxito', () => {
    servicioAsistencia.registrarAsistenciaLote.and.returnValue(of([]));

    componente.confirmarGuardar();

    expect(componente.exitoGuardar()).toBeTrue();
    expect(componente.guardando()).toBeFalse();
    expect(componente.modalConfirmacion()).toBeFalse();
  });

  it('confirmarGuardar() debería mostrar error si el servicio falla', () => {
    servicioAsistencia.registrarAsistenciaLote.and.returnValue(
      throwError(() => ({ error: { message: 'Error del servidor' } }))
    );

    componente.confirmarGuardar();

    expect(componente.errorGuardar()).toBe('Error del servidor');
    expect(componente.guardando()).toBeFalse();
    expect(componente.modalConfirmacion()).toBeFalse();
  });

  // ── Recarga cuando cambia el input ─────────────────────────────────────────

  it('debería recargar el roster cuando cambia el curso', () => {
    const cursoDos = { ...cursoMock, idCurso: 2 };
    fixture.componentRef.setInput('curso', cursoDos);
    fixture.detectChanges();

    // obtenerRosterCurso llamado: 1 vez en ngOnInit + 1 vez en ngOnChanges
    expect(servicioAsistencia.obtenerRosterCurso).toHaveBeenCalledTimes(3);
    expect(servicioAsistencia.obtenerRosterCurso).toHaveBeenCalledWith(2);
  });
});
