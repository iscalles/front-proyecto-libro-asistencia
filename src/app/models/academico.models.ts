// Modelos del MS-Academico (vía BFF).
// Para cada entidad hay dos tipos:
//  - *Request:  lo que el frontend ENVÍA al crear/editar
//  - el otro:   lo que el backend DEVUELVE al consultar

// ── Curso ─────────────────────────────────────────────────────────────────────
export interface Curso {
  id: number;
  gradoCurso: string;
  seccionCurso: string;
  anioCurso: number;
}

export interface CursoRequest {
  gradoCurso: string;
  seccionCurso: string;
  anioCurso: number;
}

// ── Asignatura ────────────────────────────────────────────────────────────────
export interface Asignatura {
  id_asignatura: number;
  nombreAsignatura: string;
}

export interface AsignaturaRequest {
  nombreAsignatura: string;
}

// ── Evaluacion ────────────────────────────────────────────────────────────────
export interface Evaluacion {
  idEvaluacion: number;
  nombreEvaluacion: string;
  fechaEvaluacion: string; // formato dd-MM-yyyy
  // Curso-asignatura a la que pertenece (datos aplanados)
  idCursoAsignatura: number;
  idAsignatura: number;
  nombreAsignatura: string;
  idCurso: number;
  gradoCurso: string;
  seccionCurso: string;
}

export interface EvaluacionRequest {
  nombreEvaluacion: string;
  fechaEvaluacion: string;
  idCursoAsignatura: number;
}

// ── Matricula ─────────────────────────────────────────────────────────────────
export interface Matricula {
  idMatricula: number;
  anioAcademicoMatricula: number;
  estudianteIdUsuario: number;
  nombreEstudiante: string;
  idCurso: number;
  gradoCurso: string;
  seccionCurso: string;
  anioCurso: number;
}

export interface MatriculaRequest {
  idCurso: number;
  estudianteIdUsuario: number;
}

// ── CursoAsignatura ───────────────────────────────────────────────────────────
export interface CursoAsignatura {
  idCursoAsignatura: number;
  docenteIdUsuario: number;
  nombreDocente: string;
  idCurso: number;
  gradoCurso: string;
  seccionCurso: string;
  anioCurso: number;
  idAsignatura: number;
  nombreAsignatura: string;
}

export interface CursoAsignaturaRequest {
  idCurso: number;
  idAsignatura: number;
  docenteIdUsuario: number;
}

// ── Calificacion ──────────────────────────────────────────────────────────────
export interface Calificacion {
  idCalificacion: number;
  notaCalificacion: number;
  idMatricula: number;
  estudianteIdUsuario: number;
  idEvaluacion: number;
  nombreEvaluacion: string;
  fechaEvaluacion: string;
  fechaRegistro: string;
  creadoPorIdUsuario: number;
  ultimaModificacion: string;
  modificadoPorIdUsuario: number;
}

export interface CalificacionRequest {
  notaCalificacion: number;
  idMatricula: number;
  idEvaluacion: number;
  creadoPorIdUsuario: number;
}
