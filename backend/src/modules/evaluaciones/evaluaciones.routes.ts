import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import {
  enviarEvaluacionHandler,
  listarAsignadosHandler,
  listarMisGruposHandler,
  obtenerCompaneroHandler,
  obtenerMiaHandler,
  registrarPreseleccionHandler,
} from "./evaluaciones.controller";

// Cualquier rol puede evaluar: la autorización real es "integra el par asignado al inscripto",
// y la resuelve el servicio en cada operación.
export const evaluacionesRouter = Router();
evaluacionesRouter.use(requireAuth);

evaluacionesRouter.get("/mis-grupos", listarMisGruposHandler);
evaluacionesRouter.get("/asignados", listarAsignadosHandler);
evaluacionesRouter.get("/:inscriptoId/mia", obtenerMiaHandler);
evaluacionesRouter.post("/:inscriptoId/preseleccion", registrarPreseleccionHandler);
evaluacionesRouter.post("/:inscriptoId/mia", enviarEvaluacionHandler);
evaluacionesRouter.get("/:inscriptoId/companero", obtenerCompaneroHandler);
