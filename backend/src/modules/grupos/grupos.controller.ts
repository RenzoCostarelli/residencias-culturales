import { asyncHandler, AppError } from "../../shared/errors";
import {
  actualizarGrupoSchema,
  administradorGrupoSchema,
  crearGrupoSchema,
} from "./grupos.schemas";
import {
  actualizarGrupo,
  agregarAdministrador,
  crearGrupo,
  listarGrupos,
  quitarAdministrador,
} from "./grupos.service";

export const listarGruposHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }

  const grupos = await listarGrupos(req.user);
  res.json(grupos);
});

export const crearGrupoHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }

  const body = crearGrupoSchema.parse(req.body);
  const grupo = await crearGrupo(body, req.user.id);
  res.status(201).json(grupo);
});

export const actualizarGrupoHandler = asyncHandler(async (req, res) => {
  const body = actualizarGrupoSchema.parse(req.body);
  const grupo = await actualizarGrupo(req.params.id, body);
  res.json(grupo);
});

export const agregarAdministradorHandler = asyncHandler(async (req, res) => {
  const body = administradorGrupoSchema.parse(req.body);
  const relacion = await agregarAdministrador(req.params.id, body.usuarioId);
  res.status(201).json(relacion);
});

export const quitarAdministradorHandler = asyncHandler(async (req, res) => {
  await quitarAdministrador(req.params.id, req.params.usuarioId);
  res.status(204).send();
});
