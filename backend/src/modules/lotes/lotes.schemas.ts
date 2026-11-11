import { z } from "zod";

export const crearLoteSchema = z.object({
  nombre: z.string().min(1),
  inscriptoIds: z.array(z.string().uuid()).min(1),
});

export const asignarParSchema = z.object({
  parId: z.string().uuid(),
});
