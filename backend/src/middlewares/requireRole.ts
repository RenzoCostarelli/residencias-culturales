import type { NextFunction, Request, Response } from "express";
import type { RolUsuario } from "../shared/prisma";
import { AppError } from "../shared/errors";

export function requireRole(...roles: RolUsuario[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      next(new AppError(403, "No tenés permiso para esta acción"));
      return;
    }
    next();
  };
}
