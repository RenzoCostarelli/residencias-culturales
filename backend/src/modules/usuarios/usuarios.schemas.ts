import { z } from "zod";

const rolSchema = z.enum(["SUPERADMIN", "ADMIN_GRUPO", "EVALUADOR"]);

// La contraseña no se elige: la genera el sistema al crear o restablecer, y el usuario la cambia
// desde /auth/cambiar-password.
export const crearUsuarioSchema = z.object({
  email: z.string().email(),
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  rol: rolSchema,
});

export const actualizarUsuarioSchema = z.object({
  nombre: z.string().min(1).optional(),
  apellido: z.string().min(1).optional(),
  rol: rolSchema.optional(),
  activo: z.boolean().optional(),
});

export const listarUsuariosQuerySchema = z.object({
  rol: rolSchema.optional(),
  // z.coerce.boolean() convertía "false" en true (string no vacío); se parsea a mano.
  activo: z
    .enum(["true", "false"])
    .transform((valor) => valor === "true")
    .optional(),
});
