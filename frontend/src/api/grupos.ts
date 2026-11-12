import { apiClient } from "./client";
import type {
  EvaluadorDeGrupo,
  Grupo,
  GrupoConStats,
  Inscripto,
  ParEvaluadores,
  ResultadoLote,
  ResultadoParesAutomaticos,
} from "../types";

export async function listarGrupos() {
  const res = await apiClient.get<GrupoConStats[]>("/grupos");
  return res.data;
}

export async function crearGrupo(data: { nombre: string; descripcion?: string }) {
  const res = await apiClient.post<Grupo>("/grupos", data);
  return res.data;
}

export async function actualizarGrupo(id: string, data: { nombre?: string; descripcion?: string }) {
  const res = await apiClient.patch<Grupo>(`/grupos/${id}`, data);
  return res.data;
}

export async function agregarAdministrador(grupoId: string, usuarioId: string) {
  await apiClient.post(`/grupos/${grupoId}/administradores`, { usuarioId });
}

export async function quitarAdministrador(grupoId: string, usuarioId: string) {
  await apiClient.delete(`/grupos/${grupoId}/administradores/${usuarioId}`);
}

// ---- Evaluadores del grupo ----

export async function listarEvaluadores(grupoId: string) {
  const res = await apiClient.get<EvaluadorDeGrupo[]>(`/grupos/${grupoId}/evaluadores`);
  return res.data;
}

export async function agregarEvaluador(grupoId: string, usuarioId: string) {
  await apiClient.post(`/grupos/${grupoId}/evaluadores`, { usuarioId });
}

export async function quitarEvaluador(grupoId: string, usuarioId: string) {
  await apiClient.delete(`/grupos/${grupoId}/evaluadores/${usuarioId}`);
}

// ---- Pares y lotes ----

export async function listarPares(grupoId: string) {
  const res = await apiClient.get<ParEvaluadores[]>(`/grupos/${grupoId}/pares`);
  return res.data;
}

export async function crearPar(grupoId: string, data: { evaluador1Id: string; evaluador2Id: string }) {
  const res = await apiClient.post<ParEvaluadores>(`/grupos/${grupoId}/pares`, data);
  return res.data;
}

export async function crearParesAutomaticos(grupoId: string) {
  const res = await apiClient.post<ResultadoParesAutomaticos>(`/grupos/${grupoId}/pares/automaticos`);
  return res.data;
}

export async function actualizarPar(parId: string, data: { activo: boolean }) {
  const res = await apiClient.patch<ParEvaluadores>(`/pares/${parId}`, data);
  return res.data;
}

export async function crearLoteParaPar(parId: string, cantidad: 10 | 20 | 30) {
  const res = await apiClient.post<ResultadoLote>(`/pares/${parId}/lotes`, { cantidad });
  return res.data;
}

// ---- Inscriptos ----

export async function listarInscriptosDeGrupo(grupoId: string) {
  const res = await apiClient.get<Inscripto[]>(`/grupos/${grupoId}/inscriptos`);
  return res.data;
}

export async function listarInscriptosSinGrupo() {
  const res = await apiClient.get<Inscripto[]>("/inscriptos/sin-grupo");
  return res.data;
}

export async function asignarGrupoAInscripto(inscriptoId: string, grupoId: string | null) {
  const res = await apiClient.patch<Inscripto>(`/inscriptos/${inscriptoId}/asignar-grupo`, { grupoId });
  return res.data;
}

export async function asignarGrupoALote(inscriptoIds: string[], grupoId: string) {
  const res = await apiClient.post<{ actualizados: number }>("/inscriptos/asignar-grupo-lote", {
    inscriptoIds,
    grupoId,
  });
  return res.data;
}

export async function fijarResultadoFinal(
  inscriptoId: string,
  resultadoFinal: Inscripto["resultadoFinal"],
) {
  const res = await apiClient.patch<Inscripto>(`/inscriptos/${inscriptoId}/resultado-final`, {
    resultadoFinal,
  });
  return res.data;
}

export async function reabrirPreseleccion(inscriptoId: string) {
  const res = await apiClient.patch<Inscripto>(`/inscriptos/${inscriptoId}/preseleccion/reabrir`);
  return res.data;
}
