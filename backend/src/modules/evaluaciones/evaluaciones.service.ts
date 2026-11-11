import { AppError } from "../../shared/errors";
import { prisma } from "../../shared/prisma";

async function obtenerParDelInscripto(parId: string | null) {
  if (!parId) {
    throw new AppError(409, "Este inscripto todavía no fue asignado a un par de evaluadores");
  }
  const par = await prisma.parEvaluadores.findUnique({ where: { id: parId } });
  if (!par) {
    throw new AppError(404, "Par no encontrado");
  }
  return par;
}

function asegurarEsIntegrante(
  par: { evaluador1Id: string; evaluador2Id: string },
  evaluadorId: string,
) {
  if (par.evaluador1Id !== evaluadorId && par.evaluador2Id !== evaluadorId) {
    throw new AppError(403, "No sos uno de los evaluadores asignados a este inscripto");
  }
}

function otroIntegrante(par: { evaluador1Id: string; evaluador2Id: string }, evaluadorId: string) {
  return par.evaluador1Id === evaluadorId ? par.evaluador2Id : par.evaluador1Id;
}

export async function listarAsignados(evaluadorId: string) {
  const pares = await prisma.parEvaluadores.findMany({
    where: { OR: [{ evaluador1Id: evaluadorId }, { evaluador2Id: evaluadorId }], activo: true },
    select: { id: true },
  });
  const parIds = pares.map((p) => p.id);

  const inscriptos = await prisma.inscripto.findMany({
    where: { parId: { in: parIds } },
    select: {
      id: true,
      uid: true,
      nombreCompleto: true,
      estadoEvaluacion: true,
      evaluaciones: { where: { evaluadorId }, select: { estado: true, puntajeTotal: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return inscriptos.map((i) => ({
    id: i.id,
    uid: i.uid,
    nombreCompleto: i.nombreCompleto,
    estadoGeneral: i.estadoEvaluacion,
    miEvaluacion: i.evaluaciones[0] ?? null,
  }));
}

export async function obtenerEvaluacionPropia(evaluadorId: string, inscriptoId: string) {
  const inscripto = await prisma.inscripto.findUnique({ where: { id: inscriptoId } });
  if (!inscripto) {
    throw new AppError(404, "Inscripto no encontrado");
  }

  const par = await obtenerParDelInscripto(inscripto.parId);
  asegurarEsIntegrante(par, evaluadorId);

  const camposEvaluables = await prisma.campoFormulario.findMany({
    where: { esEvaluable: true, activo: true },
    orderBy: { orden: "asc" },
  });

  const respuestas = await prisma.respuestaInscripto.findMany({
    where: { inscriptoId, campoId: { in: camposEvaluables.map((c) => c.id) } },
  });
  const respuestaPorCampo = new Map(respuestas.map((r) => [r.campoId, r.valorTexto]));

  const camposDocumento = await prisma.campoFormulario.findMany({
    where: { tipoDato: "URL", esIdentificatorio: true, activo: true },
  });
  const respuestasDocumento = await prisma.respuestaInscripto.findMany({
    where: { inscriptoId, campoId: { in: camposDocumento.map((c) => c.id) }, valorTexto: { not: null } },
  });
  const campoDocumentoPorId = new Map(camposDocumento.map((c) => [c.id, c]));
  const documentos = respuestasDocumento
    .filter((r) => r.valorTexto)
    .map((r) => {
      const campo = campoDocumentoPorId.get(r.campoId)!;
      return {
        campoId: campo.id,
        etiqueta: campo.etiqueta,
        url: r.valorTexto as string,
        esFoto: /foto/i.test(campo.etiqueta),
      };
    });

  const evaluacion = await prisma.evaluacion.findUnique({
    where: { inscriptoId_evaluadorId: { inscriptoId, evaluadorId } },
    include: { detalles: true },
  });
  const detallePorCampo = new Map((evaluacion?.detalles ?? []).map((d) => [d.campoId, d]));

  const criterios = camposEvaluables.map((campo) => ({
    campoId: campo.id,
    etiqueta: campo.etiqueta,
    puntajeMaximo: campo.puntajeMaximo,
    respuestaInscripto: respuestaPorCampo.get(campo.id) ?? null,
    puntajeAsignado: detallePorCampo.get(campo.id)?.puntaje ?? null,
    comentario: detallePorCampo.get(campo.id)?.comentario ?? null,
  }));

  return {
    inscripto: { id: inscripto.id, uid: inscripto.uid, nombreCompleto: inscripto.nombreCompleto },
    estado: evaluacion?.estado ?? "BORRADOR",
    puntajeTotal: evaluacion?.puntajeTotal ?? null,
    comentarioGeneral: evaluacion?.comentarioGeneral ?? null,
    criterios,
    documentos,
  };
}

export async function guardarBorrador(
  evaluadorId: string,
  inscriptoId: string,
  data: {
    puntajes: { campoId: string; puntaje: number; comentario?: string }[];
    comentarioGeneral?: string;
  },
) {
  const inscripto = await prisma.inscripto.findUnique({ where: { id: inscriptoId } });
  if (!inscripto) {
    throw new AppError(404, "Inscripto no encontrado");
  }

  const par = await obtenerParDelInscripto(inscripto.parId);
  asegurarEsIntegrante(par, evaluadorId);

  const existente = await prisma.evaluacion.findUnique({
    where: { inscriptoId_evaluadorId: { inscriptoId, evaluadorId } },
  });
  if (existente?.estado === "COMPLETA") {
    throw new AppError(409, "Ya completaste esta evaluación, no se puede editar");
  }

  const camposIds = data.puntajes.map((p) => p.campoId);
  const campos = await prisma.campoFormulario.findMany({
    where: { id: { in: camposIds }, esEvaluable: true, activo: true },
  });
  const campoPorId = new Map(campos.map((c) => [c.id, c]));

  for (const p of data.puntajes) {
    const campo = campoPorId.get(p.campoId);
    if (!campo) {
      throw new AppError(400, `Campo evaluable inválido: ${p.campoId}`);
    }
    const maximo = Number(campo.puntajeMaximo ?? 0);
    if (p.puntaje < 0 || p.puntaje > maximo) {
      throw new AppError(400, `El puntaje de "${campo.etiqueta}" debe estar entre 0 y ${maximo}`);
    }
  }

  const evaluacion = await prisma.evaluacion.upsert({
    where: { inscriptoId_evaluadorId: { inscriptoId, evaluadorId } },
    update: { comentarioGeneral: data.comentarioGeneral },
    create: { inscriptoId, evaluadorId, comentarioGeneral: data.comentarioGeneral },
  });

  for (const p of data.puntajes) {
    await prisma.evaluacionDetalle.upsert({
      where: { evaluacionId_campoId: { evaluacionId: evaluacion.id, campoId: p.campoId } },
      update: { puntaje: p.puntaje, comentario: p.comentario },
      create: {
        evaluacionId: evaluacion.id,
        campoId: p.campoId,
        puntaje: p.puntaje,
        comentario: p.comentario,
      },
    });
  }

  if (inscripto.estadoEvaluacion === "PENDIENTE") {
    await prisma.inscripto.update({
      where: { id: inscriptoId },
      data: { estadoEvaluacion: "EN_PROGRESO" },
    });
  }

  return evaluacion;
}

export async function completarEvaluacion(evaluadorId: string, inscriptoId: string) {
  const inscripto = await prisma.inscripto.findUnique({ where: { id: inscriptoId } });
  if (!inscripto) {
    throw new AppError(404, "Inscripto no encontrado");
  }

  const par = await obtenerParDelInscripto(inscripto.parId);
  asegurarEsIntegrante(par, evaluadorId);
  const otroEvaluadorId = otroIntegrante(par, evaluadorId);

  return prisma.$transaction(async (tx) => {
    // Serializa a los dos evaluadores del par si completan casi al mismo tiempo:
    // el segundo espera a que termine la transacción del primero antes de leer el estado.
    await tx.$queryRaw`SELECT id FROM inscriptos WHERE id = ${inscriptoId} FOR UPDATE`;

    const evaluacion = await tx.evaluacion.findUnique({
      where: { inscriptoId_evaluadorId: { inscriptoId, evaluadorId } },
      include: { detalles: true },
    });
    if (!evaluacion) {
      throw new AppError(409, "Todavía no guardaste ningún puntaje para este inscripto");
    }
    if (evaluacion.estado === "COMPLETA") {
      throw new AppError(409, "Ya completaste esta evaluación");
    }

    const camposActivos = await tx.campoFormulario.findMany({
      where: { esEvaluable: true, activo: true },
    });
    const detallePorCampo = new Map(evaluacion.detalles.map((d) => [d.campoId, d]));
    const faltantes = camposActivos.filter((c) => !detallePorCampo.has(c.id));
    if (faltantes.length > 0) {
      throw new AppError(400, `Faltan puntuar: ${faltantes.map((c) => c.etiqueta).join(", ")}`);
    }

    const puntajeTotal = evaluacion.detalles.reduce((acc, d) => acc + Number(d.puntaje), 0);

    const evaluacionCompleta = await tx.evaluacion.update({
      where: { id: evaluacion.id },
      data: { estado: "COMPLETA", puntajeTotal, fechaCompletada: new Date() },
    });

    const evaluacionCompanero = await tx.evaluacion.findUnique({
      where: { inscriptoId_evaluadorId: { inscriptoId, evaluadorId: otroEvaluadorId } },
    });

    if (evaluacionCompanero?.estado === "COMPLETA") {
      const puntajeFinal =
        (Number(evaluacionCompleta.puntajeTotal) + Number(evaluacionCompanero.puntajeTotal)) / 2;

      await tx.inscripto.update({
        where: { id: inscriptoId },
        data: { estadoEvaluacion: "EVALUADO", puntajeFinal },
      });
    }

    return evaluacionCompleta;
  });
}

export async function obtenerEvaluacionCompanero(evaluadorId: string, inscriptoId: string) {
  const inscripto = await prisma.inscripto.findUnique({ where: { id: inscriptoId } });
  if (!inscripto) {
    throw new AppError(404, "Inscripto no encontrado");
  }

  const par = await obtenerParDelInscripto(inscripto.parId);
  asegurarEsIntegrante(par, evaluadorId);
  const otroEvaluadorId = otroIntegrante(par, evaluadorId);

  const [miEvaluacion, evaluacionCompanero] = await Promise.all([
    prisma.evaluacion.findUnique({
      where: { inscriptoId_evaluadorId: { inscriptoId, evaluadorId } },
    }),
    prisma.evaluacion.findUnique({
      where: { inscriptoId_evaluadorId: { inscriptoId, evaluadorId: otroEvaluadorId } },
      include: { detalles: { include: { campo: true } } },
    }),
  ]);

  if (miEvaluacion?.estado !== "COMPLETA" || evaluacionCompanero?.estado !== "COMPLETA") {
    throw new AppError(409, "Todavía no está disponible: hace falta que ambos evaluadores completen");
  }

  return evaluacionCompanero;
}
