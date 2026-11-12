import { asyncHandler, AppError } from "../../shared/errors";
import {
  actualizarUsuarioSchema,
  crearUsuarioSchema,
  listarUsuariosQuerySchema,
} from "./usuarios.schemas";
import {
  actualizarUsuario,
  crearUsuario,
  listarUsuarios,
  restablecerPassword,
} from "./usuarios.service";

export const listarUsuariosHandler = asyncHandler(async (req, res) => {
  const query = listarUsuariosQuerySchema.parse(req.query);

  // El admin de grupo necesita ver usuarios de cualquier rol (todos pueden evaluar) para
  // sumarlos como evaluadores de su grupo, pero solo los activos.
  const filtros = req.user?.rol === "ADMIN_GRUPO" ? { ...query, activo: true } : query;

  const usuarios = await listarUsuarios(filtros);
  res.json(usuarios);
});

export const crearUsuarioHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }

  const body = crearUsuarioSchema.parse(req.body);
  const resultado = await crearUsuario(body, req.user.id);
  res.status(201).json(resultado);
});

export const restablecerPasswordHandler = asyncHandler(async (req, res) => {
  const resultado = await restablecerPassword(req.params.id);
  res.json(resultado);
});

export const actualizarUsuarioHandler = asyncHandler(async (req, res) => {
  const body = actualizarUsuarioSchema.parse(req.body);
  const usuario = await actualizarUsuario(req.params.id, body);
  res.json(usuario);
});
