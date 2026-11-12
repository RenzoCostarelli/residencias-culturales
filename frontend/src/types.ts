export type Rol = "SUPERADMIN" | "ADMIN_GRUPO" | "EVALUADOR";

export type Usuario = {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: Rol;
  activo?: boolean;
  debeCambiarPassword?: boolean;
  createdAt?: string;
};

// Respuesta del alta / restablecimiento: la contraseña generada solo viaja esta vez.
export type UsuarioConPassword = {
  usuario: Usuario;
  passwordGenerada: string;
};

export type Grupo = {
  id: string;
  nombre: string;
  descripcion: string | null;
  createdAt: string;
};

export type EstadoEvaluacionInscripto = "PENDIENTE" | "EN_PROGRESO" | "EVALUADO";
export type ResultadoFinalInscripto = "PENDIENTE" | "ACEPTADO" | "RECHAZADO" | "LISTA_ESPERA";
export type EstadoPreseleccion = "PENDIENTE" | "APROBADO" | "RECHAZADO";
export type EstadoDocumentoPreseleccion = "CORRECTO" | "FALTANTE" | "INCORRECTO";

export type Inscripto = {
  id: string;
  uid: string;
  nombreCompleto: string;
  email: string | null;
  dni: string | null;
  grupoId: string | null;
  loteId: string | null;
  parId: string | null;
  estadoPreseleccion: EstadoPreseleccion;
  preseleccionObservacion: string | null;
  preseleccionAt: string | null;
  estadoEvaluacion: EstadoEvaluacionInscripto;
  resultadoFinal: ResultadoFinalInscripto;
  puntajeFinal: string | null;
  createdAt: string;
  lote: { id: string; nombre: string } | null;
  evaluaciones: {
    evaluadorId: string;
    puntajeTotal: string;
    evaluador: { nombre: string; apellido: string };
  }[];
};

export type EvaluadorResumen = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
};

export type EvaluadorDeGrupo = EvaluadorResumen & {
  rol: Rol;
  activo: boolean;
  agregadoAt: string;
  enPar: boolean;
};

export type LoteResumen = {
  id: string;
  nombre: string;
  createdAt: string;
  _count: { inscriptos: number };
};

export type ParEvaluadores = {
  id: string;
  grupoId: string;
  evaluador1Id: string;
  evaluador2Id: string;
  activo: boolean;
  evaluador1?: EvaluadorResumen;
  evaluador2?: EvaluadorResumen;
  lotes?: LoteResumen[];
  _count?: { lotes: number; inscriptos: number };
};

export type ResultadoParesAutomaticos = {
  creados: ParEvaluadores[];
  sinPareja: EvaluadorResumen | null;
};

export type ResultadoLote = {
  lote: { id: string; nombre: string };
  asignados: number;
  solicitados: number;
};

export type TipoDatoCampo =
  | "TEXTO"
  | "TEXTO_LARGO"
  | "NUMERO"
  | "FECHA"
  | "OPCION_UNICA"
  | "OPCION_MULTIPLE"
  | "BOOLEANO"
  | "URL";

export type RolEspecialCampo =
  | "NOMBRE_COMPLETO"
  | "EMAIL"
  | "DNI"
  | "TELEFONO"
  | "FECHA_NACIMIENTO"
  | "ZONA_GRUPO";

export type CampoFormulario = {
  id: string;
  clave: string;
  etiqueta: string;
  tipoDato: TipoDatoCampo;
  esIdentificatorio: boolean;
  esEvaluable: boolean;
  puntajeMaximo: string | null;
  rolEspecial: RolEspecialCampo | null;
  padreId: string | null;
  agrupador: string | null;
  etiquetaCorta: string | null;
  orden: number;
  activo: boolean;
};

export type AgrupacionCampo = {
  padreId?: string | null;
  agrupador?: string | null;
  etiquetaCorta?: string | null;
};

export type EstadoImportacion = "PENDIENTE" | "PROCESANDO" | "COMPLETADO" | "ERROR";

