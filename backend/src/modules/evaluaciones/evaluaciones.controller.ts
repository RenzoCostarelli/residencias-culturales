import { asyncHandler, AppError } from "../../shared/errors";
import { asignadosQuerySchema, enviarEvaluacionSchema, preseleccionSchema } from "./evaluaciones.schemas";
import {
  enviarEvaluacion,
  listarAsignados,
  listarMisGrupos,
  obtenerEvaluacionCompanero,
  obtenerEvaluacionPropia,
  registrarPreseleccion,
} from "./evaluaciones.service";

export const listarMisGruposHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const grupos = await listarMisGrupos(req.user.id);
  res.json(grupos);
});

export const listarAsignadosHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const query = asignadosQuerySchema.parse(req.query);
  const resultado = await listarAsignados(req.user.id, query);
  res.json(resultado);
});

export const obtenerMiaHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const evaluacion = await obtenerEvaluacionPropia(req.user.id, req.params.inscriptoId);
  res.json(evaluacion);
});

export const registrarPreseleccionHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const body = preseleccionSchema.parse(req.body);
  const resultado = await registrarPreseleccion(req.user.id, req.params.inscriptoId, body);
  res.json(resultado);
});

export const enviarEvaluacionHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const body = enviarEvaluacionSchema.parse(req.body);
  const evaluacion = await enviarEvaluacion(req.user.id, req.params.inscriptoId, body);
  res.status(201).json(evaluacion);
});

export const obtenerCompaneroHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const evaluacion = await obtenerEvaluacionCompanero(req.user.id, req.params.inscriptoId);
  res.json(evaluacion);
});
