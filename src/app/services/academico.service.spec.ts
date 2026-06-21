import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ServicioAcademico } from './academico.service';
import { Curso, CursoRequest, Asignatura, Evaluacion } from '../models/academico.models';

const API = 'http://localhost:8080';

describe('ServicioAcademico', () => {
  let servicio: ServicioAcademico;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    servicio = TestBed.inject(ServicioAcademico);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Verifica que no queden peticiones HTTP sin resolver
    httpMock.verify();
  });

  // ── Cursos ────────────────────────────────────────────────────────────────────

  it('listarCursos() debe hacer GET a /cursos y retornar la lista', () => {
    const cursosEsperados: Curso[] = [
      { id: 1, gradoCurso: '1°', seccionCurso: 'A', anioCurso: 2026 },
      { id: 2, gradoCurso: '2°', seccionCurso: 'B', anioCurso: 2026 },
    ];

    servicio.listarCursos().subscribe(cursos => {
      expect(cursos.length).toBe(2);
      expect(cursos).toEqual(cursosEsperados);
    });

    const req = httpMock.expectOne(`${API}/cursos`);
    expect(req.request.method).toBe('GET');
    req.flush(cursosEsperados); // simula la respuesta del servidor
  });

  it('crearCurso() debe hacer POST a /cursos con el body correcto', () => {
    const nuevo: CursoRequest = { gradoCurso: '3°', seccionCurso: 'C', anioCurso: 2026 };
    const respuesta: Curso = { id: 3, ...nuevo };

    servicio.crearCurso(nuevo).subscribe(curso => {
      expect(curso.id).toBe(3);
      expect(curso.gradoCurso).toBe('3°');
    });

    const req = httpMock.expectOne(`${API}/cursos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(nuevo);
    req.flush(respuesta);
  });

  it('actualizarCurso() debe hacer PUT a /cursos/:id', () => {
    const dto: CursoRequest = { gradoCurso: '1°', seccionCurso: 'Z', anioCurso: 2026 };
    const respuesta: Curso = { id: 1, ...dto };

    servicio.actualizarCurso(1, dto).subscribe(curso => {
      expect(curso.seccionCurso).toBe('Z');
    });

    const req = httpMock.expectOne(`${API}/cursos/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(respuesta);
  });

  it('eliminarCurso() debe hacer DELETE a /cursos/:id', () => {
    servicio.eliminarCurso(1).subscribe();

    const req = httpMock.expectOne(`${API}/cursos/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // ── Asignaturas ───────────────────────────────────────────────────────────────

  it('listarAsignaturas() debe hacer GET a /asignaturas', () => {
    const asignaturas: Asignatura[] = [
      { id_asignatura: 1, nombreAsignatura: 'Matemáticas' },
    ];

    servicio.listarAsignaturas().subscribe(lista => {
      expect(lista).toEqual(asignaturas);
    });

    const req = httpMock.expectOne(`${API}/asignaturas`);
    expect(req.request.method).toBe('GET');
    req.flush(asignaturas);
  });

  // ── Evaluaciones ──────────────────────────────────────────────────────────────

  it('listarEvaluacionesPorCursoAsignatura() debe GET a /evaluaciones/curso-asignatura/:id', () => {
    const evaluaciones: Evaluacion[] = [];

    servicio.listarEvaluacionesPorCursoAsignatura(5).subscribe(lista => {
      expect(lista).toEqual([]);
    });

    const req = httpMock.expectOne(`${API}/evaluaciones/curso-asignatura/5`);
    expect(req.request.method).toBe('GET');
    req.flush(evaluaciones);
  });

  // ── Manejo de errores ─────────────────────────────────────────────────────────

  it('listarCursos() debe propagar el error si el servidor falla', () => {
    servicio.listarCursos().subscribe({
      next: () => fail('debería haber fallado'),
      error: (err) => {
        expect(err.status).toBe(500);
      },
    });

    const req = httpMock.expectOne(`${API}/cursos`);
    req.flush('Error del servidor', { status: 500, statusText: 'Internal Server Error' });
  });
});
