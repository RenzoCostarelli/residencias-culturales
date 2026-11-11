import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  completarEvaluacion,
  guardarBorrador,
  obtenerEvaluacionCompanero,
  obtenerEvaluacionPropia,
} from "../../api/evaluaciones";
import { extraerMensajeError } from "../../api/client";
import { urlMiniaturaDrive } from "../../lib/drive";
import { Button } from "../../components/ui/Button";
import { Select, Textarea } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { Alerta, Spinner } from "../../components/ui/Feedback";
import type { DocumentoInscripto } from "../../types";

function opcionesPuntaje(maximo: number): string[] {
  const max = Math.max(0, Math.round(maximo));
  return Array.from({ length: max + 1 }, (_, i) => String(i));
}

export function EvaluacionFormPage() {
  const { inscriptoId } = useParams<{ inscriptoId: string }>();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["evaluacion-mia", inscriptoId],
    queryFn: () => obtenerEvaluacionPropia(inscriptoId!),
    enabled: !!inscriptoId,
  });

  const [puntajes, setPuntajes] = useState<Record<string, string>>({});
  const [comentarios, setComentarios] = useState<Record<string, string>>({});
  const [comentarioGeneral, setComentarioGeneral] = useState("");

  useEffect(() => {
    if (!data) return;
    setPuntajes(
      Object.fromEntries(
        data.criterios.map((c) => [c.campoId, c.puntajeAsignado ?? ""]),
      ),
    );
    setComentarios(
      Object.fromEntries(
        data.criterios.map((c) => [c.campoId, c.comentario ?? ""]),
      ),
    );
    setComentarioGeneral(data.comentarioGeneral ?? "");
  }, [data]);

  const construirBorrador = () => ({
    puntajes: Object.entries(puntajes)
      .filter(([, v]) => v !== "")
      .map(([campoId, v]) => ({
        campoId,
        puntaje: Number(v),
        comentario: comentarios[campoId] || undefined,
      })),
    comentarioGeneral: comentarioGeneral || undefined,
  });

  const guardar = useMutation({
    mutationFn: () => guardarBorrador(inscriptoId!, construirBorrador()),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["evaluacion-mia", inscriptoId],
      }),
  });

  const completar = useMutation({
    mutationFn: async () => {
      await guardarBorrador(inscriptoId!, construirBorrador());
      return completarEvaluacion(inscriptoId!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["evaluacion-mia", inscriptoId],
      });
      queryClient.invalidateQueries({ queryKey: ["companero", inscriptoId] });
      queryClient.invalidateQueries({ queryKey: ["asignados"] });
    },
  });

  const companero = useQuery({
    queryKey: ["companero", inscriptoId],
    queryFn: () => obtenerEvaluacionCompanero(inscriptoId!),
    enabled: !!inscriptoId && data?.estado === "COMPLETA",
    retry: false,
  });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const esCompleta = data.estado === "COMPLETA";
  const total = Object.values(puntajes).reduce(
    (acc, v) => acc + (Number(v) || 0),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/evaluador"
          className="text-sm text-text-muted hover:text-text"
        >
          ← Evaluaciones
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-text">
          {data.inscripto.nombreCompleto}
        </h1>
        <p className="text-sm text-text-muted">{data.inscripto.uid}</p>
      </div>

      {esCompleta && (
        <Alerta tipo="exito">
          Ya completaste esta evaluación. Puntaje total: {data.puntajeTotal}
        </Alerta>
      )}

      <SeccionDocumentos documentos={data.documentos} />

      <div className="flex flex-col gap-4">
        {data.criterios.map((c) => (
          <Card key={c.campoId}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-text">{c.etiqueta}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-text-muted">
                  {c.respuestaInscripto || (
                    <span className="text-text-faint italic">
                      Sin respuesta
                    </span>
                  )}
                </p>
              </div>
              <div className="w-28 flex-none">
                <Select
                  disabled={esCompleta}
                  value={puntajes[c.campoId] ?? ""}
                  onChange={(e) =>
                    setPuntajes((p) => ({ ...p, [c.campoId]: e.target.value }))
                  }
                  className="disabled:bg-surface-muted"
                >
                  <option value="">—</option>
                  {opcionesPuntaje(Number(c.puntajeMaximo)).map((valor) => (
                    <option key={valor} value={valor}>
                      {valor}
                    </option>
                  ))}
                </Select>
                <p className="mt-1 text-right text-xs text-text-faint">
                  máx. {c.puntajeMaximo}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Textarea
        label="Comentario general (opcional)"
        disabled={esCompleta}
        value={comentarioGeneral}
        onChange={(e) => setComentarioGeneral(e.target.value)}
      />

      <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-5 py-3">
        <p className="text-sm text-text-muted">Puntaje total</p>
        <p className="text-lg font-semibold text-text">{total} / 100</p>
      </div>

      {!esCompleta && (
        <div className="flex items-center justify-end gap-3">
          {(guardar.error || completar.error) && (
            <Alerta>
              {extraerMensajeError(guardar.error ?? completar.error)}
            </Alerta>
          )}
          <Button
            variante="secondary"
            onClick={() => guardar.mutate()}
            disabled={guardar.isPending}
          >
            {guardar.isPending ? "Guardando..." : "Guardar borrador"}
          </Button>
          <Button
            onClick={() => completar.mutate()}
            disabled={completar.isPending}
          >
            {completar.isPending ? "Completando..." : "Completar evaluación"}
          </Button>
        </div>
      )}

      {esCompleta && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
            Evaluación del compañero
          </h2>
          {companero.isLoading ? (
            <Spinner />
          ) : companero.isError ? (
            <Card>
              <p className="text-sm text-text-muted">
                Todavía no está disponible: hace falta que tu compañero de par
                complete su evaluación.
              </p>
            </Card>
          ) : (
            <Card>
              <p className="mb-3 text-sm text-text-muted">
                Puntaje total del compañero:{" "}
                <span className="font-semibold text-text">
                  {companero.data?.puntajeTotal}
                </span>
              </p>
              <ul className="flex flex-col gap-2">
                {companero.data?.detalles.map((d) => (
                  <li key={d.campoId} className="flex justify-between text-sm">
                    <span className="text-text-muted">{d.campo.etiqueta}</span>
                    <span className="text-text">{d.puntaje}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
      )}
    </div>
  );
}

function SeccionDocumentos({
  documentos,
}: {
  documentos: DocumentoInscripto[];
}) {
  if (!documentos.length) {
    return null;
  }

  const foto = documentos.find((d) => d.esFoto);
  const otros = documentos.filter((d) => !d.esFoto);
  console.log("foto", foto);

  return (
    <Card>
      <div className="flex flex-wrap items-start gap-6">
        {foto && <FotoInscripto documento={foto} />}
        {otros.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-text">Documentos adjuntos</p>
            <ul className="flex flex-col gap-1">
              {otros.map((d) => (
                <li key={d.campoId}>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {d.etiqueta} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

function FotoInscripto({ documento }: { documento: DocumentoInscripto }) {
  const [error, setError] = useState(false);
  const miniatura = urlMiniaturaDrive(documento.url);
  console.log("miniatura", miniatura);
  console.log("error", error);

  if (error || !miniatura) {
    return (
      <a
        href={documento.url}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-primary hover:underline"
      >
        Ver {documento.etiqueta} ↗
      </a>
    );
  }

  return (
    <a
      href={documento.url}
      target="_blank"
      rel="noreferrer"
      className="flex-none"
    >
      <img
        src={miniatura}
        alt={documento.etiqueta}
        onError={() => setError(true)}
        className="h-32 w-32 rounded-md border border-border object-cover"
      />
    </a>
  );
}
