import { asyncHandler, AppError } from "../../shared/errors";
import { crearLoteParaParSchema } from "./lotes.schemas";
import { crearLoteParaPar } from "./lotes.service";

export const crearLoteParaParHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const body = crearLoteParaParSchema.parse(req.body);
  const resultado = await crearLoteParaPar(req.user, req.params.id, body.cantidad);
  res.status(201).json(resultado);
});
