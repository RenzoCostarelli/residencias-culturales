import { AppError } from "../../shared/errors";
import {
  prisma,
  type CampoFormulario,
  type EstadoDocumentoPreseleccion,
  type EstadoPreseleccion,
  type Prisma,
} from "../../shared/prisma";
import { calcularStatsGrupo } from "../grupos/grupos.service";

type ParBasico = { evaluador1Id: string; evaluador2Id: string };

function asegurarEsIntegrante(par: ParBasico, evaluadorId: string) {
  if (par.evaluador1Id !== evaluadorId && par.evaluador2Id !== evaluadorId) {
    throw new AppError(403, "No sos uno de los evaluadores asignados a este inscripto");
  }
}

function otroIntegrante(par: ParBasico, evaluadorId: string) {
  return par.evaluador1Id === evaluadorId ? par.evaluador2Id : par.evaluador1Id;
}

async function obtenerInscriptoAsignado(evaluadorId: string, inscriptoId: string) {
  const inscripto = await prisma.inscripto.findUnique({
    where: { id: inscriptoId },
    include: { par: true },
  });
  if (!inscripto) {
    throw new AppError(404, "Inscripto no encontrado");
  }
  if (!inscripto.par) {
    throw new AppError(409, "Este inscripto todavía no fue asignado a un par de evaluadores");
  }
  asegurarEsIntegrante(inscripto.par, evaluadorId);
  return { inscripto, par: inscripto.par };
}

function paresActivosDe(evaluadorId: string, grupoId?: string) {
  return prisma.parEvaluadores.findMany({
    where: {
      activo: true,
      OR: [{ evaluador1Id: evaluadorId }, { evaluador2Id: evaluadorId }],
      ...(grupoId ? { grupoId } : {}),
    },
    select: { id: true, grupoId: true },
  });
}

export type StatsEvaluacion = {
  total: number;
  pendientes: number;
  aMedias: number;
  completadas: number;
};

// Evaluación y preselección están completamente separadas: esto solo mira inscriptos con
// preselección APROBADA (los únicos habilitados para evaluar). Pendiente = nadie envió; a medias =
// un solo evaluador envió; completada = ambos.
async function calcularStats(parIds: string[]): Promise<StatsEvaluacion> {
  const stats: StatsEvaluacion = { total: 0, pendientes: 0, aMedias: 0, completadas: 0 };
  if (parIds.length === 0) return stats;

  const filas = await prisma.inscripto.groupBy({
    by: ["estadoEvaluacion"],
    where: { parId: { in: parIds }, estadoPreseleccion: "APROBADO" },
    _count: { _all: true },
  });

  for (const fila of filas) {
    const cantidad = fila._count._all;
    stats.total += cantidad;
    if (fila.estadoEvaluacion === "EVALUADO") {
      stats.completadas += cantidad;
    } else if (fila.estadoEvaluacion === "EN_PROGRESO") {
      stats.aMedias += cantidad;
    } else {
      stats.pendientes += cantidad;
    }
  }

  return stats;
}

export type StatsPreseleccion = {
  total: number;
  pendientes: number;
  aprobados: number;
  rechazados: number;
};

async function calcularStatsPreseleccion(parIds: string[]): Promise<StatsPreseleccion> {
  const stats: StatsPreseleccion = { total: 0, pendientes: 0, aprobados: 0, rechazados: 0 };
  if (parIds.length === 0) return stats;

  const filas = await prisma.inscripto.groupBy({
    by: ["estadoPreseleccion"],
    where: { parId: { in: parIds } },
    _count: { _all: true },
  });

  for (const fila of filas) {
    const cantidad = fila._count._all;
    stats.total += cantidad;
    if (fila.estadoPreseleccion === "APROBADO") {
      stats.aprobados += cantidad;
    } else if (fila.estadoPreseleccion === "RECHAZADO") {
      stats.rechazados += cantidad;
    } else {
      stats.pendientes += cantidad;
    }
  }

  return stats;
}

export type MisStats = { asignados: number; hechas: number; quedan: number };

