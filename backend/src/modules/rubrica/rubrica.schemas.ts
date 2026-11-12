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

// Agrupación bajo un criterio evaluable (ver CampoFormulario.padreId en el schema de Prisma).
export const agrupacionCampoSchema = {
  padreId: z.string().uuid().nullable().optional(),
  agrupador: z.string().trim().max(80).nullable().optional(),
  etiquetaCorta: z.string().trim().max(200).nullable().optional(),
};

export const crearCampoSchema = z
  .object({
    clave: z.string().min(1).optional(),
    etiqueta: z.string().min(1),
    tipoDato: tipoDatoSchema,
    esIdentificatorio: z.boolean().default(false),
    esEvaluable: z.boolean().default(false),
    puntajeMaximo: z.number().int().min(0).max(100).optional(),
    rolEspecial: rolEspecialSchema.optional(),
    orden: z.number().int().optional(),
    ...agrupacionCampoSchema,
  })
  .refine((data) => !data.esEvaluable || data.puntajeMaximo != null, {
    message: "Un campo evaluable necesita puntajeMaximo",
    path: ["puntajeMaximo"],
  });

export const actualizarCampoSchema = z.object({
  etiqueta: z.string().min(1).optional(),
  tipoDato: tipoDatoSchema.optional(),
  esIdentificatorio: z.boolean().optional(),
  esEvaluable: z.boolean().optional(),
  puntajeMaximo: z.number().int().min(0).max(100).nullable().optional(),
  rolEspecial: rolEspecialSchema.nullable().optional(),
  orden: z.number().int().optional(),
  activo: z.boolean().optional(),
  ...agrupacionCampoSchema,
});
