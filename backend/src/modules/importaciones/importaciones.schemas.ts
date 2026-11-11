import { z } from "zod";

const tipoDatoSchema = z.enum([
  "TEXTO",
  "TEXTO_LARGO",
  "NUMERO",
  "FECHA",
  "OPCION_UNICA",
  "OPCION_MULTIPLE",
  "BOOLEANO",
  "URL",
]);

const rolEspecialSchema = z.enum([
  "NOMBRE_COMPLETO",
  "EMAIL",
  "DNI",
  "TELEFONO",
  "FECHA_NACIMIENTO",
  "ZONA_GRUPO",
]);

export const cambiarHojaSchema = z.object({
  hoja: z.string().min(1),
});

const entradaMapeoSchema = z.discriminatedUnion("accion", [
  z.object({
    accion: z.literal("ignorar"),
    nombreExcel: z.string().min(1),
  }),
  z.object({
    accion: z.literal("existente"),
    nombreExcel: z.string().min(1),
    campoId: z.string().uuid(),
    rolEspecial: rolEspecialSchema.optional(),
  }),
  z.object({
    accion: z.literal("nueva"),
    nombreExcel: z.string().min(1),
    campoNuevo: z.object({
      etiqueta: z.string().min(1),
      tipoDato: tipoDatoSchema,
      esIdentificatorio: z.boolean().optional(),
      esEvaluable: z.boolean().optional(),
      puntajeMaximo: z.number().int().min(0).max(100).optional(),
    }),
    rolEspecial: rolEspecialSchema.optional(),
  }),
]);

export const guardarMapeoSchema = z.object({
  columnas: z.array(entradaMapeoSchema).min(1),
});

export type EntradaMapeo = z.infer<typeof entradaMapeoSchema>;