// Asignados/hechas/quedan para ESTE evaluador puntual (a diferencia de calcularStats, que agrega
// por el estado del par completo, esto cuenta evaluaciones que el propio evaluador ya envió).
// "Asignados" acá son los ya habilitados para evaluar (preselección aprobada).
async function calcularMisStats(evaluadorId: string, parIds: string[]): Promise<MisStats> {
  if (parIds.length === 0) return { asignados: 0, hechas: 0, quedan: 0 };

  const [asignados, hechas] = await Promise.all([
    prisma.inscripto.count({ where: { parId: { in: parIds }, estadoPreseleccion: "APROBADO" } }),
    prisma.evaluacion.count({ where: { evaluadorId, inscripto: { parId: { in: parIds } } } }),
  ]);

  return { asignados, hechas, quedan: asignados - hechas };
}

export type MisStatsPreseleccion = { asignados: number; hechas: number; quedan: number };

// La preselección es una decisión compartida del par (la resuelve quien llegue primero), no una
// por evaluador: "hechas" cuenta inscriptos ya resueltos (aprobados o rechazados), sin importar
// quién de los dos la hizo.
async function calcularMisStatsPreseleccion(parIds: string[]): Promise<MisStatsPreseleccion> {
  if (parIds.length === 0) return { asignados: 0, hechas: 0, quedan: 0 };

  const [asignados, pendientes] = await Promise.all([
    prisma.inscripto.count({ where: { parId: { in: parIds } } }),
    prisma.inscripto.count({ where: { parId: { in: parIds }, estadoPreseleccion: "PENDIENTE" } }),
  ]);

  return { asignados, hechas: asignados - pendientes, quedan: pendientes };
}

export type StatsZonaPreseleccion = { inscriptos: number; decididos: number };

async function calcularStatsZonaPreseleccion(grupoId: string): Promise<StatsZonaPreseleccion> {
  const [inscriptos, decididos] = await Promise.all([
    prisma.inscripto.count({ where: { grupoId } }),
    prisma.inscripto.count({ where: { grupoId, estadoPreseleccion: { not: "PENDIENTE" } } }),
  ]);
  return { inscriptos, decididos };
}

// Grupos donde el usuario integra al menos un par activo: una tarjeta por grupo en el frontend.
export async function listarMisGrupos(evaluadorId: string) {
  const pares = await paresActivosDe(evaluadorId);
  const grupoIds = [...new Set(pares.map((p) => p.grupoId))];
  if (grupoIds.length === 0) return [];

  const grupos = await prisma.grupo.findMany({
    where: { id: { in: grupoIds } },
    orderBy: { nombre: "asc" },
  });

  return Promise.all(
    grupos.map(async (grupo) => {
      const parIds = pares.filter((p) => p.grupoId === grupo.id).map((p) => p.id);
      return {
        id: grupo.id,
        nombre: grupo.nombre,
        descripcion: grupo.descripcion,
        stats: await calcularStats(parIds),
        misStats: await calcularMisStats(evaluadorId, parIds),
        statsZona: await calcularStatsGrupo(grupo.id),
      };
    }),
  );
}

// Misma idea que listarMisGrupos, pero para la etapa de preselección: todos los inscriptos
// asignados al par (no solo los ya aprobados) y el progreso es "cuántos ya tienen una decisión".
export async function listarMisGruposPreseleccion(evaluadorId: string) {
  const pares = await paresActivosDe(evaluadorId);
  const grupoIds = [...new Set(pares.map((p) => p.grupoId))];
  if (grupoIds.length === 0) return [];

  const grupos = await prisma.grupo.findMany({
    where: { id: { in: grupoIds } },
    orderBy: { nombre: "asc" },
  });

  return Promise.all(
    grupos.map(async (grupo) => {
      const parIds = pares.filter((p) => p.grupoId === grupo.id).map((p) => p.id);
      return {
        id: grupo.id,
        nombre: grupo.nombre,
        descripcion: grupo.descripcion,
        stats: await calcularStatsPreseleccion(parIds),
        misStats: await calcularMisStatsPreseleccion(parIds),
        statsZona: await calcularStatsZonaPreseleccion(grupo.id),
      };
    }),
  );
}

