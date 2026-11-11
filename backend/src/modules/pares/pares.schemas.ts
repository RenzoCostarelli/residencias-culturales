import { z } from "zod";

export const crearParSchema = z.object({
  evaluador1Id: z.string().uuid(),
  evaluador2Id: z.string().uuid(),
});

export const actualizarParSchema = z.object({
  activo: z.boolean(),
});
