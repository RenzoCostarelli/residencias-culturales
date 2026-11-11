import { apiClient } from "./client";
import type { Rol, Usuario } from "../types";

export async function listarUsuarios(params?: { rol?: Rol; activo?: boolean }) {
  const res = await apiClient.get<Usuario[]>("/usuarios", { params });
  return res.data;
}

export async function crearUsuario(data: {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  rol: Rol;
}) {
  const res = await apiClient.post<Usuario>("/usuarios", data);
  return res.data;
}

export async function actualizarUsuario(
  id: string,
  data: Partial<{ nombre: string; apellido: string; rol: Rol; activo: boolean; password: string }>,
) {
  const res = await apiClient.patch<Usuario>(`/usuarios/${id}`, data);
  return res.data;
}