export async function listarAsignados(
  evaluadorId: string,
  opciones: { grupoId?: string; page: number; pageSize: number; estado?: "PENDIENTE" | "EN_PROGRESO" | "EVALUADO" },
) {
  const pares = await paresActivosDe(evaluadorId, opciones.grupoId);
  const parIds = pares.map((p) => p.id);
  // Solo los ya habilitados para evaluar: la preselección se gestiona en su propia página.
  const where: Prisma.InscriptoWhereInput = {
    parId: { in: parIds },
    estadoPreseleccion: "APROBADO",
    ...(opciones.estado ? { estadoEvaluacion: opciones.estado } : {}),
  };

  const [total, inscriptos, stats] = await Promise.all([
    prisma.inscripto.count({ where }),
    prisma.inscripto.findMany({
      where,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      skip: (opciones.page - 1) * opciones.pageSize,
      take: opciones.pageSize,
      select: {
        id: true,
        uid: true,
        nombreCompleto: true,
        estadoEvaluacion: true,
        puntajeFinal: true,
        lote: { select: { nombre: true } },
        evaluaciones: { select: { evaluadorId: true, puntajeTotal: true } },
      },
    }),
    calcularStats(parIds),
  ]);

  return {
    items: inscriptos.map((i) => ({
      id: i.id,
      uid: i.uid,
      nombreCompleto: i.nombreCompleto,
      lote: i.lote?.nombre ?? null,
      estadoGeneral: i.estadoEvaluacion,
      miPuntaje: i.evaluaciones.find((e) => e.evaluadorId === evaluadorId)?.puntajeTotal ?? null,
      puntajeFinal: i.estadoEvaluacion === "EVALUADO" ? i.puntajeFinal : null,
    })),
    total,
    page: opciones.page,
    pageSize: opciones.pageSize,
    stats,
  };
}

export async function listarAsignadosPreseleccion(
  evaluadorId: string,
  opciones: { grupoId?: string; page: number; pageSize: number; estado?: "PENDIENTE" | "APROBADO" | "RECHAZADO" },
) {
  const pares = await paresActivosDe(evaluadorId, opciones.grupoId);
  const parIds = pares.map((p) => p.id);
  const where: Prisma.InscriptoWhereInput = {
    parId: { in: parIds },
    ...(opciones.estado ? { estadoPreseleccion: opciones.estado } : {}),
  };

  const [total, inscriptos, stats] = await Promise.all([
    prisma.inscripto.count({ where }),
    prisma.inscripto.findMany({
      where,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      skip: (opciones.page - 1) * opciones.pageSize,
      take: opciones.pageSize,
      select: {
        id: true,
        uid: true,
        nombreCompleto: true,
        estadoPreseleccion: true,
        lote: { select: { nombre: true } },
      },
    }),
    calcularStatsPreseleccion(parIds),
  ]);

  return {
    items: inscriptos.map((i) => ({
      id: i.id,
      uid: i.uid,
      nombreCompleto: i.nombreCompleto,
      lote: i.lote?.nombre ?? null,
      estadoPreseleccion: i.estadoPreseleccion,
    })),
    total,
    page: opciones.page,
    pageSize: opciones.pageSize,
    stats,
  };
}

type GrupoRespuestas = {
  agrupador: string;
  campos: { campoId: string; etiqueta: string; valor: string }[];
};

// El Excel nombra cada columna con el título completo de la pregunta ("Experiencia 1 - Lugar
// (empresa, institución, particular, etc.)"), que repite el agrupador ya mostrado como título del
// párrafo. Se normaliza a un título corto y fijo, con el período siempre primero.
const ORDEN_CANONICO: { patron: RegExp; etiqueta: string }[] = [
  { patron: /per[ií]odo/, etiqueta: "Período" },
  { patron: /lugar/, etiqueta: "Lugar" },
  { patron: /condici[oó]n/, etiqueta: "Condición" },
  { patron: /\brol\b|tarea|funci[oó]n/, etiqueta: "Rol / función / tarea" },
];

function normalizarEtiquetaSubcampo(etiquetaOriginal: string): { etiqueta: string; orden: number } {
  const texto = etiquetaOriginal.toLowerCase();
  const indice = ORDEN_CANONICO.findIndex((o) => o.patron.test(texto));
  if (indice >= 0) {
    return { etiqueta: ORDEN_CANONICO[indice].etiqueta, orden: indice };
  }
  // Sin match conocido: se quita el prefijo "Agrupador - " si existe y se deja el resto tal cual.
  const sinPrefijo = etiquetaOriginal.replace(/^[^-]+-\s*/, "").trim();
  return { etiqueta: sinPrefijo || etiquetaOriginal, orden: ORDEN_CANONICO.length };
}

