import { asyncHandler, AppError } from "../../shared/errors";
import { cambiarHojaSchema, guardarMapeoSchema } from "./importaciones.schemas";
import {
  cambiarHoja,
  confirmarImportacion,
  guardarMapeo,
  iniciarImportacion,
  listarImportaciones,
  obtenerImportacion,
} from "./importaciones.service";

export const iniciarImportacionHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  if (!req.file) {
    throw new AppError(400, "Falta el archivo");
  }

  const resultado = await iniciarImportacion(
    { path: req.file.path, originalname: req.file.originalname },
    req.user.id,
  );
  res.status(201).json(resultado);
});

export const cambiarHojaHandler = asyncHandler(async (req, res) => {
  const body = cambiarHojaSchema.parse(req.body);
  const resultado = await cambiarHoja(req.params.id, body.hoja);
  res.json(resultado);
});

export const guardarMapeoHandler = asyncHandler(async (req, res) => {
  const body = guardarMapeoSchema.parse(req.body);
  const resultado = await guardarMapeo(req.params.id, body.columnas);
  res.json(resultado);
});

export const confirmarImportacionHandler = asyncHandler(async (req, res) => {
  const resultado = await confirmarImportacion(req.params.id);
  res.json(resultado);
});

export const listarImportacionesHandler = asyncHandler(async (_req, res) => {
  const resultado = await listarImportaciones();
  res.json(resultado);
});

export const obtenerImportacionHandler = asyncHandler(async (req, res) => {
  const resultado = await obtenerImportacion(req.params.id);
  res.json(resultado);
});
