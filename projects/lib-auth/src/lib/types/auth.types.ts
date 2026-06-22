export interface CredencialesAutenticacion {
  rutUsuario: string;
  password: string;
}

export interface RespuestaAutenticacion {
  accessToken: string;
  refreshToken: string;
  idUsuario: string;
  nombre: string;
  correo: string;
  roles: string[];
  expiresIn: number;
  debeCambiarPassword?: boolean;
}

export interface InfoUsuario {
  idUsuario: string;
  nombre: string;
  correo: string;
  roles: string[];
  rutUsuario: string;
  debeCambiarPassword?: boolean;
}

export interface ErrorAutenticacion {
  codigo: string;
  mensaje: string;
  timestamp?: number;
}