// Modelos del MS-Notificacion (vía BFF).

export type TipoNotificacion = 'CALIFICACION' | 'CONDUCTA' | 'ASISTENCIA' | 'MATRICULA';

export const ETIQUETAS_TIPO_NOTIFICACION: Record<TipoNotificacion, string> = {
  CALIFICACION: 'Calificación',
  CONDUCTA: 'Conducta',
  ASISTENCIA: 'Asistencia',
  MATRICULA: 'Matrícula',
};

export interface Notificacion {
  id: number;
  usuarioDestinatario: number;
  tipoNotificacion: TipoNotificacion;
  idReferencia: number | null;
  asunto: string;
  mensaje: string;
  leida: boolean;
  fechaEnvio: string; // dd-MM-yyyy HH:mm
  fechaLectura: string | null;
}
