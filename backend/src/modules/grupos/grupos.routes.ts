import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import {
  actualizarGrupoHandler,
  agregarAdministradorHandler,
  agregarEvaluadorHandler,
  crearGrupoHandler,
  listarEvaluadoresHandler,
  listarGruposHandler,
  quitarAdministradorHandler,
  quitarEvaluadorHandler,
} from "./grupos.controller";
import {
  crearParHandler,
  crearParesAutomaticosHandler,
  listarParesHandler,
} from "../pares/pares.controller";
import { listarInscriptosDeGrupoHandler } from "../inscriptos/inscriptos.controller";

export const gruposRouter = Router();
gruposRouter.use(requireAuth);

gruposRouter.get("/", requireRole("SUPERADMIN", "ADMIN_GRUPO"), listarGruposHandler);
gruposRouter.post("/", requireRole("SUPERADMIN"), crearGrupoHandler);
gruposRouter.patch("/:id", requireRole("SUPERADMIN"), actualizarGrupoHandler);
gruposRouter.post("/:id/administradores", requireRole("SUPERADMIN"), agregarAdministradorHandler);
gruposRouter.delete(
  "/:id/administradores/:usuarioId",
  requireRole("SUPERADMIN"),
  quitarAdministradorHandler,
);

// Anidadas: la autorización fina (admin de ESTE grupo vs. cualquier otro) la resuelve
// asegurarAccesoGrupo() dentro de cada servicio, no alcanza con el rol a nivel de ruta.
const adminDeGrupo = requireRole("SUPERADMIN", "ADMIN_GRUPO");

gruposRouter.get("/:grupoId/evaluadores", adminDeGrupo, listarEvaluadoresHandler);
gruposRouter.post("/:grupoId/evaluadores", adminDeGrupo, agregarEvaluadorHandler);
gruposRouter.delete("/:grupoId/evaluadores/:usuarioId", adminDeGrupo, quitarEvaluadorHandler);

gruposRouter.get("/:grupoId/pares", adminDeGrupo, listarParesHandler);
gruposRouter.post("/:grupoId/pares", adminDeGrupo, crearParHandler);
gruposRouter.post("/:grupoId/pares/automaticos", adminDeGrupo, crearParesAutomaticosHandler);

gruposRouter.get("/:grupoId/inscriptos", adminDeGrupo, listarInscriptosDeGrupoHandler);
