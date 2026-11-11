import crypto from "crypto";
import path from "path";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { AppError } from "../../shared/errors";
import { UPLOADS_DIR } from "./importaciones.service";

const EXTENSIONES_PERMITIDAS = [".xlsx", ".xls", ".csv"];

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    cb(null, `${crypto.randomUUID()}${path.extname(file.originalname)}`);
  },
});

const uploadExcel = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!EXTENSIONES_PERMITIDAS.includes(ext)) {
      cb(new Error("Solo se aceptan archivos .xlsx, .xls o .csv"));
      return;
    }
    cb(null, true);
  },
}).single("archivo");

export function uploadExcelMiddleware(req: Request, res: Response, next: NextFunction) {
  uploadExcel(req, res, (err: unknown) => {
    if (err) {
      next(new AppError(400, err instanceof Error ? err.message : "No se pudo procesar el archivo"));
      return;
    }
    next();
  });
}
