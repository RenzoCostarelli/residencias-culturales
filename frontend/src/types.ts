export type Rol = "SUPERADMIN" | "ADMIN_GRUPO" | "EVALUADOR";

export type Usuario = {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: Rol;
  activo?: boolean;
  createdAt?: string;
};

export type Grupo = {
  id: string;
  nombre: string;
  descripcion: string | null;
  createdAt: string;
};

export type EstadoEvaluacionInscripto = "PENDIENTE" | "EN_PROGRESO" | "EVALUADO";
export type ResultadoFinalInscripto = "PENDIENTE" | "ACEPTADO" | "RECHAZADO" | "LISTA_ESPERA";

export type Inscripto = {
  id: string;
  uid: string;
  nombreCompleto: string;
  email: string | null;
  dni: string | null;
  grupoId: string | null;
  loteId: string | null;
  parId: string | null;
  estadoEvaluacion: EstadoEvaluacionInscripto;
  resultadoFinal: ResultadoFinalInscripto;
  puntajeFinal: string | null;
  createdAt: string;
};

export type EvaluadorResumen = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
};

export type ParEvaluadores = {
  id: string;
  grupoId: string;
  evaluador1Id: string;
  evaluador2Id: string;
  activo: boolean;
  evaluador1?: EvaluadorResumen;
  evaluador2?: EvaluadorResumen;
  _count?: { lotes: number; inscriptos: number };
};

export type Lote = {
  id: string;
  grupoId: string;
  nombre: string;
  parId: string | null;
  par?: ParEvaluadores | null;
  _count?: { inscriptos: number };
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
  orden: number;
  activo: boolean;
};

export type EstadoImportacion = "PENDIENTE" | "PROCESANDO" | "COMPLETADO" | "ERROR";

export type SugerenciaColumna =
  | { accion: "ignorar" }
  | { accion: "existente"; campoId: string; rolEspecial?: RolEspecialCampo }
  | {
      accion: "nueva";
      esIdentificatorio: boolean;
      esEvaluable: boolean;
      tipoDato?: TipoDatoCampo;
      rolEspecial?: RolEspecialCampo;
    };

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
  | { accion: "existente"; nombreExcel: string; campoId: string; rolEspecial?: RolEspecialCampo }
  | {
      accion: "nueva";
      nombreExcel: string;
      campoNuevo: {
        etiqueta: string;
        tipoDato: TipoDatoCampo;
        esIdentificatorio?: boolean;
        esEvaluable?: boolean;
        puntajeMaximo?: number;
      };
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

export type EstadoEvaluacion = "BORRADOR" | "COMPLETA";

export type InscriptoAsignado = {
  id: string;
  uid: string;
  nombreCompleto: string;
  estadoGeneral: EstadoEvaluacionInscripto;
  miEvaluacion: { estado: EstadoEvaluacion; puntajeTotal: string | null } | null;
};

export type CriterioEvaluacion = {
  campoId: string;
  etiqueta: string;
  puntajeMaximo: string;
  respuestaInscripto: string | null;
  puntajeAsignado: string | null;
  comentario: string | null;
};

export type EvaluacionCompanero = {
  id: string;
  puntajeTotal: string | null;
  comentarioGeneral: string | null;
  detalles: {
    campoId: string;
    puntaje: string;
    comentario: string | null;
    campo: { etiqueta: string };
  }[];
};

export type DocumentoInscripto = {
  campoId: string;
  etiqueta: string;
  url: string;
  esFoto: boolean;
};

export type EvaluacionPropia = {
  inscripto: { id: string; uid: string; nombreCompleto: string };
  estado: EstadoEvaluacion;
  puntajeTotal: string | null;
  comentarioGeneral: string | null;
  criterios: CriterioEvaluacion[];
  documentos: DocumentoInscripto[];
};
