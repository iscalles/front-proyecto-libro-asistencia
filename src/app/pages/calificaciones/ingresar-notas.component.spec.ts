import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { IngresarNotas } from './ingresar-notas.component';
import { ServicioAcademico } from '../../services/academico.service';
import { ServicioToken, AUTH_API_URL } from 'lib-auth';
import { Evaluacion, Matricula, Calificacion } from '../../models/academico.models';
import { InfoUsuario } from '../../../../projects/lib-auth/src/lib/types/auth.types';

const evaluacionMock: Evaluacion = {
  idEvaluacion: 10,
  nombreEvaluacion: 'Prueba 1',
  fechaEvaluacion: '01-06-2026',
  idCursoAsignatura: 1,
  idAsignatura: 5,
  nombreAsignatura: 'Matemáticas',
  idCurso: 1,
  gradoCurso: '1°',
  seccionCurso: 'A',
};

const matriculasMock: Matricula[] = [
  { idMatricula: 1, anioAcademicoMatricula: 2026, estudianteIdUsuario: 100, nombreEstudiante: 'Ana López',  rutEstudiante: '11111111-1', idCurso: 1, gradoCurso: '1°', seccionCurso: 'A', anioCurso: 2026 },
  { idMatricula: 2, anioAcademicoMatricula: 2026, estudianteIdUsuario: 101, nombreEstudiante: 'Luis Pérez', rutEstudiante: '22222222-2', idCurso: 1, gradoCurso: '1°', seccionCurso: 'A', anioCurso: 2026 },
];

const calificacionesMock: Calificacion[] = [
  {
    idCalificacion: 1, notaCalificacion: 6.5, idMatricula: 1,
    estudianteIdUsuario: 100, idEvaluacion: 10, nombreEvaluacion: 'Prueba 1',
    nombreAsignatura: 'Matemáticas', nombreDocente: 'Docente', fechaEvaluacion: '01-06-2026',
    fechaRegistro: '01-06-2026', creadoPorIdUsuario: 99,
    ultimaModificacion: '01-06-2026', modificadoPorIdUsuario: 99,
  },
];

const docenteMock: InfoUsuario = {
  idUsuario: '99', nombre: 'Docente Test', correo: 'docente@test.com',
  rutUsuario: '12345678-5', roles: ['DOCENTE'],
};

