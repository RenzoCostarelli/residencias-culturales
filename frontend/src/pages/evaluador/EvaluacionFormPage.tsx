import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enviarEvaluacion, obtenerEvaluacionCompanero, obtenerEvaluacionPropia } from "../../api/evaluaciones";
import { extraerMensajeError } from "../../api/client";
import { formatearFecha, nombreCompleto } from "../../lib/etiquetas";
import { Button } from "../../components/ui/Button";
import { Select, Textarea } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { Badge, badgeEstadoPreseleccion } from "../../components/ui/Badge";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { Alerta, Spinner } from "../../components/ui/Feedback";
import { SeccionDocumentos } from "./DocumentosInscripto";
import type { CriterioEvaluacion, EvaluacionPropia } from "../../types";

function opcionesPuntaje(maximo: number): string[] {
  const max = Math.max(0, Math.round(maximo));
  return Array.from({ length: max + 1 }, (_, i) => String(i));
}

// Pantalla dedicada a la evaluación en sí: asume que la preselección ya está aprobada
// (si no lo está, redirige a esa pantalla, que es la única que muestra la validación de documentos).
export function EvaluacionFormPage() {
  const { inscriptoId } = useParams<{ inscriptoId: string }>();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["evaluacion-mia", inscriptoId],
    queryFn: () => obtenerEvaluacionPropia(inscriptoId!),
    enabled: !!inscriptoId,
  });

  const invalidarTodo = () => {
    queryClient.invalidateQueries({ queryKey: ["evaluacion-mia", inscriptoId] });
    queryClient.invalidateQueries({ queryKey: ["companero", inscriptoId] });
    queryClient.invalidateQueries({ queryKey: ["asignados"] });
    queryClient.invalidateQueries({ queryKey: ["mis-grupos"] });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error || !data || !inscriptoId) {
    return (
      <div className="flex flex-col gap-4">
        <Link to="/evaluador" className="text-sm text-text-muted hover:text-text">
          ← Evaluaciones
        </Link>
        <Alerta>{extraerMensajeError(error, "No se pudo cargar el inscripto")}</Alerta>
      </div>
    );
  }

  const pre = data.preseleccion;

  if (pre.estado !== "APROBADO") {
    return <Navigate to={`/evaluador/inscriptos/${inscriptoId}/preseleccion`} replace />;
  }

  const badgePre = badgeEstadoPreseleccion(pre.estado);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/evaluador" className="text-sm text-text-muted hover:text-text">
          ← Evaluaciones
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-text">{data.inscripto.nombreCompleto}</h1>
        <p className="font-mono text-sm text-text-muted">{data.inscripto.uid}</p>
        <p className="mt-2 text-sm text-text-muted">
          Preselección: <Badge tono={badgePre.tono}>{badgePre.label}</Badge>{" "}
          <Link to={`/evaluador/inscriptos/${inscriptoId}/preseleccion`} className="text-primary hover:underline">
            ver detalle
          </Link>
        </p>
      </div>

      <SeccionDocumentos documentos={pre.documentos} />

      {data.evaluacion ? (
        <EvaluacionEnviada data={data} inscriptoId={inscriptoId} />
      ) : (
        <FormularioEvaluacion data={data} inscriptoId={inscriptoId} onEnviada={invalidarTodo} />
      )}
    </div>
  );
}

