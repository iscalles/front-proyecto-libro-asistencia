export interface Asistencia {
  id_asistencia: number;
  fechaAsistencia: string;        // formato dd-MM-yyyy
  justificacionAsistencia?: string;
  estadoAsistencia: string;       // 'Presente' | 'Ausente' | 'Justificado'
  idMatricula: number;
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
