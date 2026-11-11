// Fechas de Google Forms exportadas a Excel: casi siempre texto "D/M/AAAA" o "DD/MM/AAAA".
export function parseFecha(valor: unknown): Date | null {
  if (valor == null || valor === "") {
    return null;
  }

  if (valor instanceof Date) {
    return Number.isNaN(valor.getTime()) ? null : valor;
  }

  if (typeof valor === "number") {
    // Número de serie de fecha de Excel (días desde 1899-12-30).
    const ms = (valor - 25569) * 86400 * 1000;
    const fecha = new Date(ms);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }

  const texto = String(valor).trim();
  const match = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) {
    return null;
  }

  const [, diaStr, mesStr, anioStr] = match;
  const dia = Number(diaStr);
  const mes = Number(mesStr);
  const anio = Number(anioStr);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));

  const esValida =
    fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;

  return esValida ? fecha : null;
}
