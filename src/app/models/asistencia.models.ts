// Modelos del MS-Asistencia (vía BFF).

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
