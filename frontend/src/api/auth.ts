import { apiClient } from "./client";
import type { Usuario } from "../types";

export async function cambiarPassword(data: { passwordActual: string; passwordNueva: string }) {
  const res = await apiClient.post<Usuario>("/auth/cambiar-password", data);
  return res.data;
}
