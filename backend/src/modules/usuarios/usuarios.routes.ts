import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import {
  actualizarUsuarioHandler,
  crearUsuarioHandler,
  listarUsuariosHandler,
} from "./usuarios.controller";

export const usuariosRouter = Router();
usuariosRouter.use(requireAuth);

usuariosRouter.get("/", requireRole("SUPERADMIN", "ADMIN_GRUPO"), listarUsuariosHandler);
usuariosRouter.post("/", requireRole("SUPERADMIN"), crearUsuarioHandler);
usuariosRouter.patch("/:id", requireRole("SUPERADMIN"), actualizarUsuarioHandler);