const MESES_ABREV = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// El campo "Período" es texto libre (no hay fecha estructurada en el formulario): muchos
// inscriptos escribieron un rango prolijo en formato dd/mm/aaaa, otros una descripción narrativa
// ("Marzo 2023 a abril 2026, 20hs semanales"). Se reformatea solo las fechas dd/mm/aaaa que
// aparezcan sueltas en el texto al estilo argentino (día/mes abreviado/año); el resto del texto
// queda intacto.
function formatearFechasEnTexto(texto: string): string {
  return texto.replace(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, (match, diaStr, mesStr, anioStr) => {
    const dia = Number(diaStr);
    const mes = Number(mesStr);
    if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return match;
    return `${dia}/${MESES_ABREV[mes - 1]}/${anioStr}`;
  });
}

// Arma los "párrafos" de un criterio: cada agrupador ("Experiencia 1", "Secundario") con las
// respuestas del inscripto a sus subcampos. Se omiten los grupos sin ninguna respuesta.
function agruparSubcampos(subcampos: CampoFormulario[], respuestaPorCampo: Map<string, string | null>) {
  const grupos = new Map<string, { agrupador: string; campos: { campoId: string; etiqueta: string; valor: string; orden: number }[] }>();

  for (const sub of subcampos) {
    const valor = respuestaPorCampo.get(sub.id);
    if (valor == null || valor.trim() === "") continue;

    const clave = sub.agrupador ?? "";
    let grupo = grupos.get(clave);
    if (!grupo) {
      grupo = { agrupador: clave, campos: [] };
      grupos.set(clave, grupo);
    }
    const { etiqueta, orden } = normalizarEtiquetaSubcampo(sub.etiquetaCorta ?? sub.etiqueta);
    const valorFinal = etiqueta === "Período" ? formatearFechasEnTexto(valor) : valor;
    grupo.campos.push({ campoId: sub.id, etiqueta, valor: valorFinal, orden });
  }

  return [...grupos.values()].map((g): GrupoRespuestas => ({
    agrupador: g.agrupador,
    campos: [...g.campos]
      .sort((a, b) => a.orden - b.orden)
      .map(({ campoId, etiqueta, valor }) => ({ campoId, etiqueta, valor })),
  }));
}

export async function obtenerEvaluacionPropia(evaluadorId: string, inscriptoId: string) {
  const { inscripto } = await obtenerInscriptoAsignado(evaluadorId, inscriptoId);

  const [camposEvaluables, camposDocumento, respuestas, docsPreseleccion, preseleccionPor, evaluacion] =
    await Promise.all([
      prisma.campoFormulario.findMany({
        where: { esEvaluable: true, activo: true },
        orderBy: { orden: "asc" },
        include: {
          subcampos: { where: { activo: true }, orderBy: [{ orden: "asc" }, { createdAt: "asc" }] },
        },
      }),
      prisma.campoFormulario.findMany({
        where: { tipoDato: "URL", activo: true },
        orderBy: [{ orden: "asc" }, { createdAt: "asc" }],
      }),
      prisma.respuestaInscripto.findMany({ where: { inscriptoId } }),
      prisma.preseleccionDocumento.findMany({ where: { inscriptoId } }),
      inscripto.preseleccionPorId
        ? prisma.usuario.findUnique({
            where: { id: inscripto.preseleccionPorId },
            select: { nombre: true, apellido: true },
          })
        : Promise.resolve(null),
      prisma.evaluacion.findUnique({
        where: { inscriptoId_evaluadorId: { inscriptoId, evaluadorId } },
        include: { detalles: true },
      }),
    ]);

  const respuestaPorCampo = new Map(respuestas.map((r) => [r.campoId, r.valorTexto]));
  const docPorCampo = new Map(docsPreseleccion.map((d) => [d.campoId, d]));
  const detallePorCampo = new Map((evaluacion?.detalles ?? []).map((d) => [d.campoId, d]));

  // Todos los campos tipo URL, incluso los que el inscripto no subió: así se pueden marcar FALTANTE.
  const documentos = camposDocumento.map((campo) => ({
    campoId: campo.id,
    etiqueta: campo.etiqueta,
    url: respuestaPorCampo.get(campo.id) ?? null,
    esFoto: /foto/i.test(campo.etiqueta),
    estado: docPorCampo.get(campo.id)?.estado ?? null,
    observacion: docPorCampo.get(campo.id)?.observacion ?? null,
  }));

  const criterios = camposEvaluables.map((campo) => ({
    campoId: campo.id,
    etiqueta: campo.etiqueta,
    puntajeMaximo: campo.puntajeMaximo,
    respuestaInscripto: respuestaPorCampo.get(campo.id) ?? null,
    grupos: agruparSubcampos(campo.subcampos, respuestaPorCampo),
    puntajeAsignado: detallePorCampo.get(campo.id)?.puntaje ?? null,
  }));

  const puntajeMaximoTotal = camposEvaluables.reduce((acc, c) => acc + Number(c.puntajeMaximo ?? 0), 0);

  return {
    inscripto: {
      id: inscripto.id,
      uid: inscripto.uid,
      nombreCompleto: inscripto.nombreCompleto,
      estadoEvaluacion: inscripto.estadoEvaluacion,
      puntajeFinal: inscripto.estadoEvaluacion === "EVALUADO" ? inscripto.puntajeFinal : null,
    },
    preseleccion: {
      estado: inscripto.estadoPreseleccion,
      observacion: inscripto.preseleccionObservacion,
      por: preseleccionPor,
      at: inscripto.preseleccionAt,
      documentos,
    },
    evaluacion: evaluacion
      ? {
          puntajeTotal: evaluacion.puntajeTotal,
          comentarioGeneral: evaluacion.comentarioGeneral,
          fechaCompletada: evaluacion.fechaCompletada,
        }
      : null,
    criterios,
    puntajeMaximoTotal,
    puedeEvaluar: inscripto.estadoPreseleccion === "APROBADO" && !evaluacion,
  };
}

