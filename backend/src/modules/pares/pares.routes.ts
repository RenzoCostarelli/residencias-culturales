import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { actualizarParHandler } from "./pares.controller";
import { crearLoteParaParHandler } from "../lotes/lotes.controller";

export const paresRouter = Router();
paresRouter.use(requireAuth, requireRole("SUPERADMIN", "ADMIN_GRUPO"));

paresRouter.patch("/:id", actualizarParHandler);
// Lotes "transparentes": el admin elige un par y le agrega los próximos 10/20/30 inscriptos
// sin asignar de su grupo.
paresRouter.post("/:id/lotes", crearLoteParaParHandler);
