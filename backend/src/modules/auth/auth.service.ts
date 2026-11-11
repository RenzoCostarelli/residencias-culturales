import { comparePassword } from "../../shared/auth/password";
import { signToken } from "../../shared/auth/jwt";
import { AppError } from "../../shared/errors";
import { prisma } from "../../shared/prisma";

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

  return {
    token,
    usuario: {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol,
    },
  };
}
