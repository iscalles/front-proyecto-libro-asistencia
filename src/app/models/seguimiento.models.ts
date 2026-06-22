export interface Asistencia {
  id_asistencia: number;
  fechaAsistencia: string;        // formato dd-MM-yyyy
  justificacionAsistencia?: string;
  estadoAsistencia: string;       // 'Presente' | 'Ausente' | 'Justificado'
  idMatricula: number;
}

export interface Conducta {
  idConducta: number;
  tipoConducta: string;
  descripcionConducta: string;
  fechaConducta: string;   // formato dd-MM-yyyy
  docenteIdUsuario: number;
  nombreDocente: string;
  estudianteIdUsuario: number;
}

export interface ResumenCalificaciones {
  nombreAsignatura: string;
  nombreDocente: string;
  promedio: number;
  calificaciones: { nombre: string; fecha: string; nota: number }[];
}

export interface ResumenAsistencia {
  total: number;
  presentes: number;
  ausentes: number;
  justificados: number;
  porcentajeAsistencia: number;
}
