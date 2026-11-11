import type { RolEspecialCampo } from "../../shared/prisma";

// Encabezados conocidos del formulario (distintas versiones a lo largo del tiempo).
// Si el formulario vuelve a cambiar de redacción, el admin simplemente elige el rol a mano
// en el paso de mapeo — esto solo evita tener que hacerlo siempre a mano.
const ROL_POR_ETIQUETA: Record<string, RolEspecialCampo> = {
  // Encabezados definitivos (confirmados 2026-11-06)
  "nombre y apellido": "NOMBRE_COMPLETO",
  dni: "DNI",
  email: "EMAIL",
  "teléfono celular": "TELEFONO",
  "telefono celular": "TELEFONO",
  "fecha nacimiento": "FECHA_NACIMIENTO",
  zona: "ZONA_GRUPO",

  // Redacciones anteriores (hojas viejas del mismo form)
  "nombre y apellido (como figura en el dni)": "NOMBRE_COMPLETO",
  "dni (sin puntos)": "DNI",
  "correo electrónico": "EMAIL",
  "correo electronico": "EMAIL",
  "teléfono celular personal": "TELEFONO",
  "telefono celular personal": "TELEFONO",
  "fecha de nacimiento": "FECHA_NACIMIENTO",
};

export function sugerirRolEspecial(nombreColumna: string): RolEspecialCampo | undefined {
  return ROL_POR_ETIQUETA[nombreColumna.trim().toLowerCase()];
}

export function esColumnaDeVerificacion(nombreColumna: string): boolean {
  return /verificaci[oó]n/i.test(nombreColumna);
}
