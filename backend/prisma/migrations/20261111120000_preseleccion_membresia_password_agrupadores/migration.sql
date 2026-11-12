-- Limpieza previa (datos de prueba, decisión del 2026-11-11): las evaluaciones dejan de tener
-- borradores, así que las que nunca se completaron se descartan y los inscriptos que solo
-- tenían borradores vuelven a PENDIENTE.
DELETE FROM "evaluaciones" WHERE "estado" = 'BORRADOR';

UPDATE "inscriptos" SET "estado_evaluacion" = 'PENDIENTE'
  WHERE "estado_evaluacion" = 'EN_PROGRESO'
    AND NOT EXISTS (SELECT 1 FROM "evaluaciones" e WHERE e."inscripto_id" = "inscriptos"."id");

-- CreateEnum
CREATE TYPE "EstadoPreseleccion" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "EstadoDocumentoPreseleccion" AS ENUM ('CORRECTO', 'FALTANTE', 'INCORRECTO');

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "debe_cambiar_password" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "campos_formulario" ADD COLUMN     "agrupador" TEXT,
ADD COLUMN     "etiqueta_corta" TEXT,
ADD COLUMN     "padre_id" TEXT;

-- AlterTable
ALTER TABLE "inscriptos" ADD COLUMN     "estado_preseleccion" "EstadoPreseleccion" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "preseleccion_at" TIMESTAMP(3),
ADD COLUMN     "preseleccion_observacion" TEXT,
ADD COLUMN     "preseleccion_por" TEXT;

-- AlterTable
ALTER TABLE "evaluaciones" DROP COLUMN "estado",
DROP COLUMN "fecha_inicio",
ALTER COLUMN "puntaje_total" SET NOT NULL,
ALTER COLUMN "fecha_completada" SET NOT NULL,
ALTER COLUMN "fecha_completada" SET DEFAULT CURRENT_TIMESTAMP;

-- DropEnum
DROP TYPE "EstadoEvaluacion";

-- CreateTable
CREATE TABLE "grupo_evaluadores" (
    "grupo_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grupo_evaluadores_pkey" PRIMARY KEY ("grupo_id","usuario_id")
);

-- CreateTable
CREATE TABLE "preseleccion_documentos" (
    "id" TEXT NOT NULL,
    "inscripto_id" TEXT NOT NULL,
    "campo_id" TEXT NOT NULL,
    "estado" "EstadoDocumentoPreseleccion" NOT NULL,
    "observacion" TEXT,

    CONSTRAINT "preseleccion_documentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "preseleccion_documentos_inscripto_id_campo_id_key" ON "preseleccion_documentos"("inscripto_id", "campo_id");

-- AddForeignKey
ALTER TABLE "grupo_evaluadores" ADD CONSTRAINT "grupo_evaluadores_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_evaluadores" ADD CONSTRAINT "grupo_evaluadores_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campos_formulario" ADD CONSTRAINT "campos_formulario_padre_id_fkey" FOREIGN KEY ("padre_id") REFERENCES "campos_formulario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptos" ADD CONSTRAINT "inscriptos_preseleccion_por_fkey" FOREIGN KEY ("preseleccion_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preseleccion_documentos" ADD CONSTRAINT "preseleccion_documentos_inscripto_id_fkey" FOREIGN KEY ("inscripto_id") REFERENCES "inscriptos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preseleccion_documentos" ADD CONSTRAINT "preseleccion_documentos_campo_id_fkey" FOREIGN KEY ("campo_id") REFERENCES "campos_formulario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
