import { asyncHandler } from "../../shared/errors";
import { actualizarCampoSchema, crearCampoSchema } from "./rubrica.schemas";
import { actualizarCampo, crearCampo, listarCampos, validarRubrica } from "./rubrica.service";

export const listarCamposHandler = asyncHandler(async (_req, res) => {
  const resultado = await listarCampos();
  res.json(resultado);
});

export const crearCampoHandler = asyncHandler(async (req, res) => {
  const body = crearCampoSchema.parse(req.body);
  const campo = await crearCampo(body);
  res.status(201).json(campo);
});

export const actualizarCampoHandler = asyncHandler(async (req, res) => {
  const body = actualizarCampoSchema.parse(req.body);
  const campo = await actualizarCampo(req.params.id, body);
  res.json(campo);
});

export const validarRubricaHandler = asyncHandler(async (_req, res) => {
  const resultado = await validarRubrica();
  res.json(resultado);
});
