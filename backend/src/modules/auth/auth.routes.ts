import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../../middlewares/requireAuth";
import { cambiarPasswordHandler, loginHandler, meHandler } from "./auth.controller";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos de login, probá de nuevo más tarde" },
});

export const authRouter = Router();

authRouter.post("/login", loginLimiter, loginHandler);
authRouter.get("/me", requireAuth, meHandler);
authRouter.post("/cambiar-password", requireAuth, cambiarPasswordHandler);
