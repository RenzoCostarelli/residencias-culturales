import { z } from "zod";

export const TAMANOS_LOTE = [10, 20, 30] as const;

export const crearLoteParaParSchema = z.object({
  cantidad: z.union([z.literal(10), z.literal(20), z.literal(30)]),
});
