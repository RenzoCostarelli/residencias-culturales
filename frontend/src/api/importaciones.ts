import { apiClient } from "./client";
import type { EntradaMapeo, ImportacionExcel, VistaPreviaImportacion } from "../types";

export async function subirExcel(archivo: File) {
  const form = new FormData();
  form.append("archivo", archivo);
  const res = await apiClient.post<VistaPreviaImportacion>("/importaciones/excel", form);
  return res.data;
}

export async function cambiarHoja(importacionId: string, hoja: string) {
  const res = await apiClient.patch<VistaPreviaImportacion>(`/importaciones/${importacionId}/hoja`, {
    hoja,
  });
  return res.data;
}

export async function guardarMapeo(importacionId: string, columnas: EntradaMapeo[]) {
  const res = await apiClient.post(`/importaciones/${importacionId}/mapeo`, { columnas });
  return res.data;
}

export async function confirmarImportacion(importacionId: string) {
  const res = await apiClient.post<ImportacionExcel>(`/importaciones/${importacionId}/confirmar`);
  return res.data;
}

export async function listarImportaciones() {
  const res = await apiClient.get<ImportacionExcel[]>("/importaciones");
  return res.data;
}
