# Libro de Clases Digital — Frontend

Aplicación web del sistema de Libro de Clases Digital del **Colegio Bernardo O'Higgins**, desarrollada con **Angular 19** y Server-Side Rendering (SSR). Incluye la librería NPM `lib-auth` para autenticación reutilizable.

---

## Requisitos previos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 18.x o superior |
| npm | 9.x o superior |
| Angular CLI | 19.x (`npm install -g @angular/cli`) |

Verificar instalación:
```bash
node -v && npm -v && ng version
```

---

## Estructura del proyecto

```
front-proyecto-libro-asistencia/
├── src/app/
│   ├── guards/
│   │   ├── auth.guard.ts        # authGuard: exige estar autenticado
│   │   ├── role.guard.ts        # adminGuard, docenteGuard, estudianteGuard (por rol)
│   │   └── apoderado.guard.ts   # apoderadoGuard: rol APODERADO
│   ├── models/            # Interfaces TypeScript alineadas con los DTOs del backend
│   ├── pages/
│   │   ├── login-page/         # Página de acceso (/acceso)
│   │   ├── dashboard/          # Panel principal con vista por rol (/dashboard)
│   │   ├── admin/              # Mantenedor de usuarios (/admin)
│   │   ├── relaciones/         # Gestión apoderado-estudiante (/relaciones)
│   │   ├── academico/          # Mantenedor de cursos, asignaturas, evaluaciones, matrículas y calificaciones (/academico)
│   │   ├── libro-clases/       # Toma de asistencia y registro de conducta del docente (/libro-clases)
│   │   ├── calificaciones/     # Ingreso de notas por evaluación, vista docente (/calificaciones)
│   │   ├── reportes/           # Reportes de asistencia y conducta por curso (/reportes)
│   │   ├── seguimiento/        # Vista del apoderado: asistencia y notas de sus estudiantes (/seguimiento)
│   │   └── mis-calificaciones/ # Vista del estudiante: sus propias notas y asignaturas (/mis-calificaciones)
│   └── services/          # Servicios HTTP hacia el BFF (academico, asistencia, relaciones, seguimiento, usuario-admin)
├── projects/
│   └── lib-auth/          # Librería NPM de autenticación (componentes, servicios e interceptores reutilizables)
├── package.json
└── angular.json
```

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/iscalles/front-proyecto-libro-asistencia.git
cd front-proyecto-libro-asistencia

# 2. Instalar dependencias
npm install

# 3. Compilar la librería lib-auth (OBLIGATORIO antes de iniciar)
ng build lib-auth
```

> La librería debe compilarse cada vez que se modifique. Su output queda en `dist/lib-auth/` y es referenciado en `tsconfig.json`.

---

## Ejecución

```bash
# Modo desarrollo
npm start
# → Disponible en http://localhost:4200
```

> **Requisito:** el BFF debe estar corriendo en `http://localhost:8080` antes de iniciar el frontend.

---

## Scripts disponibles

| Script | Descripción |
|---|---|
| `npm start` | Servidor de desarrollo en `http://localhost:4200` |
| `npm run build` | Compilación de producción (output en `dist/`)
| `ng build lib-auth` | Compila la librería de autenticación |

---

## Librería NPM: `lib-auth`

Componente Angular empaquetado según estándar NPM. Contiene todos los elementos de autenticación desacoplados del proyecto principal:

| Elemento | Tipo | Descripción |
|---|---|---|
| `ComponenteFormularioAcceso` | Componente | Formulario de login con validación de RUT chileno |
| `ComponenteContrasenaConmutable` | Componente | Input de contraseña con toggle de visibilidad |
| `ComponenteEntradaFormulario` | Componente | Input genérico reutilizable con ControlValueAccessor |
| `ServicioAutenticacion` | Servicio | Llama a `POST /auth/login`, guarda tokens |
| `ServicioToken` | Servicio | Gestiona JWT en localStorage mediante Angular Signals |
| `ServicioValidadorRut` | Servicio | Valida RUT chileno con algoritmo módulo 11 |
| `ServicioExpiracionSesion` | Servicio | Vigila la expiración del access token y muestra un aviso ~2 minutos antes, permitiendo extender la sesión (refresh) o cerrarla |
| `ComponenteModalExpiracionSesion` | Componente | Modal de aviso de expiración de sesión, conectado a `ServicioExpiracionSesion` |
| `jwtInterceptor` | Interceptor | Agrega `Authorization: Bearer <token>` a cada petición HTTP |
| `authErrorInterceptor` | Interceptor | Redirige a `/acceso` ante respuestas 401 o 403 |

---

## Rutas protegidas

| Ruta | Guard aplicado | Acceso |
|---|---|---|
| `/acceso` | — | Público |
| `/dashboard` | `authGuard` | Cualquier usuario autenticado |
| `/admin` | `authGuard` + `adminGuard` | Solo rol `ADMINISTRATIVO` |
| `/relaciones` | `authGuard` + `adminGuard` | Solo rol `ADMINISTRATIVO` |
| `/academico` | `authGuard` + `adminGuard` | Solo rol `ADMINISTRATIVO` — mantenedor de cursos, asignaturas, evaluaciones, matrículas y calificaciones |
| `/reportes` | `authGuard` + `adminGuard` | Solo rol `ADMINISTRATIVO` — reportes de asistencia y conducta por curso |
| `/libro-clases` | `authGuard` + `docenteGuard` | Solo rol `DOCENTE` — toma de asistencia y registro de conducta |
| `/calificaciones` | `authGuard` + `docenteGuard` | Solo rol `DOCENTE` — ingreso de notas por evaluación |
| `/seguimiento` | `authGuard` + `apoderadoGuard` | Solo rol `APODERADO` — asistencia y notas de sus estudiantes |
| `/mis-calificaciones` | `authGuard` + `estudianteGuard` | Solo rol `ESTUDIANTE` — sus propias notas y asignaturas |

> Los guards de rol (`adminGuard`, `docenteGuard`, `estudianteGuard` en `role.guard.ts`, y `apoderadoGuard` en `apoderado.guard.ts`) no redirigen a `/acceso` si el usuario no tiene el rol requerido, sino a `/dashboard`: el usuario ya está autenticado, solo no tiene permiso para esa sección.

---

## Patrones de diseño implementados

| Patrón | Implementación |
|---|---|
| **Interceptor** | `jwtInterceptor` y `authErrorInterceptor` interceptan y modifican peticiones HTTP |
| **Guard** | `authGuard` y `adminGuard` protegen rutas por autenticación y rol |
| **Facade** | `ServicioToken` encapsula toda la lógica de almacenamiento y lectura de JWT |
| **Observer** | Angular Signals + RxJS para reactividad en servicios y componentes |
| **Library / Plugin** | `lib-auth` es un módulo NPM independiente que puede reutilizarse en otros proyectos Angular |

---

## Flujo de autenticación

```
Usuario → /acceso → POST /auth/login (BFF:8080)
                 → Guarda accessToken + refreshToken en localStorage
                 → Redirige a /dashboard
                 → jwtInterceptor agrega Bearer token en cada request
                 → authErrorInterceptor intercepta 401/403 y redirige a /acceso
```
