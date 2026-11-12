import { z } from "zod";
import { agrupacionCampoSchema } from "../rubrica/rubrica.schemas";

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
    // Si vienen, se actualiza la agrupación del campo existente (ej. columnas importadas antes
    // de que existiera el concepto de criterio padre).
    ...agrupacionCampoSchema,
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
      ...agrupacionCampoSchema,
    }),
    rolEspecial: rolEspecialSchema.optional(),
  }),
]);

export const guardarMapeoSchema = z.object({
  columnas: z.array(entradaMapeoSchema).min(1),
});

export type EntradaMapeo = z.infer<typeof entradaMapeoSchema>;
