export interface UsuarioDTOResponse {
  idUsuario: number;
  nombreUsuario: string;
  primerApellidoUsuario: string;
  segundoApellidoUsuario: string;
  correoUsuario: string;
  fechaNacUsuario: string;
  roles: string[];
}

export interface UsuarioDTOInternal extends UsuarioDTOResponse {
  rutUsuario: string;
}

export interface UsuarioDTO {
  rutUsuario: string;
  nombreUsuario: string;
  primerApellidoUsuario: string;
  segundoApellidoUsuario?: string;
  correoUsuario: string;
  fechaNacUsuario: string;
}

export type TipoRol = 'DOCENTE' | 'APODERADO' | 'ADMINISTRATIVO' | 'ESTUDIANTE';

export const ROLES_DISPONIBLES: TipoRol[] = [
  'DOCENTE', 'APODERADO', 'ADMINISTRATIVO', 'ESTUDIANTE'
];

export const ETIQUETAS_ROL: Record<TipoRol, string> = {
  DOCENTE:        'Docente',
  APODERADO:      'Apoderado',
  ADMINISTRATIVO: 'Administrativo',
  ESTUDIANTE:     'Estudiante',
};

export const CLASE_ROL: Record<TipoRol, string> = {
  DOCENTE:        'bg-success',
  APODERADO:      'bg-primary',
  ADMINISTRATIVO: 'bg-danger',
  ESTUDIANTE:     'bg-warning text-dark',
};
