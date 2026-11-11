import { asyncHandler, AppError } from "../../shared/errors";
import { guardarBorradorSchema } from "./evaluaciones.schemas";
import {
  completarEvaluacion,
  guardarBorrador,
  listarAsignados,
  obtenerEvaluacionCompanero,
  obtenerEvaluacionPropia,
} from "./evaluaciones.service";

export const listarAsignadosHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const inscriptos = await listarAsignados(req.user.id);
  res.json(inscriptos);
});

export const obtenerMiaHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const evaluacion = await obtenerEvaluacionPropia(req.user.id, req.params.inscriptoId);
  res.json(evaluacion);
});

export const guardarBorradorHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const body = guardarBorradorSchema.parse(req.body);
  const evaluacion = await guardarBorrador(req.user.id, req.params.inscriptoId, body);
  res.json(evaluacion);
});

export const completarHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const evaluacion = await completarEvaluacion(req.user.id, req.params.inscriptoId);
  res.json(evaluacion);
});

export const obtenerCompaneroHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const evaluacion = await obtenerEvaluacionCompanero(req.user.id, req.params.inscriptoId);
  res.json(evaluacion);
});
