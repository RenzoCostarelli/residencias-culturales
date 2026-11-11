import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { asignarParHandler, obtenerLoteHandler } from "./lotes.controller";

export const lotesRouter = Router();
lotesRouter.use(requireAuth, requireRole("SUPERADMIN", "ADMIN_GRUPO"));

lotesRouter.get("/:id", obtenerLoteHandler);
lotesRouter.patch("/:id/asignar-par", asignarParHandler);
