import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../shared/auth/jwt";
import { AppError } from "../shared/errors";
import { prisma } from "../shared/prisma";

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new AppError(401, "No autenticado");
    }

    const payload = verifyToken(header.slice("Bearer ".length));

    const usuario = await prisma.usuario.findUnique({ where: { id: payload.sub } });
    if (!usuario || !usuario.activo) {
      throw new AppError(401, "Usuario inválido o inactivo");
    }

    req.user = { id: usuario.id, email: usuario.email, rol: usuario.rol };
    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
    } else {
      next(new AppError(401, "Token inválido o expirado"));
    }
  }
}
