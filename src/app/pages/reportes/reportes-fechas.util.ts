export type TipoPeriodo = '1' | '2';

function pad(valor: number): string {
  return valor.toString().padStart(2, '0');
}

function iso(anio: number, mes: number, dia: number): string {
  return `${anio}-${pad(mes)}-${pad(dia)}`;
}

/** Primer semestre: 1 de marzo al 5 de julio del año dado. */
export function primerSemestre(anio: number): { desde: string; hasta: string } {
  return { desde: iso(anio, 3, 1), hasta: iso(anio, 7, 5) };
}

/** Segundo semestre: 6 de julio al 18 de diciembre del año dado. */
export function segundoSemestre(anio: number): { desde: string; hasta: string } {
  return { desde: iso(anio, 7, 6), hasta: iso(anio, 12, 18) };
}

/**
 * Determina el semestre vigente según la fecha dada.
 * Antes del 1 de marzo (vacaciones de verano) se considera el segundo semestre del año anterior.
 */
export function periodoSemestreActual(hoy: Date = new Date()): { desde: string; hasta: string; tipo: TipoPeriodo; anio: number } {
  const anio = hoy.getFullYear();
  const clave = (hoy.getMonth() + 1) * 100 + hoy.getDate();

  if (clave < 301) {
    return { ...segundoSemestre(anio - 1), tipo: '2', anio: anio - 1 };
  }
  if (clave <= 705) {
    return { ...primerSemestre(anio), tipo: '1', anio };
  }
  return { ...segundoSemestre(anio), tipo: '2', anio };
}