export type SugerenciaColumna =
  | { accion: "ignorar" }
  | ({ accion: "existente"; campoId: string; rolEspecial?: RolEspecialCampo } & AgrupacionCampo)
  | ({
      accion: "nueva";
      esIdentificatorio: boolean;
      esEvaluable: boolean;
      tipoDato?: TipoDatoCampo;
      rolEspecial?: RolEspecialCampo;
    } & AgrupacionCampo);

export type ColumnaImportacion = {
  nombre: string;
  muestra: unknown[];
  sugerencia: SugerenciaColumna;
};

export type VistaPreviaImportacion = {
  importacionId: string;
  hojasDisponibles: string[];
  hoja: string;
  columnas: ColumnaImportacion[];
  filasTotales: number;
  previewFilas: Record<string, unknown>[];
};

export type EntradaMapeo =
  | { accion: "ignorar"; nombreExcel: string }
  | ({ accion: "existente"; nombreExcel: string; campoId: string; rolEspecial?: RolEspecialCampo } & AgrupacionCampo)
  | {
      accion: "nueva";
      nombreExcel: string;
      campoNuevo: {
        etiqueta: string;
        tipoDato: TipoDatoCampo;
        esIdentificatorio?: boolean;
        esEvaluable?: boolean;
        puntajeMaximo?: number;
      } & AgrupacionCampo;
      rolEspecial?: RolEspecialCampo;
    };

export type ImportacionExcel = {
  id: string;
  archivoNombre: string;
  estado: EstadoImportacion;
  filasTotales: number;
  filasImportadas: number;
  filasError: number;
  logErrores: { fila: number; motivo: string }[] | null;
  createdAt: string;
  finishedAt: string | null;
};

// ---- Evaluador ----

export type StatsEvaluacion = {
  total: number;
  pendientes: number;
  aMedias: number;
  completadas: number;
  rechazadosPreseleccion: number;
};

export type MiGrupo = {
  id: string;
  nombre: string;
  descripcion: string | null;
  stats: StatsEvaluacion;
};

export type InscriptoAsignado = {
  id: string;
  uid: string;
  nombreCompleto: string;
  lote: string | null;
  estadoPreseleccion: EstadoPreseleccion;
  estadoGeneral: EstadoEvaluacionInscripto;
  miPuntaje: string | null;
  puntajeFinal: string | null;
};

export type PaginaAsignados = {
  items: InscriptoAsignado[];
  total: number;
  page: number;
  pageSize: number;
  stats: StatsEvaluacion;
};

export type DocumentoPreseleccion = {
  campoId: string;
  etiqueta: string;
  url: string | null;
  esFoto: boolean;
  estado: EstadoDocumentoPreseleccion | null;
  observacion: string | null;
};

export type GrupoRespuestas = {
  agrupador: string;
  campos: { campoId: string; etiqueta: string; valor: string }[];
};

export type CriterioEvaluacion = {
  campoId: string;
  etiqueta: string;
  puntajeMaximo: string;
  respuestaInscripto: string | null;
  grupos: GrupoRespuestas[];
  puntajeAsignado: string | null;
};

export type EvaluacionPropia = {
  inscripto: {
    id: string;
    uid: string;
    nombreCompleto: string;
    estadoEvaluacion: EstadoEvaluacionInscripto;
    puntajeFinal: string | null;
  };
  preseleccion: {
    estado: EstadoPreseleccion;
    observacion: string | null;
    por: { nombre: string; apellido: string } | null;
    at: string | null;
    documentos: DocumentoPreseleccion[];
  };
  evaluacion: { puntajeTotal: string; comentarioGeneral: string | null; fechaCompletada: string } | null;
  criterios: CriterioEvaluacion[];
  puntajeMaximoTotal: number;
  puedeEvaluar: boolean;
};

export type EvaluacionCompanero = {
  id: string;
  puntajeTotal: string;
  comentarioGeneral: string | null;
  evaluador: { nombre: string; apellido: string };
  detalles: {
    campoId: string;
    puntaje: string;
    comentario: string | null;
    campo: { etiqueta: string; orden: number };
  }[];
};
