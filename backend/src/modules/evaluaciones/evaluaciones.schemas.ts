import { z } from "zod";

export const guardarBorradorSchema = z.object({
  puntajes: z.array(
    z.object({
      campoId: z.string().uuid(),
      puntaje: z.number().int().min(0),
      comentario: z.string().optional(),
    }),
  ),
  comentarioGeneral: z.string().optional(),
});
