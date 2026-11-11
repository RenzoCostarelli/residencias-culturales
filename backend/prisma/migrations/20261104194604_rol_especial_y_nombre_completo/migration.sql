-- CreateEnum
CREATE TYPE "RolEspecialCampo" AS ENUM ('NOMBRE_COMPLETO', 'EMAIL', 'DNI', 'TELEFONO', 'FECHA_NACIMIENTO', 'ZONA_GRUPO');

-- AlterTable
ALTER TABLE "campos_formulario" ADD COLUMN     "rol_especial" "RolEspecialCampo";

-- AlterTable
ALTER TABLE "importaciones_excel" ADD COLUMN     "hoja_seleccionada" TEXT,
ADD COLUMN     "ruta_archivo" TEXT;

-- AlterTable
ALTER TABLE "inscriptos" DROP COLUMN "apellido",
DROP COLUMN "nombre",
ADD COLUMN     "nombre_completo" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "campos_formulario_rol_especial_key" ON "campos_formulario"("rol_especial");
