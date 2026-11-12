import { AppError } from "../../shared/errors";
import { prisma, type RolUsuario } from "../../shared/prisma";
import { asegurarAccesoGrupo } from "../grupos/grupos.service";

// Crea un lote para el par con los próximos `cantidad` inscriptos sin asignar de SU grupo,
// en orden de inscripción. Nunca toma inscriptos de otro grupo ni sin grupo: la pertenencia
// a la zona/grupo es un requisito explícito del proceso.
export async function crearLoteParaPar(
  usuario: { id: string; rol: RolUsuario },
  parId: string,
  cantidad: number,
) {
  const par = await prisma.parEvaluadores.findUnique({ where: { id: parId } });
  if (!par) {
    throw new AppError(404, "Par no encontrado");
  }

  await asegurarAccesoGrupo(usuario, par.grupoId);

  if (!par.activo) {
    throw new AppError(409, "El par está inactivo; activalo antes de asignarle inscriptos");
  }

  return prisma.$transaction(async (tx) => {
    // Serializa a dos admins que aprieten "+N" sobre el mismo grupo al mismo tiempo:
    // el segundo espera y ve los inscriptos ya tomados por el primero.
    await tx.$queryRaw`SELECT id FROM grupos WHERE id = ${par.grupoId} FOR UPDATE`;

    const candidatos = await tx.inscripto.findMany({
      where: { grupoId: par.grupoId, parId: null, loteId: null },
      orderBy: { createdAt: "asc" },
      take: cantidad,
      select: { id: true },
    });

    if (candidatos.length === 0) {
      throw new AppError(409, "No quedan inscriptos sin asignar en este grupo");
    }

    const lotesDelGrupo = await tx.lote.count({ where: { grupoId: par.grupoId } });
    const lote = await tx.lote.create({
      data: {
        grupoId: par.grupoId,
        parId,
        nombre: `Lote ${lotesDelGrupo + 1}`,
        createdById: usuario.id,
      },
    });

    await tx.inscripto.updateMany({
      where: { id: { in: candidatos.map((c) => c.id) } },
      data: { loteId: lote.id, parId },
    });

    return { lote, asignados: candidatos.length, solicitados: cantidad };
  });
}
