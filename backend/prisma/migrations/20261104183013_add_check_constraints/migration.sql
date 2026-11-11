-- Reglas de negocio de una sola fila (lo agregado/entre-filas se valida en la capa de servicio).
ALTER TABLE "pares_evaluadores"
  ADD CONSTRAINT "pares_evaluadores_evaluadores_distintos" CHECK ("evaluador_1_id" <> "evaluador_2_id");

ALTER TABLE "evaluacion_detalles"
  ADD CONSTRAINT "evaluacion_detalles_puntaje_no_negativo" CHECK ("puntaje" >= 0);

ALTER TABLE "campos_formulario"
  ADD CONSTRAINT "campos_formulario_evaluable_requiere_puntaje" CHECK (NOT "es_evaluable" OR "puntaje_maximo" IS NOT NULL);
