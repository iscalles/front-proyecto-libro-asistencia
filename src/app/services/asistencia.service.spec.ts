import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ServicioAsistencia } from './asistencia.service';
import { RosterAlumno, Asistencia, AsistenciaLoteRequest, Conducta, ConductaRequest, ReporteAsistenciaResumen } from '../models/asistencia.models';

const API = 'http://localhost:8080';

describe('ServicioAsistencia', () => {
  let servicio: ServicioAsistencia;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(ServicioAsistencia);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ── Asistencia ─────────────────────────────────────────────────────────────

  it('obtenerRosterCurso() debe GET a /asistencia/curso/:id/roster', () => {
    const roster: RosterAlumno[] = [
      { idMatricula: 1, estudianteIdUsuario: 10, nombreEstudiante: 'Ana', rutEstudiante: '12345678-5', idCurso: 1 },
    ];

    servicio.obtenerRosterCurso(1).subscribe(r => expect(r).toEqual(roster));

    const req = httpMock.expectOne(`${API}/asistencia/curso/1/roster`);
    expect(req.request.method).toBe('GET');
    req.flush(roster);
  });

  it('historialAsistenciaPorMatricula() debe GET a /asistencia/matricula/:id', () => {
    const historial: Asistencia[] = [
      { id_asistencia: 1, fechaAsistencia: '01-06-2026', estadoAsistencia: 'Presente', justificacionAsistencia: null, idMatricula: 1 },
    ];

    servicio.historialAsistenciaPorMatricula(1).subscribe(h => expect(h).toEqual(historial));

    const req = httpMock.expectOne(`${API}/asistencia/matricula/1`);
    expect(req.request.method).toBe('GET');
    req.flush(historial);
  });

  it('registrarAsistenciaLote() debe POST a /asistencia/lote con el body correcto', () => {
    const dto: AsistenciaLoteRequest = {
      idCurso: 1,
      fechaAsistencia: '01-06-2026',
      detalles: [{ idMatricula: 1, estadoAsistencia: 'Presente' }],
    };

    servicio.registrarAsistenciaLote(dto).subscribe();

    const req = httpMock.expectOne(`${API}/asistencia/lote`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush([]);
  });

  // ── Conducta ───────────────────────────────────────────────────────────────

  it('historialConductaPorEstudiante() debe GET a /conducta/estudiante/:id', () => {
    const conductas: Conducta[] = [
      { id_conducta: 1, tipoConducta: 'positiva', descripcionConducta: 'Participó', fechaConducta: '01-06-2026', docenteIdUsuario: 2, estudianteIdUsuario: 10 },
    ];

    servicio.historialConductaPorEstudiante(10).subscribe(c => expect(c).toEqual(conductas));

    const req = httpMock.expectOne(`${API}/conducta/estudiante/10`);
    expect(req.request.method).toBe('GET');
    req.flush(conductas);
  });

  it('crearConducta() debe POST a /conducta con el body correcto', () => {
    const dto: ConductaRequest = {
      tipoConducta: 'negativa',
      descripcionConducta: 'No trajo materiales',
      fechaConducta: '01-06-2026',
      docenteIdUsuario: 2,
      estudianteIdUsuario: 10,
    };

    servicio.crearConducta(dto).subscribe();

    const req = httpMock.expectOne(`${API}/conducta`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush({ id_conducta: 1, ...dto });
  });

  // ── Reportes ───────────────────────────────────────────────────────────────

  it('reporteAsistenciaPorCursoYFecha() debe GET con fecha convertida a dd-MM-yyyy', () => {
    // El servicio recibe formato ISO yyyy-MM-dd y lo convierte para el backend
    servicio.reporteAsistenciaPorCursoYFecha(1, '2026-06-01').subscribe();

    // Verificamos que el query param llega en el formato correcto
    const req = httpMock.expectOne(r => r.url === `${API}/asistencia/curso/1/reporte-dia`);
    expect(req.request.params.get('fecha')).toBe('01-06-2026');
    req.flush([]);
  });

  it('reporteResumenAsistenciaPorCurso() debe GET con fechas desde/hasta convertidas', () => {
    const resumen: ReporteAsistenciaResumen = {
      idCurso: 1, desde: '01-06-2026', hasta: '30-06-2026',
      totalRegistros: 100, totalPresentes: 80, totalAusentes: 15,
      totalJustificados: 5, porcentajeAsistencia: 80,
    };

    servicio.reporteResumenAsistenciaPorCurso(1, '2026-06-01', '2026-06-30').subscribe(r => expect(r).toEqual(resumen));

    const req = httpMock.expectOne(r => r.url === `${API}/asistencia/curso/1/reporte-resumen`);
    expect(req.request.params.get('desde')).toBe('01-06-2026');
    expect(req.request.params.get('hasta')).toBe('30-06-2026');
    req.flush(resumen);
  });
});
