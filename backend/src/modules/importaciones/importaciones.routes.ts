import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import {
  cambiarHojaHandler,
  confirmarImportacionHandler,
  guardarMapeoHandler,
  iniciarImportacionHandler,
  listarImportacionesHandler,
  obtenerImportacionHandler,
} from "./importaciones.controller";
import { uploadExcelMiddleware } from "./importaciones.upload";

export const importacionesRouter = Router();
importacionesRouter.use(requireAuth, requireRole("SUPERADMIN"));

importacionesRouter.get("/", listarImportacionesHandler);
importacionesRouter.post("/excel", uploadExcelMiddleware, iniciarImportacionHandler);
importacionesRouter.get("/:id", obtenerImportacionHandler);
importacionesRouter.patch("/:id/hoja", cambiarHojaHandler);
importacionesRouter.post("/:id/mapeo", guardarMapeoHandler);
importacionesRouter.post("/:id/confirmar", confirmarImportacionHandler);
