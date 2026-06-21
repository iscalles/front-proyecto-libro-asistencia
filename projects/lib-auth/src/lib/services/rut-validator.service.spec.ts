import { TestBed } from '@angular/core/testing';
import { ServicioValidadorRut } from './rut-validator.service';

describe('ServicioValidadorRut', () => {
  let servicio: ServicioValidadorRut;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(ServicioValidadorRut);
  });

  // ── validateRut ────────────────────────────────────────────────────────────

  it('debería aceptar un RUT válido con puntos', () => {
    expect(servicio.validateRut('12.345.678-5')).toBeTrue();
  });

  it('debería aceptar un RUT válido sin puntos', () => {
    expect(servicio.validateRut('12345678-5')).toBeTrue();
  });

  it('debería aceptar un RUT con dígito verificador K', () => {
    expect(servicio.validateRut('7.000.013-K')).toBeTrue();
  });

  it('debería aceptar K minúscula como dígito verificador', () => {
    expect(servicio.validateRut('7.000.013-k')).toBeTrue();
  });

  it('debería rechazar un RUT con dígito verificador incorrecto', () => {
    expect(servicio.validateRut('12.345.678-0')).toBeFalse();
  });

  it('debería rechazar un RUT vacío', () => {
    expect(servicio.validateRut('')).toBeFalse();
  });

  it('debería rechazar un RUT con formato inválido (sin guión)', () => {
    expect(servicio.validateRut('123456789')).toBeFalse();
  });

  it('debería rechazar un RUT con menos de 7 dígitos', () => {
    expect(servicio.validateRut('123456-7')).toBeFalse();
  });

  // ── formatRut ──────────────────────────────────────────────────────────────

  it('debería formatear correctamente un RUT sin puntos', () => {
    expect(servicio.formatRut('12345678-9')).toBe('12.345.678-9');
  });

  it('debería retornar el RUT original si el formato es inválido', () => {
    const rutInvalido = 'no-es-rut';
    expect(servicio.formatRut(rutInvalido)).toBe(rutInvalido);
  });
});
