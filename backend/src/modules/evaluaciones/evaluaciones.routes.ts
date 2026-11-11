import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import {
  completarHandler,
  guardarBorradorHandler,
  listarAsignadosHandler,
  obtenerCompaneroHandler,
  obtenerMiaHandler,
} from "./evaluaciones.controller";

export const evaluacionesRouter = Router();
evaluacionesRouter.use(requireAuth, requireRole("EVALUADOR"));

evaluacionesRouter.get("/asignados", listarAsignadosHandler);
evaluacionesRouter.get("/:inscriptoId/mia", obtenerMiaHandler);
evaluacionesRouter.put("/:inscriptoId/mia", guardarBorradorHandler);
evaluacionesRouter.post("/:inscriptoId/mia/completar", completarHandler);
evaluacionesRouter.get("/:inscriptoId/companero", obtenerCompaneroHandler);
