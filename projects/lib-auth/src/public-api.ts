/*
 * Public API Surface of lib-auth
 * Todo lo que se exporte aquí puede ser importado por la app principal
 */

// Componentes
export { ComponenteFormularioAcceso } from './lib/components/login-formulario/login-formulario.component';
export { ComponenteContrasenaConmutable } from './lib/components/password-input/password-input.component';
export { ComponenteEntradaFormulario } from './lib/components/input-formulario/input-formulario.component';

// Servicios
export { ServicioAutenticacion } from './lib/services/auth.service';
export { ServicioToken } from './lib/services/token.service';
export { ServicioValidadorRut } from './lib/services/rut-validator.service';
export { AUTH_API_URL } from './lib/services/auth.service';

// Interceptores
export { jwtInterceptor } from './lib/interceptors/jwt.interceptor';
export { authErrorInterceptor } from './lib/interceptors/auth-error.interceptor';

// Tipos
export * from './lib/types/auth.types';