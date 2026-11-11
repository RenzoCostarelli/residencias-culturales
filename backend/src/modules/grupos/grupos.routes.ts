import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import {
  actualizarGrupoHandler,
  agregarAdministradorHandler,
  crearGrupoHandler,
  listarGruposHandler,
  quitarAdministradorHandler,
} from "./grupos.controller";
import { crearParHandler, listarParesHandler } from "../pares/pares.controller";
import { crearLoteHandler, listarLotesHandler } from "../lotes/lotes.controller";
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
gruposRouter.get("/:grupoId/pares", requireRole("SUPERADMIN", "ADMIN_GRUPO"), listarParesHandler);
gruposRouter.post("/:grupoId/pares", requireRole("SUPERADMIN", "ADMIN_GRUPO"), crearParHandler);
gruposRouter.get("/:grupoId/lotes", requireRole("SUPERADMIN", "ADMIN_GRUPO"), listarLotesHandler);
gruposRouter.post("/:grupoId/lotes", requireRole("SUPERADMIN", "ADMIN_GRUPO"), crearLoteHandler);
gruposRouter.get(
  "/:grupoId/inscriptos",
  requireRole("SUPERADMIN", "ADMIN_GRUPO"),
  listarInscriptosDeGrupoHandler,
);