describe('IngresarNotas', () => {
  let fixture: ComponentFixture<IngresarNotas>;
  let componente: IngresarNotas;
  let servicioAcademico: jasmine.SpyObj<ServicioAcademico>;
  let servicioToken: ServicioToken;

  beforeEach(async () => {
    servicioAcademico = jasmine.createSpyObj('ServicioAcademico', [
      'listarMatriculasPorCurso',
      'listarCalificacionesPorEvaluacion',
      'registrarCalificacionesLote',
    ]);
    // Por defecto: roster cargado, sin notas previas
    servicioAcademico.listarMatriculasPorCurso.and.returnValue(of(matriculasMock));
    servicioAcademico.listarCalificacionesPorEvaluacion.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [IngresarNotas],
      providers: [
        { provide: ServicioAcademico, useValue: servicioAcademico },
        { provide: AUTH_API_URL, useValue: 'http://localhost:8080' },
      ],
    }).compileComponents();

    fixture       = TestBed.createComponent(IngresarNotas);
    componente    = fixture.componentInstance;
    servicioToken = TestBed.inject(ServicioToken);
    servicioToken.guardarInfoUsuario(docenteMock);

    fixture.componentRef.setInput('evaluacion', evaluacionMock);
    fixture.detectChanges(); // ngOnChanges → cargarRosterYNotas()
  });

  afterEach(() => localStorage.clear());

  // ── Inicialización ─────────────────────────────────────────────────────────

  it('debería crear el componente', () => {
    expect(componente).toBeTruthy();
  });

  it('debería cargar el roster al iniciar', () => {
    expect(servicioAcademico.listarMatriculasPorCurso).toHaveBeenCalledWith(1);
    expect(componente.roster().length).toBe(2);
  });

  it('debería crear una fila en el FormArray por cada alumno', () => {
    expect(componente.filas.length).toBe(2);
  });

  it('debería inicializar las notas en null cuando no hay calificaciones previas', () => {
    expect(componente.filas.at(0).value.notaCalificacion).toBeNull();
    expect(componente.filas.at(1).value.notaCalificacion).toBeNull();
  });

  // ── Notas existentes ───────────────────────────────────────────────────────

  it('debería pre-cargar las notas existentes en el formulario', () => {
    // Reconfiguramos el spy para devolver una nota existente para el alumno 1
    servicioAcademico.listarCalificacionesPorEvaluacion.and.returnValue(of(calificacionesMock));
    componente.cargarRosterYNotas();

    // La fila 0 (idMatricula: 1) debería tener la nota 6.5
    expect(componente.filas.at(0).value.notaCalificacion).toBe(6.5);
    // La fila 1 (idMatricula: 2) no tiene nota → null
    expect(componente.filas.at(1).value.notaCalificacion).toBeNull();
  });

  it('debería mostrar error si falla la carga de notas existentes', () => {
    servicioAcademico.listarCalificacionesPorEvaluacion.and.returnValue(throwError(() => new Error()));
    componente.cargarRosterYNotas();

    expect(componente.errorRoster()).toContain('No se pudieron cargar las notas');
    expect(componente.cargando()).toBeFalse();
  });

  it('debería mostrar error si falla la carga del roster', () => {
    servicioAcademico.listarMatriculasPorCurso.and.returnValue(throwError(() => new Error()));
    componente.cargarRosterYNotas();

    expect(componente.errorRoster()).toContain('No se pudo cargar la lista');
    expect(componente.cargando()).toBeFalse();
  });

  // ── Helpers ────────────────────────────────────────────────────────────────

  it('nombreAlumno() debería retornar el nombre por índice', () => {
    expect(componente.nombreAlumno(0)).toBe('Ana López');
    expect(componente.nombreAlumno(1)).toBe('Luis Pérez');
  });

  it('rutAlumno() debería retornar el RUT por índice', () => {
    expect(componente.rutAlumno(0)).toBe('11111111-1');
  });

  it('notaInvalida() debería retornar true si la nota está fuera del rango 1-7', () => {
    const fila = componente.filas.at(0);
    fila.patchValue({ notaCalificacion: 8 });
    fila.markAsTouched();

    expect(componente.notaInvalida(0)).toBeTrue();
  });

  it('notaInvalida() debería retornar false si la nota es válida', () => {
    const fila = componente.filas.at(0);
    fila.patchValue({ notaCalificacion: 5.5 });
    fila.markAsTouched();

    expect(componente.notaInvalida(0)).toBeFalse();
  });

  // ── Modal de confirmación ──────────────────────────────────────────────────

  it('abrirConfirmacion() no debería abrirse si hay notas inválidas', () => {
    // Nota fuera de rango
    componente.filas.at(0).patchValue({ notaCalificacion: 9 });
    componente.filas.at(1).patchValue({ notaCalificacion: 5 });

    componente.abrirConfirmacion();

    expect(componente.modalConfirmacion()).toBeFalse();
  });

  it('abrirConfirmacion() debería abrirse si todas las notas son válidas', () => {
    componente.filas.at(0).patchValue({ notaCalificacion: 6 });
    componente.filas.at(1).patchValue({ notaCalificacion: 5 });

    componente.abrirConfirmacion();

    expect(componente.modalConfirmacion()).toBeTrue();
  });

  it('cerrarConfirmacion() debería ocultar el modal', () => {
    componente.modalConfirmacion.set(true);
    componente.cerrarConfirmacion();
    expect(componente.modalConfirmacion()).toBeFalse();
  });

  // ── confirmarGuardar() ─────────────────────────────────────────────────────

  it('confirmarGuardar() debería enviar el lote con los datos correctos', () => {
    servicioAcademico.registrarCalificacionesLote.and.returnValue(of([]));
    componente.filas.at(0).patchValue({ notaCalificacion: 6.5 });
    componente.filas.at(1).patchValue({ notaCalificacion: 4.0 });

    componente.confirmarGuardar();

    const dto = servicioAcademico.registrarCalificacionesLote.calls.mostRecent().args[0];
    expect(dto.idEvaluacion).toBe(10);
    expect(dto.creadoPorIdUsuario).toBe(99);
    expect(dto.detalles[0]).toEqual({ idMatricula: 1, notaCalificacion: 6.5 });
    expect(dto.detalles[1]).toEqual({ idMatricula: 2, notaCalificacion: 4 });
  });

  it('confirmarGuardar() debería marcar exitoGuardar en true tras éxito', () => {
    servicioAcademico.registrarCalificacionesLote.and.returnValue(of([]));
    componente.filas.at(0).patchValue({ notaCalificacion: 5 });
    componente.filas.at(1).patchValue({ notaCalificacion: 6 });

    componente.confirmarGuardar();

    expect(componente.exitoGuardar()).toBeTrue();
    expect(componente.guardando()).toBeFalse();
    expect(componente.modalConfirmacion()).toBeFalse();
  });

  it('confirmarGuardar() debería mostrar error si el servicio falla', () => {
    servicioAcademico.registrarCalificacionesLote.and.returnValue(
      throwError(() => ({ error: { message: 'Error al registrar' } }))
    );
    componente.filas.at(0).patchValue({ notaCalificacion: 5 });
    componente.filas.at(1).patchValue({ notaCalificacion: 6 });

    componente.confirmarGuardar();

    expect(componente.errorGuardar()).toBe('Error al registrar');
    expect(componente.guardando()).toBeFalse();
  });

  // ── Recarga cuando cambia la evaluación ───────────────────────────────────

  it('debería recargar cuando cambia la evaluación', () => {
    const otraEvaluacion: Evaluacion = { ...evaluacionMock, idEvaluacion: 20, idCurso: 2 };
    fixture.componentRef.setInput('evaluacion', otraEvaluacion);
    fixture.detectChanges();

    expect(servicioAcademico.listarMatriculasPorCurso).toHaveBeenCalledWith(2);
  });
});
