import { z } from "zod";

export const asignadosQuerySchema = z.object({
  grupoId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(13),
  estado: z.enum(["PENDIENTE", "EN_PROGRESO", "EVALUADO"]).optional(),
});

export const asignadosPreseleccionQuerySchema = z.object({
  grupoId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(13),
  estado: z.enum(["PENDIENTE", "APROBADO", "RECHAZADO"]).optional(),
});

export const preseleccionSchema = z.object({
  documentos: z.array(
    z.object({
      campoId: z.string().uuid(),
      estado: z.enum(["CORRECTO", "FALTANTE", "INCORRECTO"]),
      observacion: z.string().max(1000).optional(),
    }),
  ),
  resultado: z.enum(["APROBADO", "RECHAZADO"]),
  observacion: z.string().max(2000).optional(),
});

// Sin borradores: se envían todos los puntajes de una vez.
export const enviarEvaluacionSchema = z.object({
  puntajes: z
    .array(
      z.object({
        campoId: z.string().uuid(),
        puntaje: z.number().int().min(0),
      }),
    )
    .min(1),
  comentarioGeneral: z.string().max(5000).optional(),
});
