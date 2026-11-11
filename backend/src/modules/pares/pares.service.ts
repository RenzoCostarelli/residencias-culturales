import { AppError } from "../../shared/errors";
import { prisma, type RolUsuario } from "../../shared/prisma";
import { asegurarAccesoGrupo } from "../grupos/grupos.service";

const SELECT_EVALUADOR = { id: true, nombre: true, apellido: true, email: true } as const;

export async function listarPares(usuario: { id: string; rol: RolUsuario }, grupoId: string) {
  await asegurarAccesoGrupo(usuario, grupoId);

  return prisma.parEvaluadores.findMany({
    where: { grupoId },
    include: {
      evaluador1: { select: SELECT_EVALUADOR },
      evaluador2: { select: SELECT_EVALUADOR },
      _count: { select: { lotes: true, inscriptos: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function crearPar(
  usuario: { id: string; rol: RolUsuario },
  grupoId: string,
  data: { evaluador1Id: string; evaluador2Id: string },
) {
  await asegurarAccesoGrupo(usuario, grupoId);

  if (data.evaluador1Id === data.evaluador2Id) {
    throw new AppError(400, "Un par necesita dos evaluadores distintos");
  }

  const grupo = await prisma.grupo.findUnique({ where: { id: grupoId } });
  if (!grupo) {
    throw new AppError(404, "Grupo no encontrado");
  }

  const evaluadores = await prisma.usuario.findMany({
    where: { id: { in: [data.evaluador1Id, data.evaluador2Id] } },
  });
  if (evaluadores.length !== 2 || evaluadores.some((e) => e.rol !== "EVALUADOR")) {
    throw new AppError(400, "Ambos integrantes del par deben ser usuarios con rol EVALUADOR");
  }

  // Se normaliza el orden para que el índice único detecte el mismo par sin importar en qué orden se manden los ids.
  const [evaluador1Id, evaluador2Id] = [data.evaluador1Id, data.evaluador2Id].sort();

  const existente = await prisma.parEvaluadores.findFirst({
    where: { grupoId, evaluador1Id, evaluador2Id },
  });
  if (existente) {
    throw new AppError(409, "Ya existe un par con esos mismos evaluadores en este grupo");
  }

  return prisma.parEvaluadores.create({
    data: { grupoId, evaluador1Id, evaluador2Id, createdById: usuario.id },
    include: { evaluador1: { select: SELECT_EVALUADOR }, evaluador2: { select: SELECT_EVALUADOR } },
  });
}

export async function actualizarPar(
  usuario: { id: string; rol: RolUsuario },
  parId: string,
  data: { activo: boolean },
) {
  const par = await prisma.parEvaluadores.findUnique({ where: { id: parId } });
  if (!par) {
    throw new AppError(404, "Par no encontrado");
  }

  await asegurarAccesoGrupo(usuario, par.grupoId);

  return prisma.parEvaluadores.update({ where: { id: parId }, data });
}
