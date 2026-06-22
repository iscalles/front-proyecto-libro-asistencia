/**
 * Exportación del Módulo de Login
 * Exporta todos los componentes públicos, servicios y tipos
 * Permite importar desde '@/shared/components/login' en lugar de archivos individuales
 */

// Componentes
export { ComponenteFormularioAcceso } from './components/login-formulario/login-formulario.component';
export { ComponenteContrasenaConmutable } from './components/password-input/password-input.component';
export { ComponenteEntradaFormulario } from './components/input-formulario/input-formulario.component';
export { ComponenteModalExpiracionSesion } from './components/session-expiry-modal/session-expiry-modal.component';

// Servicios
export { ServicioAutenticacion } from './services/auth.service';
export { ServicioToken } from './services/token.service';
export { ServicioValidadorRut } from './services/rut-validator.service';
export { ServicioExpiracionSesion } from './services/session-expiry.service';

// Interceptores
export { jwtInterceptor, JwtInterceptor } from './interceptors/jwt.interceptor';
export { authErrorInterceptor, AuthErrorInterceptor } from './interceptors/auth-error.interceptor';

// Tipos
export * from './types/auth.types';
