import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import {
  actualizarCampoHandler,
  crearCampoHandler,
  listarCamposHandler,
  validarRubricaHandler,
} from "./rubrica.controller";

export const rubricaRouter = Router();
rubricaRouter.use(requireAuth, requireRole("SUPERADMIN"));

rubricaRouter.get("/campos", listarCamposHandler);
rubricaRouter.post("/campos", crearCampoHandler);
rubricaRouter.patch("/campos/:id", actualizarCampoHandler);
rubricaRouter.post("/validar", validarRubricaHandler);
