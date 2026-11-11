import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import {
  asignarGrupoHandler,
  asignarGrupoLoteHandler,
  listarSinGrupoHandler,
  resultadoFinalHandler,
} from "./inscriptos.controller";

export const inscriptosRouter = Router();
inscriptosRouter.use(requireAuth);

inscriptosRouter.get("/sin-grupo", requireRole("SUPERADMIN"), listarSinGrupoHandler);
inscriptosRouter.post("/asignar-grupo-lote", requireRole("SUPERADMIN"), asignarGrupoLoteHandler);
inscriptosRouter.patch("/:id/asignar-grupo", requireRole("SUPERADMIN"), asignarGrupoHandler);
inscriptosRouter.patch(
  "/:id/resultado-final",
  requireRole("SUPERADMIN", "ADMIN_GRUPO"),
  resultadoFinalHandler,
);
