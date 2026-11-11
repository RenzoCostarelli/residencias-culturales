-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('SUPERADMIN', 'ADMIN_GRUPO', 'EVALUADOR');

-- CreateEnum
CREATE TYPE "EstadoEvaluacionInscripto" AS ENUM ('PENDIENTE', 'EN_PROGRESO', 'EVALUADO');

-- CreateEnum
CREATE TYPE "ResultadoFinalInscripto" AS ENUM ('PENDIENTE', 'ACEPTADO', 'RECHAZADO', 'LISTA_ESPERA');

-- CreateEnum
CREATE TYPE "TipoDatoCampo" AS ENUM ('TEXTO', 'TEXTO_LARGO', 'NUMERO', 'FECHA', 'OPCION_UNICA', 'OPCION_MULTIPLE', 'BOOLEANO', 'URL');

-- CreateEnum
CREATE TYPE "EstadoImportacion" AS ENUM ('PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'ERROR');

-- CreateEnum
CREATE TYPE "EstadoEvaluacion" AS ENUM ('BORRADOR', 'COMPLETA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grupos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupo_administradores" (
    "grupo_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grupo_administradores_pkey" PRIMARY KEY ("grupo_id","usuario_id")
);

-- CreateTable
CREATE TABLE "pares_evaluadores" (
    "id" TEXT NOT NULL,
    "grupo_id" TEXT NOT NULL,
    "evaluador_1_id" TEXT NOT NULL,
    "evaluador_2_id" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pares_evaluadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes" (
    "id" TEXT NOT NULL,
    "grupo_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "par_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campos_formulario" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "etiqueta" TEXT NOT NULL,
    "tipo_dato" "TipoDatoCampo" NOT NULL,
    "es_identificatorio" BOOLEAN NOT NULL DEFAULT false,
    "es_evaluable" BOOLEAN NOT NULL DEFAULT false,
    "puntaje_maximo" DECIMAL(5,2),
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campos_formulario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "importaciones_excel" (
    "id" TEXT NOT NULL,
    "archivo_nombre" TEXT NOT NULL,
    "archivo_hash" TEXT NOT NULL,
    "filas_totales" INTEGER NOT NULL DEFAULT 0,
    "filas_importadas" INTEGER NOT NULL DEFAULT 0,
    "filas_error" INTEGER NOT NULL DEFAULT 0,
    "mapeo_columnas" JSONB,
    "estado" "EstadoImportacion" NOT NULL DEFAULT 'PENDIENTE',
    "importado_por" TEXT,
    "log_errores" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "importaciones_excel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscriptos" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT,
    "dni" TEXT,
    "telefono" TEXT,
    "fecha_nacimiento" TIMESTAMP(3),
    "grupo_id" TEXT,
    "lote_id" TEXT,
    "par_id" TEXT,
    "estado_evaluacion" "EstadoEvaluacionInscripto" NOT NULL DEFAULT 'PENDIENTE',
    "resultado_final" "ResultadoFinalInscripto" NOT NULL DEFAULT 'PENDIENTE',
    "puntaje_final" DECIMAL(5,2),
    "resultado_decidido_por" TEXT,
    "resultado_decidido_at" TIMESTAMP(3),
    "importacion_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscriptos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "respuestas_inscripto" (
    "id" TEXT NOT NULL,
    "inscripto_id" TEXT NOT NULL,
    "campo_id" TEXT NOT NULL,
    "valor_texto" TEXT,

    CONSTRAINT "respuestas_inscripto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluaciones" (
    "id" TEXT NOT NULL,
    "inscripto_id" TEXT NOT NULL,
    "evaluador_id" TEXT NOT NULL,
    "estado" "EstadoEvaluacion" NOT NULL DEFAULT 'BORRADOR',
    "puntaje_total" DECIMAL(5,2),
    "comentario_general" TEXT,
    "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_completada" TIMESTAMP(3),

    CONSTRAINT "evaluaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluacion_detalles" (
    "id" TEXT NOT NULL,
    "evaluacion_id" TEXT NOT NULL,
    "campo_id" TEXT NOT NULL,
    "puntaje" DECIMAL(5,2) NOT NULL,
    "comentario" TEXT,

    CONSTRAINT "evaluacion_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "grupos_nombre_key" ON "grupos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "pares_evaluadores_grupo_id_evaluador_1_id_evaluador_2_id_key" ON "pares_evaluadores"("grupo_id", "evaluador_1_id", "evaluador_2_id");

-- CreateIndex
CREATE UNIQUE INDEX "campos_formulario_clave_key" ON "campos_formulario"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "inscriptos_uid_key" ON "inscriptos"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "inscriptos_dni_key" ON "inscriptos"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "respuestas_inscripto_inscripto_id_campo_id_key" ON "respuestas_inscripto"("inscripto_id", "campo_id");

-- CreateIndex
CREATE UNIQUE INDEX "evaluaciones_inscripto_id_evaluador_id_key" ON "evaluaciones"("inscripto_id", "evaluador_id");

-- CreateIndex
CREATE UNIQUE INDEX "evaluacion_detalles_evaluacion_id_campo_id_key" ON "evaluacion_detalles"("evaluacion_id", "campo_id");

-- AddForeignKey
ALTER TABLE "grupo_administradores" ADD CONSTRAINT "grupo_administradores_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_administradores" ADD CONSTRAINT "grupo_administradores_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pares_evaluadores" ADD CONSTRAINT "pares_evaluadores_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pares_evaluadores" ADD CONSTRAINT "pares_evaluadores_evaluador_1_id_fkey" FOREIGN KEY ("evaluador_1_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pares_evaluadores" ADD CONSTRAINT "pares_evaluadores_evaluador_2_id_fkey" FOREIGN KEY ("evaluador_2_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_par_id_fkey" FOREIGN KEY ("par_id") REFERENCES "pares_evaluadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptos" ADD CONSTRAINT "inscriptos_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptos" ADD CONSTRAINT "inscriptos_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptos" ADD CONSTRAINT "inscriptos_par_id_fkey" FOREIGN KEY ("par_id") REFERENCES "pares_evaluadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptos" ADD CONSTRAINT "inscriptos_importacion_id_fkey" FOREIGN KEY ("importacion_id") REFERENCES "importaciones_excel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_inscripto" ADD CONSTRAINT "respuestas_inscripto_inscripto_id_fkey" FOREIGN KEY ("inscripto_id") REFERENCES "inscriptos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_inscripto" ADD CONSTRAINT "respuestas_inscripto_campo_id_fkey" FOREIGN KEY ("campo_id") REFERENCES "campos_formulario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones" ADD CONSTRAINT "evaluaciones_inscripto_id_fkey" FOREIGN KEY ("inscripto_id") REFERENCES "inscriptos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones" ADD CONSTRAINT "evaluaciones_evaluador_id_fkey" FOREIGN KEY ("evaluador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluacion_detalles" ADD CONSTRAINT "evaluacion_detalles_evaluacion_id_fkey" FOREIGN KEY ("evaluacion_id") REFERENCES "evaluaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluacion_detalles" ADD CONSTRAINT "evaluacion_detalles_campo_id_fkey" FOREIGN KEY ("campo_id") REFERENCES "campos_formulario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
