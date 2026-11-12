import type { Rol, RolEspecialCampo, TipoDatoCampo } from "../types";

export const ETIQUETA_ROL: Record<Rol, string> = {
  SUPERADMIN: "Superadmin",
  ADMIN_GRUPO: "Admin de grupo",
  EVALUADOR: "Evaluador",
};

export const ETIQUETA_TIPO_DATO: Record<TipoDatoCampo, string> = {
  TEXTO: "Texto",
  TEXTO_LARGO: "Texto largo",
  NUMERO: "Número",
  FECHA: "Fecha",
  OPCION_UNICA: "Opción única",
  OPCION_MULTIPLE: "Opción múltiple",
  BOOLEANO: "Sí/No",
  URL: "Link / archivo (URL)",
};

export const ETIQUETA_ROL_ESPECIAL: Record<RolEspecialCampo, string> = {
  NOMBRE_COMPLETO: "Nombre completo",
  EMAIL: "Email",
  DNI: "DNI",
  TELEFONO: "Teléfono",
  FECHA_NACIMIENTO: "Fecha de nacimiento",
  ZONA_GRUPO: "Zona → Grupo",
};

export function nombreCompleto(persona: { nombre: string; apellido: string }) {
  return `${persona.nombre} ${persona.apellido}`.trim();
}

export function formatearFecha(valor: string | null | undefined) {
  if (!valor) return "";
  return new Date(valor).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}
