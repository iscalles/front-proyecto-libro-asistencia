import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ServicioRelaciones } from './relaciones.service';
import { ApoderadoResponse, EstudianteResponse, RelacionApEst } from '../models/relaciones.models';

const API = 'http://localhost:8080';

describe('ServicioRelaciones', () => {
  let servicio: ServicioRelaciones;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(ServicioRelaciones);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('obtenerApoderados() debe GET a /apoderado', () => {
    const apoderados: ApoderadoResponse[] = [
      { idApoderado: 1, usuario: { idUsuario: 10, rutUsuario: '12345678-5', nombreUsuario: 'Juan', primerApellidoUsuario: 'Pérez' } },
    ];

    servicio.obtenerApoderados().subscribe(a => expect(a).toEqual(apoderados));

    const req = httpMock.expectOne(`${API}/apoderado`);
    expect(req.request.method).toBe('GET');
    req.flush(apoderados);
  });

  it('obtenerEstudiantes() debe GET a /estudiante', () => {
    const estudiantes: EstudianteResponse[] = [
      { idEstudiante: 1, usuario: { idUsuario: 20, rutUsuario: '9999999-3', nombreUsuario: 'Ana', primerApellidoUsuario: 'López' } },
    ];

    servicio.obtenerEstudiantes().subscribe(e => expect(e).toEqual(estudiantes));

    const req = httpMock.expectOne(`${API}/estudiante`);
    expect(req.request.method).toBe('GET');
    req.flush(estudiantes);
  });

  it('obtenerEstudiantesDeApoderado() debe GET a /apoderado-estudiante/apoderado/:id/estudiantes', () => {
    const relaciones: RelacionApEst[] = [
      { id: { idApoderado: 1, idEstudiante: 2 }, parentescoApoderadoEstudiante: 'Padre' },
    ];

    servicio.obtenerEstudiantesDeApoderado(1).subscribe(r => expect(r).toEqual(relaciones));

    const req = httpMock.expectOne(`${API}/apoderado-estudiante/apoderado/1/estudiantes`);
    expect(req.request.method).toBe('GET');
    req.flush(relaciones);
  });

  it('crearRelacion() debe POST a /apoderado-estudiante con el body correcto', () => {
    servicio.crearRelacion(1, 2, 'Madre').subscribe();

    const req = httpMock.expectOne(`${API}/apoderado-estudiante`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      idApoderado: 1,
      idEstudiante: 2,
      parentescoApoderadoEstudiante: 'Madre',
    });
    req.flush({ id: { idApoderado: 1, idEstudiante: 2 }, parentescoApoderadoEstudiante: 'Madre' });
  });

  it('eliminarRelacion() debe DELETE a /apoderado-estudiante/apoderado/:idA/estudiante/:idE', () => {
    servicio.eliminarRelacion(1, 2).subscribe();

    const req = httpMock.expectOne(`${API}/apoderado-estudiante/apoderado/1/estudiante/2`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
