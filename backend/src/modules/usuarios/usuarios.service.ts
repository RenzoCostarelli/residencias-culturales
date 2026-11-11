import { hashPassword } from "../../shared/auth/password";
import { AppError } from "../../shared/errors";
import { prisma, type Prisma, type RolUsuario } from "../../shared/prisma";

const SELECT_PUBLICO = {
  id: true,
  email: true,
  nombre: true,
  apellido: true,
  rol: true,
  activo: true,
  createdAt: true,
} satisfies Prisma.UsuarioSelect;

export async function listarUsuarios(filtros: { rol?: RolUsuario; activo?: boolean }) {
  return prisma.usuario.findMany({
    where: filtros,
    select: SELECT_PUBLICO,
    orderBy: { createdAt: "desc" },
  });
}

export async function crearUsuario(
  data: { email: string; password: string; nombre: string; apellido: string; rol: RolUsuario },
  creadoPorId: string,
) {
  const existente = await prisma.usuario.findUnique({ where: { email: data.email } });
  if (existente) {
    throw new AppError(409, "Ya existe un usuario con ese email");
  }

  const passwordHash = await hashPassword(data.password);

  return prisma.usuario.create({
    data: {
      email: data.email,
      passwordHash,
      nombre: data.nombre,
      apellido: data.apellido,
      rol: data.rol,
      createdById: creadoPorId,
    },
    select: SELECT_PUBLICO,
  });
}

export async function actualizarUsuario(
  id: string,
  data: { nombre?: string; apellido?: string; rol?: RolUsuario; activo?: boolean; password?: string },
) {
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) {
    throw new AppError(404, "Usuario no encontrado");
  }

  const passwordHash = data.password ? await hashPassword(data.password) : undefined;

  return prisma.usuario.update({
    where: { id },
    data: {
      nombre: data.nombre,
      apellido: data.apellido,
      rol: data.rol,
      activo: data.activo,
      ...(passwordHash ? { passwordHash } : {}),
    },
    select: SELECT_PUBLICO,
  });
}
