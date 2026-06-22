import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  UsuarioDTOResponse, UsuarioDTOInternal,
  UsuarioDTO, TipoRol
} from '../models/usuario-admin.models';


@Injectable({ providedIn: 'root' })
export class ServicioUsuarioAdmin {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  // ── Usuarios ────────────────────────────────────────────────────────────────

  // Lista todos los usuarios con RUT incluido (endpoint administrativo)
  obtenerUsuarios(): Observable<UsuarioDTOInternal[]> {
    return this.http.get<UsuarioDTOInternal[]>(`${this.api}/usuario/interno`);
  }

  // Lista todos los usuarios (endpoint base, sin RUT)
  listarUsuarios(): Observable<UsuarioDTOResponse[]> {
    return this.http.get<UsuarioDTOResponse[]>(`${this.api}/usuario`);
  }

  obtenerUsuarioInterno(id: number): Observable<UsuarioDTOInternal> {
    return this.http.get<UsuarioDTOInternal>(`${this.api}/usuario/interno/${id}`);
  }

  crearUsuario(dto: UsuarioDTO): Observable<UsuarioDTOResponse> {
    return this.http.post<UsuarioDTOResponse>(`${this.api}/usuario`, dto);
  }

  actualizarUsuario(id: number, dto: UsuarioDTO): Observable<UsuarioDTOResponse> {
    return this.http.put<UsuarioDTOResponse>(`${this.api}/usuario/${id}`, dto);
  }

  eliminarUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/usuario/${id}`);
  }

  // ── Cuenta de acceso (ms-auth vía BFF) ─────────────────────────────────────

  // Cambia la contraseña del usuario autenticado validando la actual
  cambiarContrasena(idUsuario: number, passwordActual: string, passwordNuevo: string): Observable<void> {
    return this.http.post<void>(`${this.api}/cuenta-acceso/cambiar-contrasena`, {
      idUsuario,
      passwordActual,
      passwordNuevo,
    });
  }

  // Envía la contraseña en texto plano; el backend la hashea con BCrypt
  crearCuenta(idUsuario: number, passwordPlano: string): Observable<unknown> {
    return this.http.post(`${this.api}/cuenta-acceso/inicializar`, {
      idUsuario,
      passwordPlano,
    });
  }

  // Genera una contraseña temporal segura (12 caracteres)
  generarContrasena(): string {
    const mayusculas = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const minusculas = 'abcdefghjkmnpqrstuvwxyz';
    const numeros    = '23456789';
    const todos      = mayusculas + minusculas + numeros;
    // Garantiza al menos una mayúscula, una minúscula y un número
    const aleatoria  = (chars: string) => chars[Math.floor(Math.random() * chars.length)];
    const base = [aleatoria(mayusculas), aleatoria(minusculas), aleatoria(numeros)];
    for (let i = 3; i < 12; i++) base.push(aleatoria(todos));
    return base.sort(() => Math.random() - 0.5).join('');
  }

  // ── Roles ───────────────────────────────────────────────────────────────────

  asignarRol(idUsuario: number, rol: TipoRol): Observable<unknown> {
    return this.http.post(
      `${this.api}/usuario-rol/usuario/${idUsuario}/rol/${rol}`, {}
    );
  }

  quitarRol(idUsuario: number, rol: TipoRol): Observable<void> {
    return this.http.delete<void>(
      `${this.api}/usuario-rol/usuario/${idUsuario}/rol/${rol}`
    );
  }

  // ── Perfiles especializados ─────────────────────────────────────────────────

  private crearPerfil(idUsuario: number, rol: TipoRol): Observable<unknown> {
    switch (rol) {
      case 'DOCENTE':
        return this.http.post(`${this.api}/docente`, {
          idUsuario,
          tituloProfesionalDocente: 'Por definir',
          especialidadDocente: 'Por definir',
          estadoDocente: 'ACTIVO',
        });
      case 'APODERADO':
        return this.http.post(`${this.api}/apoderado`, {
          idUsuario,
          direccionApoderado: 'Por definir',
          telefonoApoderado: 'Por definir',
        });
      case 'ADMINISTRATIVO':
        return this.http.post(`${this.api}/administrativo`, {
          idUsuario,
          cargoAdministrativo: 'Por definir',
          departamentoAdministrativo: 'Por definir',
        });
      case 'ESTUDIANTE':
        return this.http.post(`${this.api}/estudiante`, {
          idUsuario,
          fechaIngresoEstudiante: new Date().toISOString().split('T')[0],
          estadoEstudiante: 'ACTIVO',
        });
    }
  }

  // ── Operaciones compuestas ──────────────────────────────────────────────────

  // Crea el usuario base + cuenta + roles + perfiles en paralelo.
  // Devuelve el usuario creado junto con la contraseña generada.
  crearUsuarioCompleto(dto: UsuarioDTO, roles: TipoRol[]): Observable<{ usuario: UsuarioDTOResponse; contrasena: string }> {
    const contrasena = this.generarContrasena();
    return this.crearUsuario(dto).pipe(
      switchMap(usuario => {
        const id = usuario.idUsuario;
        const tareas: Observable<unknown>[] = [
          this.crearCuenta(id, contrasena),
          ...roles.map(r => this.asignarRol(id, r)),
          ...roles.map(r => this.crearPerfil(id, r).pipe(catchError(() => of(null)))),
        ];
        return forkJoin(tareas).pipe(
          map(() => ({ usuario, contrasena })),
          catchError(error =>
            // Si falla la cuenta de acceso o la asignación de roles, no debe quedar un
            // usuario a medio crear (sin login). Se revierte para que el admin pueda
            // reintentar sin chocar con "ya existe usuario con ese RUT".
            this.eliminarUsuario(id).pipe(
              catchError(() => of(null)),
              switchMap(() => throwError(() => error))
            )
          )
        );
      })
    );
  }

  // Aplica el diff de roles: agrega los nuevos (con perfil) y quita los eliminados.
  sincronizarRoles(
    idUsuario: number,
    agregar: TipoRol[],
    quitar: TipoRol[]
  ): Observable<unknown> {
    if (agregar.length === 0 && quitar.length === 0) {
      return of(null);
    }
    const tareas: Observable<unknown>[] = [
      ...agregar.map(r =>
        this.asignarRol(idUsuario, r).pipe(
          switchMap(() => this.crearPerfil(idUsuario, r).pipe(catchError(() => of(null))))
        )
      ),
      ...quitar.map(r => this.quitarRol(idUsuario, r).pipe(catchError(() => of(null)))),
    ];
    return forkJoin(tareas);
  }
}
