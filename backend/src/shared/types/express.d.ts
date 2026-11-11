import type { RolUsuario } from "../prisma";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        rol: RolUsuario;
      };
    }
  }
}

export {};
