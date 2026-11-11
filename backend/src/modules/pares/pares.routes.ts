import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { actualizarParHandler } from "./pares.controller";

export const paresRouter = Router();
paresRouter.use(requireAuth, requireRole("SUPERADMIN", "ADMIN_GRUPO"));

paresRouter.patch("/:id", actualizarParHandler);
