import { apiClient } from "./client";
import type {
  EstadoDocumentoPreseleccion,
  EvaluacionCompanero,
  EvaluacionPropia,
  MiGrupo,
  PaginaAsignados,
} from "../types";

export async function listarMisGrupos() {
  const res = await apiClient.get<MiGrupo[]>("/evaluaciones/mis-grupos");
  return res.data;
}

export async function listarAsignados(params: { grupoId?: string; page: number; pageSize: number }) {
  const res = await apiClient.get<PaginaAsignados>("/evaluaciones/asignados", { params });
  return res.data;
}

export async function obtenerEvaluacionPropia(inscriptoId: string) {
  const res = await apiClient.get<EvaluacionPropia>(`/evaluaciones/${inscriptoId}/mia`);
  return res.data;
}

export async function enviarPreseleccion(
  inscriptoId: string,
  data: {
    documentos: { campoId: string; estado: EstadoDocumentoPreseleccion; observacion?: string }[];
    resultado: "APROBADO" | "RECHAZADO";
    observacion?: string;
  },
) {
  const res = await apiClient.post(`/evaluaciones/${inscriptoId}/preseleccion`, data);
  return res.data;
}

// Envío único y definitivo: no hay borradores.
export async function enviarEvaluacion(
  inscriptoId: string,
  data: { puntajes: { campoId: string; puntaje: number }[]; comentarioGeneral?: string },
) {
  const res = await apiClient.post(`/evaluaciones/${inscriptoId}/mia`, data);
  return res.data;
}

export async function obtenerEvaluacionCompanero(inscriptoId: string) {
  const res = await apiClient.get<EvaluacionCompanero>(`/evaluaciones/${inscriptoId}/companero`);
  return res.data;
}
