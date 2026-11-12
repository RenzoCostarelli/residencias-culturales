import { apiClient } from "./client";
import type { Rol, Usuario, UsuarioConPassword } from "../types";

export async function listarUsuarios(params?: { rol?: Rol; activo?: boolean }) {
  const res = await apiClient.get<Usuario[]>("/usuarios", { params });
  return res.data;
}

// La contraseña la genera el backend y vuelve en claro una única vez.
export async function crearUsuario(data: { email: string; nombre: string; apellido: string; rol: Rol }) {
  const res = await apiClient.post<UsuarioConPassword>("/usuarios", data);
  return res.data;
}

export async function restablecerPassword(id: string) {
  const res = await apiClient.post<UsuarioConPassword>(`/usuarios/${id}/restablecer-password`);
  return res.data;
}

export async function actualizarUsuario(
  id: string,
  data: Partial<{ nombre: string; apellido: string; rol: Rol; activo: boolean }>,
) {
  const res = await apiClient.patch<Usuario>(`/usuarios/${id}`, data);
  return res.data;
}
