import { AppError } from "../../shared/errors";
import { prisma, type RolUsuario } from "../../shared/prisma";

export async function listarGrupos(usuario: { id: string; rol: RolUsuario }) {
  if (usuario.rol === "SUPERADMIN") {
    return prisma.grupo.findMany({ orderBy: { nombre: "asc" } });
  }

  return prisma.grupo.findMany({
    where: { administradores: { some: { usuarioId: usuario.id } } },
    orderBy: { nombre: "asc" },
  });
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
