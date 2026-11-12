import { z } from "zod";

export const crearGrupoSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
});

export const actualizarGrupoSchema = z.object({
  nombre: z.string().min(1).optional(),
  descripcion: z.string().optional(),
});

export const administradorGrupoSchema = z.object({
  usuarioId: z.string().uuid(),
});

export const evaluadorGrupoSchema = z.object({
  usuarioId: z.string().uuid(),
});
