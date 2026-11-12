import { AppError } from "../../shared/errors";
import { prisma, type RolUsuario } from "../../shared/prisma";

const SELECT_USUARIO = {
  id: true,
  nombre: true,
  apellido: true,
  email: true,
  rol: true,
  activo: true,
} as const;

export type GrupoStats = {
  inscriptos: number;
  evaluadores: number;
  evaluacionesRealizadas: number;
};

export async function calcularStatsGrupo(grupoId: string): Promise<GrupoStats> {
  const [inscriptos, evaluadores, evaluacionesRealizadas] = await Promise.all([
    prisma.inscripto.count({ where: { grupoId } }),
    prisma.grupoEvaluador.count({ where: { grupoId } }),
    prisma.evaluacion.count({ where: { inscripto: { grupoId } } }),
  ]);
  return { inscriptos, evaluadores, evaluacionesRealizadas };
}

export async function listarGrupos(usuario: { id: string; rol: RolUsuario }) {
  const grupos =
    usuario.rol === "SUPERADMIN"
      ? await prisma.grupo.findMany({ orderBy: { nombre: "asc" } })
      : await prisma.grupo.findMany({
          where: { administradores: { some: { usuarioId: usuario.id } } },
          orderBy: { nombre: "asc" },
        });

  return Promise.all(grupos.map(async (grupo) => ({ ...grupo, stats: await calcularStatsGrupo(grupo.id) })));
}

export async function crearGrupo(data: { nombre: string; descripcion?: string }, creadoPorId: string) {
  const existente = await prisma.grupo.findUnique({ where: { nombre: data.nombre } });
  if (existente) {
    throw new AppError(409, "Ya existe un grupo con ese nombre");
  }

  return prisma.grupo.create({ data: { ...data, createdById: creadoPorId } });
}

export async function actualizarGrupo(id: string, data: { nombre?: string; descripcion?: string }) {
  const grupo = await prisma.grupo.findUnique({ where: { id } });
  if (!grupo) {
    throw new AppError(404, "Grupo no encontrado");
  }

  return prisma.grupo.update({ where: { id }, data });
}

export async function agregarAdministrador(grupoId: string, usuarioId: string) {
  const [grupo, usuario] = await Promise.all([
    prisma.grupo.findUnique({ where: { id: grupoId } }),
    prisma.usuario.findUnique({ where: { id: usuarioId } }),
  ]);

  if (!grupo) {
    throw new AppError(404, "Grupo no encontrado");
  }
  if (!usuario) {
    throw new AppError(404, "Usuario no encontrado");
  }
  if (usuario.rol !== "ADMIN_GRUPO") {
    throw new AppError(400, "El usuario debe tener rol ADMIN_GRUPO");
  }

  return prisma.grupoAdministrador.upsert({
    where: { grupoId_usuarioId: { grupoId, usuarioId } },
    update: {},
    create: { grupoId, usuarioId },
  });
}

export async function quitarAdministrador(grupoId: string, usuarioId: string) {
  try {
    await prisma.grupoAdministrador.delete({
      where: { grupoId_usuarioId: { grupoId, usuarioId } },
    });
  } catch {
    throw new AppError(404, "Ese usuario no administra ese grupo");
  }
}

export async function usuarioAdministraGrupo(usuarioId: string, grupoId: string): Promise<boolean> {
  const relacion = await prisma.grupoAdministrador.findUnique({
    where: { grupoId_usuarioId: { grupoId, usuarioId } },
  });
  return relacion != null;
}

// Usar al principio de cualquier acción sobre pares/lotes/inscriptos de un grupo específico:
// el superadmin pasa siempre, el admin de grupo solo si administra ESE grupo.
export async function asegurarAccesoGrupo(usuario: { id: string; rol: RolUsuario }, grupoId: string) {
  if (usuario.rol === "SUPERADMIN") {
    return;
  }
  if (usuario.rol !== "ADMIN_GRUPO" || !(await usuarioAdministraGrupo(usuario.id, grupoId))) {
    throw new AppError(403, "No administrás este grupo");
  }
}

// ---- Evaluadores del grupo (cualquier rol puede evaluar) ----

export async function listarEvaluadores(usuario: { id: string; rol: RolUsuario }, grupoId: string) {
  await asegurarAccesoGrupo(usuario, grupoId);

  const [miembros, paresActivos] = await Promise.all([
    prisma.grupoEvaluador.findMany({
      where: { grupoId },
      include: { usuario: { select: SELECT_USUARIO } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.parEvaluadores.findMany({
      where: { grupoId, activo: true },
      select: { evaluador1Id: true, evaluador2Id: true },
    }),
  ]);

  const enPar = new Set(paresActivos.flatMap((p) => [p.evaluador1Id, p.evaluador2Id]));

  return miembros.map((m) => ({
    ...m.usuario,
    agregadoAt: m.createdAt,
    enPar: enPar.has(m.usuarioId),
  }));
}

export async function agregarEvaluador(
  usuario: { id: string; rol: RolUsuario },
  grupoId: string,
  usuarioId: string,
) {
  await asegurarAccesoGrupo(usuario, grupoId);

  const [grupo, evaluador] = await Promise.all([
    prisma.grupo.findUnique({ where: { id: grupoId } }),
    prisma.usuario.findUnique({ where: { id: usuarioId } }),
  ]);
  if (!grupo) {
    throw new AppError(404, "Grupo no encontrado");
  }
  if (!evaluador || !evaluador.activo) {
    throw new AppError(404, "Usuario no encontrado o inactivo");
  }

  return prisma.grupoEvaluador.upsert({
    where: { grupoId_usuarioId: { grupoId, usuarioId } },
    update: {},
    create: { grupoId, usuarioId },
    include: { usuario: { select: SELECT_USUARIO } },
  });
}

export async function quitarEvaluador(
  usuario: { id: string; rol: RolUsuario },
  grupoId: string,
  usuarioId: string,
) {
  await asegurarAccesoGrupo(usuario, grupoId);

  const enParActivo = await prisma.parEvaluadores.findFirst({
    where: { grupoId, activo: true, OR: [{ evaluador1Id: usuarioId }, { evaluador2Id: usuarioId }] },
  });
  if (enParActivo) {
    throw new AppError(409, "El usuario integra un par activo de este grupo; desactivá el par primero");
  }

  try {
    await prisma.grupoEvaluador.delete({ where: { grupoId_usuarioId: { grupoId, usuarioId } } });
  } catch {
    throw new AppError(404, "Ese usuario no es evaluador de este grupo");
  }
}
