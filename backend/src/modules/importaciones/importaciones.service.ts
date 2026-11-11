import crypto from "crypto";
import fs from "fs";
import path from "path";
import { AppError } from "../../shared/errors";
import { Prisma, prisma, type RolEspecialCampo } from "../../shared/prisma";
import { parseFecha } from "../../shared/utils/fecha";
import { generarUid } from "../../shared/utils/uid";
import { crearCampo } from "../rubrica/rubrica.service";
import { elegirHojaPorDefecto, listarHojas, parsearHoja } from "./excel-parser";
import { esColumnaDeVerificacion, sugerirRolEspecial } from "./importaciones.suggestions";
import type { EntradaMapeo } from "./importaciones.schemas";

export const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const PREVIEW_FILAS = 5;

type EntradaMapeoResuelta = {
  nombreExcel: string;
  campoId: string;
  rolEspecial: RolEspecialCampo | null;
};

function hashArchivo(rutaArchivo: string): string {
  const buffer = fs.readFileSync(rutaArchivo);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function construirVistaPrevia(rutaArchivo: string, hoja: string) {
  const { columnas, filas } = parsearHoja(rutaArchivo, hoja);
  const camposExistentes = await prisma.campoFormulario.findMany();
  const porEtiqueta = new Map(camposExistentes.map((campo) => [campo.etiqueta.trim().toLowerCase(), campo]));
  const rolesYaAsignados = new Set(camposExistentes.map((campo) => campo.rolEspecial).filter(Boolean));

  const columnasInfo = columnas.map((nombre) => {
    const muestra = filas.slice(0, PREVIEW_FILAS).map((fila) => fila[nombre]);

    if (esColumnaDeVerificacion(nombre)) {
      return { nombre, muestra, sugerencia: { accion: "ignorar" as const } };
    }

    // Algunas columnas del excel repiten la etiqueta corta de la pregunta en la primera línea
    // y agregan la consigna completa después de un salto de línea (ej. "2.4.1 Oficios\n¿Qué...").
    const primeraLinea = nombre.split("\n")[0]?.trim().toLowerCase() ?? "";
    const existente = porEtiqueta.get(nombre.trim().toLowerCase()) ?? porEtiqueta.get(primeraLinea);
    if (existente) {
      return {
        nombre,
        muestra,
        sugerencia: {
          accion: "existente" as const,
          campoId: existente.id,
          rolEspecial: existente.rolEspecial ?? undefined,
        },
      };
    }

    const rol = sugerirRolEspecial(nombre);
    const rolLibre = rol && !rolesYaAsignados.has(rol) ? rol : undefined;

    // Si las respuestas de muestra son links (típicamente a Google Drive: foto, DNI, título, legajo),
    // conviene que el campo nuevo arranque como URL en vez de texto plano.
    const pareceUrl = muestra.some(
      (valor) => typeof valor === "string" && /^https?:\/\//i.test(valor.trim()),
    );

    return {
      nombre,
      muestra,
      sugerencia: {
        accion: "nueva" as const,
        esIdentificatorio: true,
        esEvaluable: false,
        tipoDato: pareceUrl ? ("URL" as const) : undefined,
        rolEspecial: rolLibre,
      },
    };
  });

  return {
    hoja,
    columnas: columnasInfo,
    filasTotales: filas.length,
    previewFilas: filas.slice(0, PREVIEW_FILAS),
  };
}

export async function iniciarImportacion(
  archivo: { path: string; originalname: string },
  importadoPorId: string,
) {
  const hojas = listarHojas(archivo.path);
  if (hojas.length === 0) {
    throw new AppError(400, "El archivo no tiene hojas con datos");
  }

  const hoja = elegirHojaPorDefecto(hojas);
  const vistaPrevia = await construirVistaPrevia(archivo.path, hoja);

  const importacion = await prisma.importacionExcel.create({
    data: {
      archivoNombre: archivo.originalname,
      archivoHash: hashArchivo(archivo.path),
      rutaArchivo: archivo.path,
      hojaSeleccionada: hoja,
      filasTotales: vistaPrevia.filasTotales,
      importadoPorId,
    },
  });

  return { importacionId: importacion.id, hojasDisponibles: hojas, ...vistaPrevia };
}

export async function cambiarHoja(importacionId: string, hoja: string) {
  const importacion = await obtenerImportacion(importacionId);
  if (importacion.estado !== "PENDIENTE") {
    throw new AppError(409, "Esta importación ya fue procesada");
  }
  if (!importacion.rutaArchivo) {
    throw new AppError(409, "El archivo original ya no está disponible");
  }

  const hojas = listarHojas(importacion.rutaArchivo);
  if (!hojas.includes(hoja)) {
    throw new AppError(400, "Esa hoja no existe en el archivo");
  }

  const vistaPrevia = await construirVistaPrevia(importacion.rutaArchivo, hoja);

  await prisma.importacionExcel.update({
    where: { id: importacionId },
    data: { hojaSeleccionada: hoja, filasTotales: vistaPrevia.filasTotales, mapeoColumnas: Prisma.JsonNull },
  });

  return { importacionId, hojasDisponibles: hojas, ...vistaPrevia };
}

export async function guardarMapeo(importacionId: string, entradas: EntradaMapeo[]) {
  const importacion = await obtenerImportacion(importacionId);
  if (importacion.estado !== "PENDIENTE") {
    throw new AppError(409, "Esta importación ya fue procesada");
  }

  const resueltas: EntradaMapeoResuelta[] = [];

  for (const entrada of entradas) {
    if (entrada.accion === "ignorar") {
      continue;
    }

    let campoId: string;

    if (entrada.accion === "existente") {
      const campo = await prisma.campoFormulario.findUnique({ where: { id: entrada.campoId } });
      if (!campo) {
        throw new AppError(404, `Campo no encontrado para la columna "${entrada.nombreExcel}"`);
      }
      campoId = campo.id;

      if (entrada.rolEspecial) {
        await prisma.campoFormulario.updateMany({
          where: { rolEspecial: entrada.rolEspecial },
          data: { rolEspecial: null },
        });
        await prisma.campoFormulario.update({
          where: { id: campoId },
          data: { rolEspecial: entrada.rolEspecial },
        });
      }
    } else {
      const nuevo = await crearCampo({ ...entrada.campoNuevo, rolEspecial: entrada.rolEspecial });
      campoId = nuevo.id;
    }

    resueltas.push({ nombreExcel: entrada.nombreExcel, campoId, rolEspecial: entrada.rolEspecial ?? null });
  }

  await prisma.importacionExcel.update({
    where: { id: importacionId },
    data: { mapeoColumnas: resueltas as unknown as Prisma.InputJsonValue },
  });

  return resueltas;
}

export async function confirmarImportacion(importacionId: string) {
  const importacion = await obtenerImportacion(importacionId);

  if (importacion.estado !== "PENDIENTE") {
    throw new AppError(409, "Esta importación ya fue procesada");
  }
  if (!importacion.rutaArchivo || !importacion.hojaSeleccionada) {
    throw new AppError(409, "Falta el archivo o la hoja seleccionada");
  }
  if (!importacion.mapeoColumnas) {
    throw new AppError(409, "Primero hay que guardar el mapeo de columnas");
  }

  const mapeo = importacion.mapeoColumnas as unknown as EntradaMapeoResuelta[];

  const camposPorNombre = new Map(mapeo.map((entrada) => [entrada.nombreExcel, entrada]));
  const camposIds = [...new Set(mapeo.map((entrada) => entrada.campoId))];
  const campos = await prisma.campoFormulario.findMany({ where: { id: { in: camposIds } } });
  const campoPorId = new Map(campos.map((campo) => [campo.id, campo]));

  // El rol especial que cuenta es el que tiene el campo en la base (fuente de verdad),
  // no lo que haya quedado guardado en el mapeo de esta importación puntual.
  const tieneNombreCompleto = campos.some((campo) => campo.rolEspecial === "NOMBRE_COMPLETO");
  if (!tieneNombreCompleto) {
    throw new AppError(400, 'Hay que mapear una columna con el rol "Nombre completo" antes de confirmar');
  }

  const { filas } = parsearHoja(importacion.rutaArchivo, importacion.hojaSeleccionada);

  await prisma.importacionExcel.update({ where: { id: importacionId }, data: { estado: "PROCESANDO" } });

  const logErrores: { fila: number; motivo: string }[] = [];
  let importadas = 0;

  try {
    await prisma.$transaction(
      async (tx) => {
        for (let i = 0; i < filas.length; i += 1) {
          const fila = filas[i];
          const numeroFila = i + 2; // fila 1 = encabezado

          const datosPorRol: Partial<Record<RolEspecialCampo, unknown>> = {};
          for (const [nombreExcel, valor] of Object.entries(fila)) {
            const entrada = camposPorNombre.get(nombreExcel);
            const campo = entrada ? campoPorId.get(entrada.campoId) : undefined;
            if (campo?.rolEspecial) {
              datosPorRol[campo.rolEspecial] = valor;
            }
          }

          const nombreCompleto = String(datosPorRol.NOMBRE_COMPLETO ?? "").trim();
          if (!nombreCompleto) {
            logErrores.push({ fila: numeroFila, motivo: "Sin nombre completo, fila omitida" });
            continue;
          }

          const dniValor =
            datosPorRol.DNI != null && String(datosPorRol.DNI).trim() !== ""
              ? String(datosPorRol.DNI).trim()
              : null;

          if (dniValor) {
            const yaExiste = await tx.inscripto.findUnique({ where: { dni: dniValor } });
            if (yaExiste) {
              logErrores.push({ fila: numeroFila, motivo: `DNI ${dniValor} ya estaba importado, fila omitida` });
              continue;
            }
          }

          let grupoId: string | null = null;
          const zonaValor =
            datosPorRol.ZONA_GRUPO != null && String(datosPorRol.ZONA_GRUPO).trim() !== ""
              ? String(datosPorRol.ZONA_GRUPO).trim()
              : null;

          if (zonaValor) {
            const grupo = await tx.grupo.findFirst({
              where: { nombre: { equals: zonaValor, mode: "insensitive" } },
            });
            if (grupo) {
              grupoId = grupo.id;
            } else {
              logErrores.push({
                fila: numeroFila,
                motivo: `Zona "${zonaValor}" no coincide con ningún grupo existente, quedó sin asignar`,
              });
            }
          }

          const inscripto = await tx.inscripto.create({
            data: {
              uid: generarUid(),
              nombreCompleto,
              email: datosPorRol.EMAIL ? String(datosPorRol.EMAIL).trim() : null,
              dni: dniValor,
              telefono: datosPorRol.TELEFONO ? String(datosPorRol.TELEFONO).trim() : null,
              fechaNacimiento: parseFecha(datosPorRol.FECHA_NACIMIENTO),
              grupoId,
              importacionId,
            },
          });

          const respuestas = Object.entries(fila)
            .filter(([nombreExcel, valor]) => {
              if (!camposPorNombre.has(nombreExcel)) return false;
              return valor != null && String(valor).trim() !== "";
            })
            .map(([nombreExcel, valor]) => ({
              inscriptoId: inscripto.id,
              campoId: camposPorNombre.get(nombreExcel)!.campoId,
              valorTexto: String(valor),
            }));

          if (respuestas.length > 0) {
            await tx.respuestaInscripto.createMany({ data: respuestas });
          }

          importadas += 1;
        }
      },
      { timeout: 120_000 },
    );

    return await prisma.importacionExcel.update({
      where: { id: importacionId },
      data: {
        estado: "COMPLETADO",
        filasImportadas: importadas,
        filasError: logErrores.length,
        logErrores: logErrores as unknown as Prisma.InputJsonValue,
        finishedAt: new Date(),
      },
    });
  } catch (err) {
    await prisma.importacionExcel.update({
      where: { id: importacionId },
      data: {
        estado: "ERROR",
        logErrores: [{ fila: 0, motivo: err instanceof Error ? err.message : String(err) }],
        finishedAt: new Date(),
      },
    });
    throw err;
  }
}

export async function listarImportaciones() {
  return prisma.importacionExcel.findMany({ orderBy: { createdAt: "desc" } });
}

export async function obtenerImportacion(id: string) {
  const importacion = await prisma.importacionExcel.findUnique({ where: { id } });
  if (!importacion) {
    throw new AppError(404, "Importación no encontrada");
  }
  return importacion;
}
