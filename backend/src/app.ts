import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler } from "./shared/errors";
import { authRouter } from "./modules/auth/auth.routes";
import { usuariosRouter } from "./modules/usuarios/usuarios.routes";
import { gruposRouter } from "./modules/grupos/grupos.routes";
import { rubricaRouter } from "./modules/rubrica/rubrica.routes";
import { importacionesRouter } from "./modules/importaciones/importaciones.routes";
import { paresRouter } from "./modules/pares/pares.routes";
import { lotesRouter } from "./modules/lotes/lotes.routes";
import { inscriptosRouter } from "./modules/inscriptos/inscriptos.routes";
import { evaluacionesRouter } from "./modules/evaluaciones/evaluaciones.routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(",") ?? "*",
    }),
  );
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/auth", authRouter);
  app.use("/usuarios", usuariosRouter);
  app.use("/grupos", gruposRouter);
  app.use("/rubrica", rubricaRouter);
  app.use("/importaciones", importacionesRouter);
  app.use("/pares", paresRouter);
  app.use("/lotes", lotesRouter);
  app.use("/inscriptos", inscriptosRouter);
  app.use("/evaluaciones", evaluacionesRouter);

  app.use(errorHandler);

  return app;
}
