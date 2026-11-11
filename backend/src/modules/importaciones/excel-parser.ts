import * as XLSX from "xlsx";

export type HojaParseada = {
  columnas: string[];
  filas: Record<string, unknown>[];
};

export function listarHojas(rutaArchivo: string): string[] {
  const workbook = XLSX.readFile(rutaArchivo, { cellDates: true });
  return workbook.SheetNames;
}

export function parsearHoja(rutaArchivo: string, nombreHoja: string): HojaParseada {
  const workbook = XLSX.readFile(rutaArchivo, { cellDates: true });
  const sheet = workbook.Sheets[nombreHoja];
  if (!sheet) {
    throw new Error(`La hoja "${nombreHoja}" no existe en el archivo`);
  }

  const filasCrudas = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
    blankrows: false,
  });

  if (filasCrudas.length === 0) {
    return { columnas: [], filas: [] };
  }

  const columnas = filasCrudas[0].map((valor) => String(valor ?? "").trim());
  const filas = filasCrudas.slice(1).map((fila) => {
    const obj: Record<string, unknown> = {};
    columnas.forEach((columna, indice) => {
      obj[columna] = fila[indice] ?? null;
    });
    return obj;
  });

  return { columnas, filas };
}

// Prefiere la versión más reciente del formulario ("Respuestas de formulario N" con N más alto);
// si no encuentra ese patrón, usa la primera hoja del archivo.
export function elegirHojaPorDefecto(hojas: string[]): string {
  const candidatas = hojas
    .map((nombre) => {
      const match = nombre.trim().match(/^respuestas de formulario (\d+)$/i);
      return match ? { nombre, version: Number(match[1]) } : null;
    })
    .filter((valor): valor is { nombre: string; version: number } => valor !== null);

  if (candidatas.length > 0) {
    candidatas.sort((a, b) => b.version - a.version);
    return candidatas[0].nombre;
  }

  return hojas[0];
}
