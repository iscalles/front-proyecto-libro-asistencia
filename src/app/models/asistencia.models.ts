// Modelos del MS-Asistencia (vía BFF).

export interface ValidacionFecha {
  valida: boolean;
  motivo: string | null;
}

export interface FechaExcluida {
  id: number;
  fecha: string;        // dd-MM-yyyy
  descripcion: string;
}

export interface PeriodoEscolar {
  id: number;
  nombre: string;
  fechaInicio: string;  // dd-MM-yyyy
  fechaFin: string;
}

export interface RosterAlumno {
  idMatricula: number;
  estudianteIdUsuario: number;
  nombreEstudiante: string;
  rutEstudiante: string;
  idCurso: number;
}

export type EstadoAsistencia = 'Presente' | 'Ausente' | 'Justificado';

export const ESTADOS_ASISTENCIA: EstadoAsistencia[] = ['Presente', 'Ausente', 'Justificado'];

export const ETIQUETAS_ESTADO_ASISTENCIA: Record<EstadoAsistencia, string> = {
  Presente: 'Presente',
  Ausente: 'Ausente',
  Justificado: 'Justificado',
};

export interface Asistencia {
  id_asistencia: number;
  fechaAsistencia: string; // dd-MM-yyyy
  estadoAsistencia: string;
  justificacionAsistencia: string | null;
  idMatricula: number;
}

export interface DetalleAsistenciaRequest {
  idMatricula: number;
  estadoAsistencia: EstadoAsistencia;
  justificacionAsistencia?: string;
}

export interface AsistenciaLoteRequest {
  idCurso: number;
  fechaAsistencia: string; // dd-MM-yyyy
  detalles: DetalleAsistenciaRequest[];
}

export type TipoConducta = 'positiva' | 'negativa';

export const TIPOS_CONDUCTA: TipoConducta[] = ['positiva', 'negativa'];

export const ETIQUETAS_TIPO_CONDUCTA: Record<TipoConducta, string> = {
  positiva: 'Positiva',
  negativa: 'Negativa',
};

export interface Conducta {
  id_conducta: number;
  tipoConducta: string;
  descripcionConducta: string;
  fechaConducta: string; // dd-MM-yyyy
  docenteIdUsuario: number;
  estudianteIdUsuario: number;
}

export interface ConductaRequest {
  tipoConducta: TipoConducta;
  descripcionConducta: string;
  fechaConducta: string; // dd-MM-yyyy
  docenteIdUsuario: number;
  estudianteIdUsuario: number;
}

// ── Reportes administrativos ───────────────────────────────────────────────────
export interface ReporteAsistenciaDia {
  idMatricula: number;
  nombreEstudiante: string;
  rutEstudiante: string;
  estadoAsistencia: string;
  justificacionAsistencia: string | null;
}

export interface ReporteAsistenciaDetalle extends ReporteAsistenciaDia {
  fecha: string; // yyyy-MM-dd
}

export interface ReporteAsistenciaResumen {
  idCurso: number;
  desde: string;
  hasta: string;
  totalRegistros: number;
  totalPresentes: number;
  totalAusentes: number;
  totalJustificados: number;
  porcentajeAsistencia: number;
}

export interface ReporteConductaAlumno {
  estudianteIdUsuario: number;
  nombreEstudiante: string;
  rutEstudiante: string;
  totalPositivas: number;
  totalNegativas: number;
}

export interface ReporteAlumnoAsistencia {
  idMatricula: number;
  estudianteIdUsuario: number;
  nombreEstudiante: string;
  rutEstudiante: string;
  totalPresentes: number;
  totalAusentes: number;
  totalJustificados: number;
  porcentajeAsistencia: number;
}

export interface ReporteAlumnoCompleto extends ReporteAlumnoAsistencia {
  totalPositivas: number;
  totalNegativas: number;
}
