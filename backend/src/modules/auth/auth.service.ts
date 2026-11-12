import { comparePassword, hashPassword } from "../../shared/auth/password";
import { signToken } from "../../shared/auth/jwt";
import { AppError } from "../../shared/errors";
import { prisma, type Usuario } from "../../shared/prisma";

// Datos del usuario que viajan al frontend en el login y en /auth/me.
export function aUsuarioSesion(usuario: Usuario) {
  return {
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    rol: usuario.rol,
    debeCambiarPassword: usuario.debeCambiarPassword,
  };
}

export async function login(email: string, password: string) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !usuario.activo) {
    throw new AppError(401, "Credenciales inválidas");
  }

  const esValida = await comparePassword(password, usuario.passwordHash);
  if (!esValida) {
    throw new AppError(401, "Credenciales inválidas");
  }

  const token = signToken({ sub: usuario.id, rol: usuario.rol });

  return { token, usuario: aUsuarioSesion(usuario) };
}

export async function cambiarPassword(usuarioId: string, passwordActual: string, passwordNueva: string) {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) {
    throw new AppError(404, "Usuario no encontrado");
  }

  const esValida = await comparePassword(passwordActual, usuario.passwordHash);
  if (!esValida) {
    throw new AppError(400, "La contraseña actual no es correcta");
  }
  if (passwordActual === passwordNueva) {
    throw new AppError(400, "La contraseña nueva tiene que ser distinta de la actual");
  }

  const actualizado = await prisma.usuario.update({
    where: { id: usuarioId },
    data: { passwordHash: await hashPassword(passwordNueva), debeCambiarPassword: false },
  });

  return aUsuarioSesion(actualizado);
}
