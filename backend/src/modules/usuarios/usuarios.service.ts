import { generarPasswordAleatoria, hashPassword } from "../../shared/auth/password";
import { AppError } from "../../shared/errors";
import { prisma, type Prisma, type RolUsuario } from "../../shared/prisma";

const SELECT_PUBLICO = {
  id: true,
  email: true,
  nombre: true,
  apellido: true,
  rol: true,
  activo: true,
  debeCambiarPassword: true,
  createdAt: true,
} satisfies Prisma.UsuarioSelect;

export async function listarUsuarios(filtros: { rol?: RolUsuario; activo?: boolean }) {
  return prisma.usuario.findMany({
    where: filtros,
    select: SELECT_PUBLICO,
    orderBy: { createdAt: "desc" },
  });
}

// La contraseña generada se devuelve en claro una única vez (para que el admin la copie y la
// comparta); después solo queda el hash.
export async function crearUsuario(
  data: { email: string; nombre: string; apellido: string; rol: RolUsuario },
  creadoPorId: string,
) {
  const existente = await prisma.usuario.findUnique({ where: { email: data.email } });
  if (existente) {
    throw new AppError(409, "Ya existe un usuario con ese email");
  }

  const passwordGenerada = generarPasswordAleatoria();
  const passwordHash = await hashPassword(passwordGenerada);

  const usuario = await prisma.usuario.create({
    data: {
      email: data.email,
      passwordHash,
      nombre: data.nombre,
      apellido: data.apellido,
      rol: data.rol,
      debeCambiarPassword: true,
      createdById: creadoPorId,
    },
    select: SELECT_PUBLICO,
  });

  return { usuario, passwordGenerada };
}

export async function restablecerPassword(id: string) {
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) {
    throw new AppError(404, "Usuario no encontrado");
  }

  const passwordGenerada = generarPasswordAleatoria();
  const actualizado = await prisma.usuario.update({
    where: { id },
    data: { passwordHash: await hashPassword(passwordGenerada), debeCambiarPassword: true },
    select: SELECT_PUBLICO,
  });

  return { usuario: actualizado, passwordGenerada };
}

export async function actualizarUsuario(
  id: string,
  data: { nombre?: string; apellido?: string; rol?: RolUsuario; activo?: boolean },
) {
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) {
    throw new AppError(404, "Usuario no encontrado");
  }

  return prisma.usuario.update({
    where: { id },
    data,
    select: SELECT_PUBLICO,
  });
}
