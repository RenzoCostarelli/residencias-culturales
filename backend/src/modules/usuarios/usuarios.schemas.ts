import { z } from "zod";

const rolSchema = z.enum(["SUPERADMIN", "ADMIN_GRUPO", "EVALUADOR"]);

export const crearUsuarioSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  rol: rolSchema,
});

export const actualizarUsuarioSchema = z.object({
  nombre: z.string().min(1).optional(),
  apellido: z.string().min(1).optional(),
  rol: rolSchema.optional(),
  activo: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

export const listarUsuariosQuerySchema = z.object({
  rol: rolSchema.optional(),
  activo: z.coerce.boolean().optional(),
});
