import { apiClient } from "./client";
import type { EvaluacionCompanero, EvaluacionPropia, InscriptoAsignado } from "../types";

export async function listarAsignados() {
  const res = await apiClient.get<InscriptoAsignado[]>("/evaluaciones/asignados");
  return res.data;
}

export async function obtenerEvaluacionPropia(inscriptoId: string) {
  const res = await apiClient.get<EvaluacionPropia>(`/evaluaciones/${inscriptoId}/mia`);
  return res.data;
}

export async function guardarBorrador(
  inscriptoId: string,
  data: {
    puntajes: { campoId: string; puntaje: number; comentario?: string }[];
    comentarioGeneral?: string;
  },
) {
  const res = await apiClient.put(`/evaluaciones/${inscriptoId}/mia`, data);
  return res.data;
}

export async function completarEvaluacion(inscriptoId: string) {
  const res = await apiClient.post(`/evaluaciones/${inscriptoId}/mia/completar`);
  return res.data;
}

export async function obtenerEvaluacionCompanero(inscriptoId: string) {
  const res = await apiClient.get<EvaluacionCompanero>(`/evaluaciones/${inscriptoId}/companero`);
  return res.data;
}