export async function registrarPreseleccion(
  evaluadorId: string,
  inscriptoId: string,
  data: {
    documentos: { campoId: string; estado: EstadoDocumentoPreseleccion; observacion?: string }[];
    resultado: Extract<EstadoPreseleccion, "APROBADO" | "RECHAZADO">;
    observacion?: string;
  },
) {
  const { inscripto } = await obtenerInscriptoAsignado(evaluadorId, inscriptoId);
  if (inscripto.estadoPreseleccion !== "PENDIENTE") {
    throw new AppError(409, "La preselección de este inscripto ya fue resuelta");
  }

  const camposDocumento = await prisma.campoFormulario.findMany({
    where: { tipoDato: "URL", activo: true },
  });
  const permitidos = new Set(camposDocumento.map((c) => c.id));
  const recibidos = new Set(data.documentos.map((d) => d.campoId));

  if (data.documentos.some((d) => !permitidos.has(d.campoId))) {
    throw new AppError(400, "Alguno de los documentos no corresponde a un campo de archivo activo");
  }
  const faltantes = camposDocumento.filter((c) => !recibidos.has(c.id));
  if (faltantes.length > 0) {
    throw new AppError(400, `Falta validar: ${faltantes.map((c) => c.etiqueta).join(", ")}`);
  }

  const observacion = data.observacion?.trim() || null;
  if (data.resultado === "RECHAZADO" && !observacion) {
    throw new AppError(400, "Para rechazar al inscripto hay que indicar una observación");
  }

  return prisma.$transaction(async (tx) => {
    // Si los dos integrantes del par validan a la vez, el segundo espera y encuentra el estado resuelto.
    await tx.$queryRaw`SELECT id FROM inscriptos WHERE id = ${inscriptoId} FOR UPDATE`;
    const actual = await tx.inscripto.findUnique({ where: { id: inscriptoId }, select: { estadoPreseleccion: true } });
    if (actual?.estadoPreseleccion !== "PENDIENTE") {
      throw new AppError(409, "La preselección de este inscripto ya fue resuelta");
    }

    for (const doc of data.documentos) {
      const datos = { estado: doc.estado, observacion: doc.observacion?.trim() || null };
      await tx.preseleccionDocumento.upsert({
        where: { inscriptoId_campoId: { inscriptoId, campoId: doc.campoId } },
        update: datos,
        create: { inscriptoId, campoId: doc.campoId, ...datos },
      });
    }

    return tx.inscripto.update({
      where: { id: inscriptoId },
      data: {
        estadoPreseleccion: data.resultado,
        preseleccionObservacion: observacion,
        preseleccionPorId: evaluadorId,
        preseleccionAt: new Date(),
      },
      select: { id: true, estadoPreseleccion: true, preseleccionObservacion: true, preseleccionAt: true },
    });
  });
}

