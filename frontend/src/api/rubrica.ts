import { apiClient } from "./client";
import type { CampoFormulario, RolEspecialCampo, TipoDatoCampo } from "../types";

export async function listarCampos() {
  const res = await apiClient.get<{
    campos: CampoFormulario[];
    sumaEvaluable: number;
    esValida: boolean;
  }>("/rubrica/campos");
  return res.data;
}

export async function crearCampo(data: {
  clave?: string;
  etiqueta: string;
  tipoDato: TipoDatoCampo;
  esIdentificatorio?: boolean;
  esEvaluable?: boolean;
  puntajeMaximo?: number;
  rolEspecial?: RolEspecialCampo;
  orden?: number;
}) {
  const res = await apiClient.post<CampoFormulario>("/rubrica/campos", data);
  return res.data;
}

export async function actualizarCampo(
  id: string,
  data: Partial<{
    etiqueta: string;
    puntajeMaximo: number | null;
    esEvaluable: boolean;
    esIdentificatorio: boolean;
    activo: boolean;
    orden: number;
  }>,
) {
  const res = await apiClient.patch<CampoFormulario>(`/rubrica/campos/${id}`, data);
  return res.data;
}