function RespuestasCriterio({ criterio }: { criterio: CriterioEvaluacion }) {
  const sinRespuesta = !criterio.respuestaInscripto && criterio.grupos.length === 0;

  return (
    <div className="mt-2 flex flex-col gap-2">
      {criterio.respuestaInscripto && (
        <p className="text-sm whitespace-pre-wrap text-text-muted">{criterio.respuestaInscripto}</p>
      )}
      {criterio.grupos.map((g) => (
        <div key={g.agrupador || "_"} className="rounded-md bg-surface-muted px-3 py-2">
          {g.agrupador && (
            <p className="text-xs font-semibold tracking-wide text-text-muted uppercase">{g.agrupador}</p>
          )}
          <dl className="mt-1 flex flex-col gap-1 text-sm">
            {g.campos.map((c) => (
              <div key={c.campoId}>
                <dt className="inline font-medium text-text">{c.etiqueta}: </dt>
                <dd className="inline whitespace-pre-wrap text-text-muted">{c.valor}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
      {sinRespuesta && <p className="text-sm text-text-faint italic">Sin respuesta</p>}
    </div>
  );
}

function FormularioEvaluacion({
  data,
  inscriptoId,
  onEnviada,
}: {
  data: EvaluacionPropia;
  inscriptoId: string;
  onEnviada: () => void;
}) {
  const [puntajes, setPuntajes] = useState<Record<string, string>>({});
  const [comentarioGeneral, setComentarioGeneral] = useState("");
  const [confirmar, setConfirmar] = useState(false);

  const enviar = useMutation({
    mutationFn: () =>
      enviarEvaluacion(inscriptoId, {
        puntajes: data.criterios.map((c) => ({ campoId: c.campoId, puntaje: Number(puntajes[c.campoId]) })),
        comentarioGeneral: comentarioGeneral.trim() || undefined,
      }),
    onSuccess: () => {
      setConfirmar(false);
      onEnviada();
    },
  });

  const faltantes = data.criterios.filter((c) => !puntajes[c.campoId] && puntajes[c.campoId] !== "0");
  const total = data.criterios.reduce((acc, c) => acc + (Number(puntajes[c.campoId]) || 0), 0);

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-medium text-text">Evaluación</h2>
        <p className="text-sm text-text-muted">
          Puntuá todos los criterios. La evaluación se envía completa de una sola vez y no se puede
          modificar después.
        </p>
      </div>

      {data.criterios.map((c) => (
        <Card key={c.campoId}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-text">{c.etiqueta}</p>
              <RespuestasCriterio criterio={c} />
            </div>
            <div className="w-28 flex-none">
              <Select
                aria-label={`Puntaje de ${c.etiqueta}`}
                required
                value={puntajes[c.campoId] ?? ""}
                onChange={(e) => setPuntajes((p) => ({ ...p, [c.campoId]: e.target.value }))}
              >
                <option value="">—</option>
                {opcionesPuntaje(Number(c.puntajeMaximo)).map((valor) => (
                  <option key={valor} value={valor}>
                    {valor}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-right text-xs text-text-faint">máx. {c.puntajeMaximo}</p>
            </div>
          </div>
        </Card>
      ))}

      <Textarea
        id="comentario-general"
        label="Comentario general (opcional)"
        rows={3}
        value={comentarioGeneral}
        onChange={(e) => setComentarioGeneral(e.target.value)}
      />

      <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-5 py-3">
        <p className="text-sm text-text-muted">Puntaje total</p>
        <p className="text-lg font-semibold text-text">
          {total} / {data.puntajeMaximoTotal}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {enviar.error && <Alerta>{extraerMensajeError(enviar.error)}</Alerta>}
        {faltantes.length > 0 && (
          <p className="text-sm text-text-muted">
            Faltan puntuar {faltantes.length} criterio{faltantes.length === 1 ? "" : "s"}
          </p>
        )}
        <Button type="button" disabled={faltantes.length > 0 || enviar.isPending} onClick={() => setConfirmar(true)}>
          Enviar evaluación
        </Button>
      </div>

      <ConfirmModal
        open={confirmar}
        title="Enviar evaluación"
        confirmLabel="Enviar"
        pending={enviar.isPending}
        error={enviar.error ? extraerMensajeError(enviar.error) : null}
        onConfirm={() => enviar.mutate()}
        onClose={() => setConfirmar(false)}
      >
        Vas a enviar la evaluación de <strong>{data.inscripto.nombreCompleto}</strong> con un puntaje total de{" "}
        <strong>
          {total} / {data.puntajeMaximoTotal}
        </strong>
        . Una vez enviada no se puede modificar.
      </ConfirmModal>
    </section>
  );
}

function EvaluacionEnviada({ data, inscriptoId }: { data: EvaluacionPropia; inscriptoId: string }) {
  const companero = useQuery({
    queryKey: ["companero", inscriptoId],
    queryFn: () => obtenerEvaluacionCompanero(inscriptoId),
    retry: false,
  });
  const evaluacion = data.evaluacion!;

  return (
    <section className="flex flex-col gap-4">
      <Alerta tipo="exito">
        Enviaste tu evaluación el {formatearFecha(evaluacion.fechaCompletada)}. Puntaje total:{" "}
        <strong>
          {evaluacion.puntajeTotal} / {data.puntajeMaximoTotal}
        </strong>
        {data.inscripto.puntajeFinal && (
          <>
            {" "}
            · Promedio del par: <strong>{data.inscripto.puntajeFinal}</strong>
          </>
        )}
      </Alerta>

      {data.criterios.map((c) => (
        <Card key={c.campoId}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-text">{c.etiqueta}</p>
              <RespuestasCriterio criterio={c} />
            </div>
            <div className="w-28 flex-none text-right">
              <p className="text-lg font-semibold text-text">{c.puntajeAsignado ?? "—"}</p>
              <p className="text-xs text-text-faint">máx. {c.puntajeMaximo}</p>
            </div>
          </div>
        </Card>
      ))}

      {evaluacion.comentarioGeneral && (
        <Card>
          <p className="text-sm font-medium text-text">Comentario general</p>
          <p className="mt-1 text-sm whitespace-pre-wrap text-text-muted">{evaluacion.comentarioGeneral}</p>
        </Card>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-text-muted uppercase">Evaluación del compañero</h2>
        {companero.isLoading ? (
          <Spinner />
        ) : companero.isError || !companero.data ? (
          <Card>
            <p className="text-sm text-text-muted">
              Todavía no está disponible: hace falta que tu compañero de par envíe su evaluación.
            </p>
          </Card>
        ) : (
          <Card>
            <p className="mb-3 text-sm text-text-muted">
              {nombreCompleto(companero.data.evaluador)} · puntaje total:{" "}
              <span className="font-semibold text-text">{companero.data.puntajeTotal}</span>
            </p>
            <ul className="flex flex-col gap-2">
              {companero.data.detalles.map((d) => (
                <li key={d.campoId} className="flex justify-between text-sm">
                  <span className="text-text-muted">{d.campo.etiqueta}</span>
                  <span className="text-text">{d.puntaje}</span>
                </li>
              ))}
            </ul>
            {companero.data.comentarioGeneral && (
              <p className="mt-3 text-sm whitespace-pre-wrap text-text-muted">{companero.data.comentarioGeneral}</p>
            )}
          </Card>
        )}
      </section>
    </section>
  );
}