export async function enviarEvaluacion(
  evaluadorId: string,
  inscriptoId: string,
  data: { puntajes: { campoId: string; puntaje: number }[]; comentarioGeneral?: string },
) {
  const { inscripto, par } = await obtenerInscriptoAsignado(evaluadorId, inscriptoId);
  const otroEvaluadorId = otroIntegrante(par, evaluadorId);

  if (inscripto.estadoPreseleccion === "RECHAZADO") {
    throw new AppError(409, "El inscripto fue rechazado en la preselección, no se evalúa");
  }
  if (inscripto.estadoPreseleccion !== "APROBADO") {
    throw new AppError(409, "Antes de evaluar hay que completar la preselección (validación de documentos)");
  }

  const camposActivos = await prisma.campoFormulario.findMany({
    where: { esEvaluable: true, activo: true },
    orderBy: { orden: "asc" },
  });
  const campoPorId = new Map(camposActivos.map((c) => [c.id, c]));
  const puntajePorCampo = new Map<string, number>();

  for (const p of data.puntajes) {
    const campo = campoPorId.get(p.campoId);
    if (!campo) {
      throw new AppError(400, `Campo evaluable inválido: ${p.campoId}`);
    }
    const maximo = Number(campo.puntajeMaximo ?? 0);
    if (p.puntaje < 0 || p.puntaje > maximo) {
      throw new AppError(400, `El puntaje de "${campo.etiqueta}" debe estar entre 0 y ${maximo}`);
    }
    puntajePorCampo.set(p.campoId, p.puntaje);
  }

  const faltantes = camposActivos.filter((c) => !puntajePorCampo.has(c.id));
  if (faltantes.length > 0) {
    throw new AppError(400, `Faltan puntuar: ${faltantes.map((c) => c.etiqueta).join(", ")}`);
  }

  const puntajeTotal = [...puntajePorCampo.values()].reduce((acc, p) => acc + p, 0);

  return prisma.$transaction(async (tx) => {
    // Serializa a los dos evaluadores del par si envían casi al mismo tiempo:
    // el segundo espera a que termine la transacción del primero antes de leer el estado.
    await tx.$queryRaw`SELECT id FROM inscriptos WHERE id = ${inscriptoId} FOR UPDATE`;

    const existente = await tx.evaluacion.findUnique({
      where: { inscriptoId_evaluadorId: { inscriptoId, evaluadorId } },
    });
    if (existente) {
      throw new AppError(409, "Ya enviaste tu evaluación de este inscripto; no se puede modificar");
    }

    const evaluacion = await tx.evaluacion.create({
      data: {
        inscriptoId,
        evaluadorId,
        puntajeTotal,
        comentarioGeneral: data.comentarioGeneral?.trim() || null,
        detalles: {
          create: [...puntajePorCampo].map(([campoId, puntaje]) => ({ campoId, puntaje })),
        },
      },
      include: { detalles: true },
    });

    const evaluacionCompanero = await tx.evaluacion.findUnique({
      where: { inscriptoId_evaluadorId: { inscriptoId, evaluadorId: otroEvaluadorId } },
    });

    if (evaluacionCompanero) {
      const puntajeFinal = (Number(evaluacion.puntajeTotal) + Number(evaluacionCompanero.puntajeTotal)) / 2;
      await tx.inscripto.update({
        where: { id: inscriptoId },
        data: { estadoEvaluacion: "EVALUADO", puntajeFinal },
      });
    } else {
      await tx.inscripto.update({
        where: { id: inscriptoId },
        data: { estadoEvaluacion: "EN_PROGRESO" },
      });
    }

    return evaluacion;
  });
}

export async function obtenerEvaluacionCompanero(evaluadorId: string, inscriptoId: string) {
  const { par } = await obtenerInscriptoAsignado(evaluadorId, inscriptoId);
  const otroEvaluadorId = otroIntegrante(par, evaluadorId);

  const [miEvaluacion, evaluacionCompanero] = await Promise.all([
    prisma.evaluacion.findUnique({
      where: { inscriptoId_evaluadorId: { inscriptoId, evaluadorId } },
    }),
    prisma.evaluacion.findUnique({
      where: { inscriptoId_evaluadorId: { inscriptoId, evaluadorId: otroEvaluadorId } },
      include: {
        detalles: { include: { campo: { select: { etiqueta: true, orden: true } } } },
        evaluador: { select: { nombre: true, apellido: true } },
      },
    }),
  ]);

  if (!miEvaluacion || !evaluacionCompanero) {
    throw new AppError(409, "Todavía no está disponible: hace falta que ambos evaluadores envíen su evaluación");
  }

  return {
    ...evaluacionCompanero,
    detalles: [...evaluacionCompanero.detalles].sort((a, b) => a.campo.orden - b.campo.orden),
  };
}
