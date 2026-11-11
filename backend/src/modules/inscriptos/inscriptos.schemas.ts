import { z } from "zod";

export const asignarGrupoSchema = z.object({
  grupoId: z.string().uuid().nullable(),
});

export const asignarGrupoLoteSchema = z.object({
  inscriptoIds: z.array(z.string().uuid()).min(1),
  grupoId: z.string().uuid(),
});

export const resultadoFinalSchema = z.object({
  resultadoFinal: z.enum(["PENDIENTE", "ACEPTADO", "RECHAZADO", "LISTA_ESPERA"]),
});
