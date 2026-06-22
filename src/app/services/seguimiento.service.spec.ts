import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ServicioSeguimiento } from './seguimiento.service';
import { Asistencia } from '../models/seguimiento.models';
import { ApoderadoResponse } from '../models/relaciones.models';

const API = 'http://localhost:8080';

describe('ServicioSeguimiento', () => {
  let servicio: ServicioSeguimiento;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(ServicioSeguimiento);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('obtenerApoderados() debe GET a /apoderado y retornar la lista', () => {
    const apoderados: ApoderadoResponse[] = [
      { idApoderado: 1, usuario: { idUsuario: 10, rutUsuario: '12345678-5', nombreUsuario: 'Juan', primerApellidoUsuario: 'Pérez' } },
    ];

    servicio.obtenerApoderados().subscribe(a => expect(a).toEqual(apoderados));

    const req = httpMock.expectOne(`${API}/apoderado`);
    expect(req.request.method).toBe('GET');
    req.flush(apoderados);
  });

  it('obtenerAsistencias() debe GET a /asistencia y retornar la lista', () => {
    const asistencias: Asistencia[] = [
      { id_asistencia: 1, fechaAsistencia: '01-06-2026', estadoAsistencia: 'Presente', idMatricula: 1 },
    ];

    servicio.obtenerAsistencias().subscribe(a => expect(a).toEqual(asistencias));

    const req = httpMock.expectOne(`${API}/asistencia`);
    expect(req.request.method).toBe('GET');
    req.flush(asistencias);
  });
});
