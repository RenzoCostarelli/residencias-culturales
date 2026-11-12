import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enviarPreseleccion, obtenerEvaluacionPropia } from "../../api/evaluaciones";
import { extraerMensajeError } from "../../api/client";
import { formatearFecha, nombreCompleto } from "../../lib/etiquetas";
import { Button } from "../../components/ui/Button";
import { Input, Select, Textarea } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { Badge, badgeEstadoDocumento, badgeEstadoPreseleccion } from "../../components/ui/Badge";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { Alerta, Spinner } from "../../components/ui/Feedback";
import { SeccionDocumentos } from "./DocumentosInscripto";
import type { DocumentoPreseleccion, EstadoDocumentoPreseleccion, EvaluacionPropia } from "../../types";

// Paso previo a la evaluación, en su propia pantalla: acá solo se valida la documentación,
// nunca se muestran los criterios/preguntas de la evaluación.
export function PreseleccionPage() {
  const { inscriptoId } = useParams<{ inscriptoId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["evaluacion-mia", inscriptoId],
    queryFn: () => obtenerEvaluacionPropia(inscriptoId!),
    enabled: !!inscriptoId,
  });

  function onResuelto(resultado: "APROBADO" | "RECHAZADO") {
    queryClient.invalidateQueries({ queryKey: ["evaluacion-mia", inscriptoId] });
    queryClient.invalidateQueries({ queryKey: ["asignados"] });
    queryClient.invalidateQueries({ queryKey: ["mis-grupos"] });
    // Al rechazar no hay nada más que hacer acá, así que vuelve al listado. Al aprobar se queda en
    // esta misma pantalla (ahora en su variante "ya resuelta", con el botón para continuar): evita
    // saltar a la evaluación con datos todavía no refrescados y deja ver la confirmación.
    if (resultado === "RECHAZADO") {
      navigate("/evaluador");
    }
  }

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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/evaluador" className="text-sm text-text-muted hover:text-text">
          ← Evaluaciones
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-text">{data.inscripto.nombreCompleto}</h1>
        <p className="font-mono text-sm text-text-muted">{data.inscripto.uid}</p>
        <p className="mt-1 text-sm font-medium text-text-muted">Preselección: validar documentación</p>
      </div>

      <SeccionDocumentos documentos={pre.documentos} />

      {pre.estado === "PENDIENTE" ? (
        <FormularioPreseleccion inscriptoId={inscriptoId} documentos={pre.documentos} onResuelto={onResuelto} />
      ) : (
        <ResumenPreseleccion data={data} />
      )}
    </div>
  );
}

const OPCIONES_DOCUMENTO: { valor: EstadoDocumentoPreseleccion; label: string }[] = [
  { valor: "CORRECTO", label: "Correcto" },
  { valor: "FALTANTE", label: "Faltante" },
  { valor: "INCORRECTO", label: "Incorrecto" },
];

