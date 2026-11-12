import { asyncHandler, AppError } from "../../shared/errors";
import { actualizarParSchema, crearParSchema } from "./pares.schemas";
import { actualizarPar, crearPar, crearParesAutomaticos, listarPares } from "./pares.service";

export const listarParesHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const pares = await listarPares(req.user, req.params.grupoId);
  res.json(pares);
});

export const crearParHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const body = crearParSchema.parse(req.body);
  const par = await crearPar(req.user, req.params.grupoId, body);
  res.status(201).json(par);
});

export const crearParesAutomaticosHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const resultado = await crearParesAutomaticos(req.user, req.params.grupoId);
  res.status(201).json(resultado);
});

export const actualizarParHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const body = actualizarParSchema.parse(req.body);
  const par = await actualizarPar(req.user, req.params.id, body);
  res.json(par);
});
