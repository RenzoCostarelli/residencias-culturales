import { AppError } from "../../shared/errors";
import { prisma, type RolUsuario } from "../../shared/prisma";
import { asegurarAccesoGrupo } from "../grupos/grupos.service";

export async function listarLotes(usuario: { id: string; rol: RolUsuario }, grupoId: string) {
  await asegurarAccesoGrupo(usuario, grupoId);

  const SELECT_EVALUADOR = { id: true, nombre: true, apellido: true, email: true } as const;

  return prisma.lote.findMany({
    where: { grupoId },
    include: {
      par: {
        include: {
          evaluador1: { select: SELECT_EVALUADOR },
          evaluador2: { select: SELECT_EVALUADOR },
        },
      },
      _count: { select: { inscriptos: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function crearLote(
  usuario: { id: string; rol: RolUsuario },
  grupoId: string,
  data: { nombre: string; inscriptoIds: string[] },
) {
  await asegurarAccesoGrupo(usuario, grupoId);

  const grupo = await prisma.grupo.findUnique({ where: { id: grupoId } });
  if (!grupo) {
    throw new AppError(404, "Grupo no encontrado");
  }

  const inscriptos = await prisma.inscripto.findMany({ where: { id: { in: data.inscriptoIds } } });
  if (inscriptos.length !== data.inscriptoIds.length) {
    throw new AppError(404, "Alguno de los inscriptos no existe");
  }

  const deOtroGrupo = inscriptos.filter((i) => i.grupoId && i.grupoId !== grupoId);
  if (deOtroGrupo.length > 0) {
    throw new AppError(
      409,
      `${deOtroGrupo.length} inscripto(s) ya pertenecen a otro grupo; hay que reasignarlos primero desde superadmin`,
    );
  }

  return prisma.$transaction(async (tx) => {
    const lote = await tx.lote.create({
      data: { grupoId, nombre: data.nombre, createdById: usuario.id },
    });

    await tx.inscripto.updateMany({
      where: { id: { in: data.inscriptoIds } },
      data: { loteId: lote.id, grupoId },
    });

    return lote;
  });
}

export async function obtenerLote(usuario: { id: string; rol: RolUsuario }, loteId: string) {
  const lote = await prisma.lote.findUnique({
    where: { id: loteId },
    include: { inscriptos: true, par: true },
  });
  if (!lote) {
    throw new AppError(404, "Lote no encontrado");
  }

  await asegurarAccesoGrupo(usuario, lote.grupoId);
  return lote;
}

export async function asignarPar(usuario: { id: string; rol: RolUsuario }, loteId: string, parId: string) {
  const lote = await prisma.lote.findUnique({ where: { id: loteId } });
  if (!lote) {
    throw new AppError(404, "Lote no encontrado");
  }

  await asegurarAccesoGrupo(usuario, lote.grupoId);

  const par = await prisma.parEvaluadores.findUnique({ where: { id: parId } });
  if (!par) {
    throw new AppError(404, "Par no encontrado");
  }
  if (par.grupoId !== lote.grupoId) {
    throw new AppError(400, "El par pertenece a otro grupo");
  }

  return prisma.$transaction(async (tx) => {
    const loteActualizado = await tx.lote.update({ where: { id: loteId }, data: { parId } });
    await tx.inscripto.updateMany({ where: { loteId }, data: { parId } });
    return loteActualizado;
  });
}
