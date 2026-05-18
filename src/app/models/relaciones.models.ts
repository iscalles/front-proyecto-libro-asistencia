export interface UsuarioAnidado {
  idUsuario: number;
  rutUsuario: string;
  nombreUsuario: string;
  primerApellidoUsuario: string;
  segundoApellidoUsuario?: string;
}

export interface ApoderadoResponse {
  idApoderado: number;
  usuario: UsuarioAnidado;
  direccionApoderado?: string;
  telefonoApoderado?: string;
}

export interface EstudianteResponse {
  idEstudiante: number;
  usuario: UsuarioAnidado;
  estadoEstudiante?: string;
  fechaIngresoEstudiante?: string;
}

// Lo que devuelve GET /apoderado-estudiante/apoderado/{id}/estudiantes
export interface RelacionApEst {
  id: {
    idApoderado: number;
    idEstudiante: number;
  };
  parentescoApoderadoEstudiante: string;
}

export const OPCIONES_PARENTESCO = [
  'Padre', 'Madre', 'Tutor/a', 'Abuelo/a', 'Tío/a', 'Hermano/a', 'Otro'
] as const;
