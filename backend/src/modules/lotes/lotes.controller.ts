import { asyncHandler, AppError } from "../../shared/errors";
import { asignarParSchema, crearLoteSchema } from "./lotes.schemas";
import { asignarPar, crearLote, listarLotes, obtenerLote } from "./lotes.service";

export const listarLotesHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const lotes = await listarLotes(req.user, req.params.grupoId);
  res.json(lotes);
});

export const crearLoteHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const body = crearLoteSchema.parse(req.body);
  const lote = await crearLote(req.user, req.params.grupoId, body);
  res.status(201).json(lote);
});

export const obtenerLoteHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const lote = await obtenerLote(req.user, req.params.id);
  res.json(lote);
});

export const asignarParHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const body = asignarParSchema.parse(req.body);
  const lote = await asignarPar(req.user, req.params.id, body.parId);
  res.json(lote);
});
