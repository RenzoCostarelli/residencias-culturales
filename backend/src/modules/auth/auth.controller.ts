import { asyncHandler, AppError } from "../../shared/errors";
import { prisma } from "../../shared/prisma";
import { loginSchema } from "./auth.schemas";
import { login } from "./auth.service";

export const loginHandler = asyncHandler(async (req, res) => {
  const body = loginSchema.parse(req.body);
  const resultado = await login(body.email, body.password);
  res.json(resultado);
});

export const meHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: req.user.id } });
  if (!usuario) {
    throw new AppError(404, "Usuario no encontrado");
  }

  res.json({
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    rol: usuario.rol,
  });
});
