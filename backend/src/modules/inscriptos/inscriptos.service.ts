import { AppError } from "../../shared/errors";
import { prisma, type Prisma, type ResultadoFinalInscripto, type RolUsuario } from "../../shared/prisma";
import { asegurarAccesoGrupo } from "../grupos/grupos.service";

const SELECT_LISTADO = {
  id: true,
  uid: true,
  nombreCompleto: true,
  email: true,
  dni: true,
  grupoId: true,
  loteId: true,
  parId: true,
  estadoEvaluacion: true,
  resultadoFinal: true,
  puntajeFinal: true,
  createdAt: true,
} satisfies Prisma.InscriptoSelect;

export async function listarInscriptosDeGrupo(usuario: { id: string; rol: RolUsuario }, grupoId: string) {
  await asegurarAccesoGrupo(usuario, grupoId);

  return prisma.inscripto.findMany({
    where: { grupoId },
    select: SELECT_LISTADO,
    orderBy: { createdAt: "desc" },
  });
}

export async function listarInscriptosSinGrupo() {
  return prisma.inscripto.findMany({
    where: { grupoId: null },
    select: SELECT_LISTADO,
    orderBy: { createdAt: "desc" },
  });
}

export async function asignarGrupo(inscriptoId: string, grupoId: string | null) {
  const inscripto = await prisma.inscripto.findUnique({ where: { id: inscriptoId } });
  if (!inscripto) {
    throw new AppError(404, "Inscripto no encontrado");
  }

  if (grupoId) {
    const grupo = await prisma.grupo.findUnique({ where: { id: grupoId } });
    if (!grupo) {
      throw new AppError(404, "Grupo no encontrado");
    }
  }

  return prisma.inscripto.update({
    where: { id: inscriptoId },
    // Cambiar de grupo desarma el lote/par previos: pertenecían al grupo anterior.
    data: { grupoId, loteId: null, parId: null },
    select: SELECT_LISTADO,
  });
}

export async function asignarGrupoLote(inscriptoIds: string[], grupoId: string) {
  const grupo = await prisma.grupo.findUnique({ where: { id: grupoId } });
  if (!grupo) {
    throw new AppError(404, "Grupo no encontrado");
  }

  const resultado = await prisma.inscripto.updateMany({
    where: { id: { in: inscriptoIds } },
    data: { grupoId, loteId: null, parId: null },
  });

  return { actualizados: resultado.count };
}

export async function fijarResultadoFinal(
  usuario: { id: string; rol: RolUsuario },
  inscriptoId: string,
  resultadoFinal: ResultadoFinalInscripto,
) {
  const inscripto = await prisma.inscripto.findUnique({ where: { id: inscriptoId } });
  if (!inscripto) {
    throw new AppError(404, "Inscripto no encontrado");
  }
  if (!inscripto.grupoId) {
    throw new AppError(409, "El inscripto todavía no tiene grupo asignado");
  }

  await asegurarAccesoGrupo(usuario, inscripto.grupoId);

  return prisma.inscripto.update({
    where: { id: inscriptoId },
    data: { resultadoFinal, resultadoDecididoPorId: usuario.id, resultadoDecididoAt: new Date() },
    select: SELECT_LISTADO,
  });
}
