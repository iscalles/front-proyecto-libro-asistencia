// Modelos del MS-Mensajeria (vía BFF).

export interface Mensaje {
  idMensaje: number;
  asuntoMensaje: string | null;
  cuerpoMensaje: string;
  fechaEnvioMensaje: string; // dd-MM-yyyy HH:mm
  estadoMensaje: 'NO_LEIDO' | 'LEIDO';
  idUsuarioEmisor: number;
  idUsuarioReceptor: number;
}

export interface MensajeRequest {
  asuntoMensaje?: string;
  cuerpoMensaje: string;
  idUsuarioReceptor: number;
}

// Contacto con el que un docente/apoderado puede chatear, resuelto en el
// frontend a partir de las relaciones docente-curso-alumno-apoderado
// (ms-academico + ms-usuario), ya que ms-mensajeria no las conoce.
export interface ContactoMensajeria {
  idUsuario: number;
  nombre: string;
  detalle: string;
}
