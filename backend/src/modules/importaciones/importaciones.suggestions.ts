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

function primeraLinea(texto: string): string {
  return (texto.split("\n")[0] ?? "").trim();
}

function sinAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Forma canónica para comparar encabezados del Excel con etiquetas de campos: los nombres cambian
// entre exportaciones ("2.4.1 Oficios\n¿Qué...", "Oficios", "3. MOTIVACIÓN PERSONAL" vs "3 Motivación Personal").
// Se queda con la primera línea, sin acentos, en minúsculas y sin el prefijo numérico de sección.
export function normalizarEtiqueta(texto: string): string {
  return sinAcentos(primeraLinea(texto))
    .toLowerCase()
    .replace(/^\d+(\.\d+)*\.?\s*/, "")
    .replace(/\s+/g, " ")
    .replace(/[\s.:;,\-–]+$/g, "")
    .trim();
}

export type SugerenciaAgrupacion = {
  // clave del criterio evaluable (seed de la rúbrica) bajo el que se agrupa la columna
  padreClave: string;
  agrupador: string;
  etiquetaCorta: string;
};

const RE_EXPERIENCIA = /^experiencia\s+(\d+)\s*-\s*(.+)$/i;
const RE_EXPERIENCIA_GRUPOS = /^(?:experiencia con grupos|exp\.?\s*grupos)\s+(\d+)\s*-\s*(.+)$/i;

const FORMACION: { patron: RegExp; agrupador: string }[] = [
  { patron: /^titulo secundario/, agrupador: "Secundario" },
  { patron: /^escuela secundaria/, agrupador: "Secundario" },
  { patron: /^localidad.*escuela/, agrupador: "Secundario" },
  { patron: /^estudios terciarios/, agrupador: "Terciario / Universitario" },
  { patron: /^institucion.*(terciaria|universitaria)/, agrupador: "Terciario / Universitario" },
  { patron: /(cantidad de materias|materias\s*\/\s*titulo|titulo obtenido)/, agrupador: "Terciario / Universitario" },
];

// Detecta las columnas que el formulario reparte en varias preguntas pero que la rúbrica evalúa
// como un solo criterio: "Experiencia 1 - Lugar" → 2.2 Experiencia laboral, agrupador "Experiencia 1";
// "Experiencia con Grupos 2 - Tareas" / "Exp. Grupos 3 - Lugar" → 2.3 Experiencia con grupos;
// "Título Secundario", "Estudios Terciarios/Univ." → 2.1 Formación.
export function sugerirAgrupacion(nombreColumna: string): SugerenciaAgrupacion | undefined {
  const primera = primeraLinea(nombreColumna);

  const experiencia = primera.match(RE_EXPERIENCIA);
  if (experiencia) {
    return {
      padreClave: "experiencia_laboral",
      agrupador: `Experiencia ${experiencia[1]}`,
      etiquetaCorta: experiencia[2].trim(),
    };
  }

  const grupos = primera.match(RE_EXPERIENCIA_GRUPOS);
  if (grupos) {
    return {
      padreClave: "experiencia_grupos",
      agrupador: `Experiencia con grupos ${grupos[1]}`,
      etiquetaCorta: grupos[2].trim(),
    };
  }

  const canonica = sinAcentos(primera).toLowerCase();
  const formacion = FORMACION.find((f) => f.patron.test(canonica));
  if (formacion) {
    return { padreClave: "formacion_academica", agrupador: formacion.agrupador, etiquetaCorta: primera };
  }

  return undefined;
}
