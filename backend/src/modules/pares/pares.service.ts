import { AppError } from "../../shared/errors";
import { prisma, type RolUsuario } from "../../shared/prisma";
import { asegurarAccesoGrupo } from "../grupos/grupos.service";

const SELECT_EVALUADOR = { id: true, nombre: true, apellido: true, email: true } as const;

const INCLUDE_PAR = {
  evaluador1: { select: SELECT_EVALUADOR },
  evaluador2: { select: SELECT_EVALUADOR },
  lotes: {
    select: { id: true, nombre: true, createdAt: true, _count: { select: { inscriptos: true } } },
    orderBy: { createdAt: "asc" as const },
  },
  _count: { select: { lotes: true, inscriptos: true } },
};

export async function listarPares(usuario: { id: string; rol: RolUsuario }, grupoId: string) {
  await asegurarAccesoGrupo(usuario, grupoId);

  return prisma.parEvaluadores.findMany({
    where: { grupoId },
    include: INCLUDE_PAR,
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

  // Cualquier rol puede evaluar, pero solo quienes fueron agregados como evaluadores del grupo.
  const miembros = await prisma.grupoEvaluador.findMany({
    where: { grupoId, usuarioId: { in: [data.evaluador1Id, data.evaluador2Id] } },
    include: { usuario: { select: { activo: true } } },
  });
  if (miembros.length !== 2 || miembros.some((m) => !m.usuario.activo)) {
    throw new AppError(400, "Ambos integrantes deben ser evaluadores activos de este grupo");
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
    include: INCLUDE_PAR,
  });
}

function mezclar<T>(items: T[]): T[] {
  const copia = [...items];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Empareja al azar a los evaluadores del grupo que todavía no integran ningún par activo.
// Si queda un número impar, el sobrante se informa para que el admin lo resuelva a mano.
export async function crearParesAutomaticos(usuario: { id: string; rol: RolUsuario }, grupoId: string) {
  await asegurarAccesoGrupo(usuario, grupoId);

  const grupo = await prisma.grupo.findUnique({ where: { id: grupoId } });
  if (!grupo) {
    throw new AppError(404, "Grupo no encontrado");
  }

  const [miembros, paresActivos] = await Promise.all([
    prisma.grupoEvaluador.findMany({
      where: { grupoId, usuario: { activo: true } },
      include: { usuario: { select: SELECT_EVALUADOR } },
    }),
    prisma.parEvaluadores.findMany({
      where: { grupoId, activo: true },
      select: { evaluador1Id: true, evaluador2Id: true },
    }),
  ]);

  const yaEmparejados = new Set(paresActivos.flatMap((p) => [p.evaluador1Id, p.evaluador2Id]));
  const disponibles = mezclar(miembros.filter((m) => !yaEmparejados.has(m.usuarioId)).map((m) => m.usuario));

  if (disponibles.length < 2) {
    throw new AppError(
      409,
      "Hacen falta al menos 2 evaluadores del grupo sin par para crear pares automáticamente",
    );
  }

  const combinaciones: { evaluador1Id: string; evaluador2Id: string }[] = [];
  for (let i = 0; i + 1 < disponibles.length; i += 2) {
    const [evaluador1Id, evaluador2Id] = [disponibles[i].id, disponibles[i + 1].id].sort();
    combinaciones.push({ evaluador1Id, evaluador2Id });
  }
  const sinPareja = disponibles.length % 2 === 1 ? disponibles[disponibles.length - 1] : null;

  const creados = await prisma.$transaction(
    combinaciones.map((c) =>
      prisma.parEvaluadores.upsert({
        where: { grupoId_evaluador1Id_evaluador2Id: { grupoId, ...c } },
        // Si ese mismo par existía inactivo, se reactiva en vez de chocar con el índice único.
        update: { activo: true },
        create: { grupoId, ...c, createdById: usuario.id },
        include: INCLUDE_PAR,
      }),
    ),
  );

  return { creados, sinPareja };
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

  return prisma.parEvaluadores.update({ where: { id: parId }, data, include: INCLUDE_PAR });
}
