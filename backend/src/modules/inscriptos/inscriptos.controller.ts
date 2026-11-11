import { asyncHandler, AppError } from "../../shared/errors";
import {
  asignarGrupoLoteSchema,
  asignarGrupoSchema,
  resultadoFinalSchema,
} from "./inscriptos.schemas";
import {
  asignarGrupo,
  asignarGrupoLote,
  fijarResultadoFinal,
  listarInscriptosDeGrupo,
  listarInscriptosSinGrupo,
} from "./inscriptos.service";

export const listarInscriptosDeGrupoHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const inscriptos = await listarInscriptosDeGrupo(req.user, req.params.grupoId);
  res.json(inscriptos);
});

export const listarSinGrupoHandler = asyncHandler(async (_req, res) => {
  const inscriptos = await listarInscriptosSinGrupo();
  res.json(inscriptos);
});

export const asignarGrupoHandler = asyncHandler(async (req, res) => {
  const body = asignarGrupoSchema.parse(req.body);
  const inscripto = await asignarGrupo(req.params.id, body.grupoId);
  res.json(inscripto);
});

export const asignarGrupoLoteHandler = asyncHandler(async (req, res) => {
  const body = asignarGrupoLoteSchema.parse(req.body);
  const resultado = await asignarGrupoLote(body.inscriptoIds, body.grupoId);
  res.json(resultado);
});

export const resultadoFinalHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const body = resultadoFinalSchema.parse(req.body);
  const inscripto = await fijarResultadoFinal(req.user, req.params.id, body.resultadoFinal);
  res.json(inscripto);
});