function FormularioPreseleccion({
  inscriptoId,
  documentos,
  onResuelto,
}: {
  inscriptoId: string;
  documentos: DocumentoPreseleccion[];
  onResuelto: (resultado: "APROBADO" | "RECHAZADO") => void;
}) {
  // Ningún estado se precompleta solo, ni siquiera "Faltante" cuando no hay archivo subido: la
  // preselección es una revisión manual, el evaluador tiene que elegir explícitamente los tres
  // estados para cada documento (el sistema no decide nada por su cuenta).
  const [estados, setEstados] = useState<Record<string, EstadoDocumentoPreseleccion | "">>(() =>
    Object.fromEntries(documentos.map((d) => [d.campoId, d.estado ?? ""])),
  );
  const [observaciones, setObservaciones] = useState<Record<string, string>>(() =>
    Object.fromEntries(documentos.map((d) => [d.campoId, d.observacion ?? ""])),
  );
  const [resultado, setResultado] = useState<"APROBADO" | "RECHAZADO" | "">("");
  const [observacion, setObservacion] = useState("");
  const [confirmar, setConfirmar] = useState(false);

  const queryClient = useQueryClient();

  const enviar = useMutation({
    mutationFn: () =>
      enviarPreseleccion(inscriptoId, {
        documentos: documentos.map((d) => ({
          campoId: d.campoId,
          estado: estados[d.campoId] as EstadoDocumentoPreseleccion,
          observacion: observaciones[d.campoId]?.trim() || undefined,
        })),
        resultado: resultado as "APROBADO" | "RECHAZADO",
        observacion: observacion.trim() || undefined,
      }),
    onSuccess: () => {
      const resuelto = resultado as "APROBADO" | "RECHAZADO";
      // Se escribe el resultado directamente en el caché en vez de esperar el refetch disparado por
      // invalidateQueries: si la página de evaluación llega a montar antes de que ese refetch
      // responda, leería el estado PENDIENTE viejo y rebotaría de nuevo para acá.
      queryClient.setQueryData<EvaluacionPropia>(["evaluacion-mia", inscriptoId], (old) =>
        old
          ? {
              ...old,
              preseleccion: {
                ...old.preseleccion,
                estado: resuelto,
                observacion: observacion.trim() || null,
                documentos: old.preseleccion.documentos.map((d) => ({
                  ...d,
                  estado: (estados[d.campoId] as EstadoDocumentoPreseleccion) || d.estado,
                  observacion: observaciones[d.campoId]?.trim() || d.observacion,
                })),
              },
            }
          : old,
      );
      onResuelto(resuelto);
    },
  });

  const documentosCompletos = documentos.every((d) => estados[d.campoId]);
  const hayProblemas = documentos.some((d) => estados[d.campoId] && estados[d.campoId] !== "CORRECTO");
  const completo =
    documentosCompletos && resultado !== "" && (resultado !== "RECHAZADO" || observacion.trim() !== "");

  return (
    <Card className="flex flex-col gap-4 border-warning/30">
      <p className="text-sm text-text-muted">
        Revisá cada archivo que subió el inscripto y marcá si es correcto, falta o no corresponde. La
        evaluación se habilita recién cuando apruebes la documentación.
      </p>

      {documentos.length === 0 ? (
        <Alerta tipo="aviso">
          No hay campos de archivo (URL) configurados en el formulario: podés aprobar directamente.
        </Alerta>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {documentos.map((d) => (
            <li key={d.campoId} className="grid gap-3 py-3 sm:grid-cols-[1fr_320px]">
              <div className="min-w-0">
                <p className="text-sm font-medium text-text" title={d.etiqueta}>
                  {d.etiqueta}
                </p>
                {d.url ? (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Abrir archivo ↗
                  </a>
                ) : (
                  <p className="text-sm text-text-faint italic">No subió archivo</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Select
                  aria-label={`Estado de ${d.etiqueta}`}
                  value={estados[d.campoId] ?? ""}
                  onChange={(e) =>
                    setEstados((prev) => ({
                      ...prev,
                      [d.campoId]: e.target.value as EstadoDocumentoPreseleccion | "",
                    }))
                  }
                >
                  <option value="">Elegí...</option>
                  {OPCIONES_DOCUMENTO.map((o) => (
                    <option key={o.valor} value={o.valor}>
                      {o.label}
                    </option>
                  ))}
                </Select>
                <Input
                  aria-label={`Observación sobre ${d.etiqueta}`}
                  placeholder="Observación (opcional)"
                  value={observaciones[d.campoId] ?? ""}
                  onChange={(e) =>
                    setObservaciones((prev) => ({ ...prev, [d.campoId]: e.target.value }))
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-text">Resultado de la preselección</legend>
        <label className="flex items-center gap-2 text-sm text-text">
          <input
            type="radio"
            name="resultado-preseleccion"
            checked={resultado === "APROBADO"}
            onChange={() => setResultado("APROBADO")}
          />
          Aprobar: la documentación está en condiciones, se habilita la evaluación
        </label>
        <label className="flex items-center gap-2 text-sm text-text">
          <input
            type="radio"
            name="resultado-preseleccion"
            checked={resultado === "RECHAZADO"}
            onChange={() => setResultado("RECHAZADO")}
          />
          Rechazar: el inscripto no cumple con la documentación, no se evalúa
        </label>
      </fieldset>

      {hayProblemas && resultado === "APROBADO" && (
        <Alerta tipo="aviso">
          Marcaste documentos faltantes o incorrectos. Si igual aprobás, dejá constancia del motivo en la
          observación.
        </Alerta>
      )}

      <Textarea
        id="observacion-preseleccion"
        label={resultado === "RECHAZADO" ? "Observación (obligatoria para rechazar)" : "Observación (opcional)"}
        rows={3}
        value={observacion}
        onChange={(e) => setObservacion(e.target.value)}
      />

      <div className="flex items-center justify-end gap-3">
        {enviar.error && <Alerta>{extraerMensajeError(enviar.error)}</Alerta>}
        <Button
          type="button"
          variante={resultado === "RECHAZADO" ? "danger" : "primary"}
          disabled={!completo || enviar.isPending}
          onClick={() => setConfirmar(true)}
        >
          {resultado === "RECHAZADO" ? "Rechazar inscripto" : "Aprobar documentación"}
        </Button>
      </div>

      <ConfirmModal
        open={confirmar}
        title={resultado === "RECHAZADO" ? "Rechazar inscripto" : "Aprobar documentación"}
        confirmLabel={resultado === "RECHAZADO" ? "Rechazar" : "Aprobar"}
        variante={resultado === "RECHAZADO" ? "danger" : "primary"}
        pending={enviar.isPending}
        error={enviar.error ? extraerMensajeError(enviar.error) : null}
        onConfirm={() => enviar.mutate()}
        onClose={() => setConfirmar(false)}
      >
        {resultado === "RECHAZADO"
          ? "El inscripto queda rechazado en la preselección y no se va a evaluar. Solo un administrador del grupo puede reabrirla."
          : "Se habilita la evaluación para ambos integrantes del par. Esta validación queda registrada a tu nombre."}
      </ConfirmModal>
    </Card>
  );
}

function ResumenPreseleccion({ data }: { data: EvaluacionPropia }) {
  const preseleccion = data.preseleccion;
  const badge = badgeEstadoPreseleccion(preseleccion.estado);
  const rechazado = preseleccion.estado === "RECHAZADO";

  return (
    <Card className={`flex flex-col gap-4 ${rechazado ? "border-danger/30" : "border-success/30"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-text">Preselección</p>
          <p className="text-sm text-text-muted">
            {preseleccion.por ? `Validada por ${nombreCompleto(preseleccion.por)}` : "Validada"}
            {preseleccion.at ? ` el ${formatearFecha(preseleccion.at)}` : ""}
          </p>
        </div>
        <Badge tono={badge.tono}>{badge.label}</Badge>
      </div>

      {preseleccion.observacion && (
        <p className="text-sm whitespace-pre-wrap text-text">
          <span className="font-medium">Observación:</span> {preseleccion.observacion}
        </p>
      )}

      {preseleccion.documentos.length > 0 && (
        <ul className="flex flex-col gap-1">
          {preseleccion.documentos.map((d) => {
            const estado = d.estado ? badgeEstadoDocumento(d.estado) : null;
            return (
              <li key={d.campoId} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-text-muted" title={d.etiqueta}>
                  {d.etiqueta}
                </span>
                <Badge tono={estado?.tono ?? "neutral"} title={d.observacion ?? undefined}>
                  {estado?.label ?? "Sin validar"}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}

      {rechazado ? (
        <p className="text-sm text-danger">
          El inscripto no se evalúa. Un administrador del grupo puede reabrir la preselección si corresponde.
        </p>
      ) : (
        <div className="flex justify-end">
          <Link to={`/evaluador/inscriptos/${data.inscripto.id}`}>
            <Button type="button">{data.evaluacion ? "Ver evaluación" : "Continuar con la evaluación"}</Button>
          </Link>
        </div>
      )}
    </Card>
  );
}
