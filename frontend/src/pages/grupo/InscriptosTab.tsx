import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fijarResultadoFinal, listarInscriptosDeGrupo, reabrirPreseleccion } from "../../api/grupos";
import { extraerMensajeError } from "../../api/client";
import { Card } from "../../components/ui/Card";
import { Badge, badgeEstadoEvaluacion, badgeEstadoPreseleccion } from "../../components/ui/Badge";
import { Select } from "../../components/ui/Input";
import { Alerta, EmptyState, Spinner } from "../../components/ui/Feedback";
import type { Inscripto, ResultadoFinalInscripto } from "../../types";

export function InscriptosTab({ grupoId }: { grupoId: string }) {
  const queryClient = useQueryClient();
  const { data: inscriptos, isLoading } = useQuery({
    queryKey: ["inscriptos-grupo", grupoId],
    queryFn: () => listarInscriptosDeGrupo(grupoId),
  });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ["inscriptos-grupo", grupoId] });

  const fijarResultado = useMutation({
    mutationFn: ({ id, resultadoFinal }: { id: string; resultadoFinal: ResultadoFinalInscripto }) =>
      fijarResultadoFinal(id, resultadoFinal),
    onSuccess: invalidar,
  });

  const reabrir = useMutation({
    mutationFn: (id: string) => reabrirPreseleccion(id),
    onSuccess: invalidar,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!inscriptos?.length) {
    return <EmptyState titulo="Todavía no hay inscriptos en este grupo" />;
  }

  const sinAsignar = inscriptos.filter((i) => !i.parId).length;
  const evaluados = inscriptos.filter((i) => i.estadoEvaluacion === "EVALUADO").length;
  const rechazados = inscriptos.filter((i) => i.estadoPreseleccion === "RECHAZADO").length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-muted">
        <span className="font-medium text-text">{inscriptos.length}</span> inscriptos ·{" "}
        <span className="font-medium text-text">{sinAsignar}</span> sin asignar a un par ·{" "}
        <span className="font-medium text-text">{evaluados}</span> evaluados ·{" "}
        <span className="font-medium text-text">{rechazados}</span> rechazados en preselección
      </p>

      {(reabrir.error || fijarResultado.error) && (
        <Alerta>{extraerMensajeError(reabrir.error ?? fijarResultado.error)}</Alerta>
      )}

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="px-4 py-3 font-medium">UID</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Lote</th>
                <th className="px-4 py-3 font-medium">Preselección</th>
                <th className="px-4 py-3 font-medium">Evaluación</th>
                <th className="px-4 py-3 font-medium">Puntajes</th>
                <th className="px-4 py-3 font-medium">Promedio</th>
                <th className="px-4 py-3 font-medium">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {inscriptos.map((i) => (
                <FilaInscripto
                  key={i.id}
                  inscripto={i}
                  reabriendo={reabrir.isPending}
                  onReabrir={() => reabrir.mutate(i.id)}
                  onResultado={(resultadoFinal) => fijarResultado.mutate({ id: i.id, resultadoFinal })}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function FilaInscripto({
  inscripto: i,
  reabriendo,
  onReabrir,
  onResultado,
}: {
  inscripto: Inscripto;
  reabriendo: boolean;
  onReabrir: () => void;
  onResultado: (resultado: ResultadoFinalInscripto) => void;
}) {
  const estado = badgeEstadoEvaluacion(i.estadoEvaluacion);
  const preseleccion = badgeEstadoPreseleccion(i.estadoPreseleccion);
  const puedeReabrir = i.estadoPreseleccion !== "PENDIENTE" && i.evaluaciones.length === 0;

  return (
    <tr className="border-b border-border align-top last:border-0">
      <td className="px-4 py-3 font-mono text-xs text-text-muted">{i.uid}</td>
      <td className="px-4 py-3 text-text">{i.nombreCompleto}</td>
      <td className="px-4 py-3 text-text-muted">{i.lote?.nombre ?? "—"}</td>
      <td className="px-4 py-3">
        <div className="flex flex-col items-start gap-1">
          <Badge tono={preseleccion.tono} title={i.preseleccionObservacion ?? undefined}>
            {preseleccion.label}
          </Badge>
          {i.preseleccionObservacion && (
            <p className="max-w-55 truncate text-xs text-text-muted" title={i.preseleccionObservacion}>
              {i.preseleccionObservacion}
            </p>
          )}
          {puedeReabrir && (
            <button
              type="button"
              disabled={reabriendo}
              onClick={onReabrir}
              className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
            >
              Reabrir
            </button>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge tono={estado.tono}>{estado.label}</Badge>
      </td>
      <td className="px-4 py-3 text-text-muted">
        {i.evaluaciones.length ? (
          <ul className="flex flex-col gap-0.5 text-xs">
            {i.evaluaciones.map((e) => (
              <li key={e.evaluadorId}>
                {e.evaluador.nombre} {e.evaluador.apellido}: <span className="text-text">{e.puntajeTotal}</span>
              </li>
            ))}
          </ul>
        ) : (
          "—"
        )}
      </td>
      <td className="px-4 py-3">
        {i.estadoEvaluacion === "EVALUADO" && i.puntajeFinal ? (
          <span className="font-semibold text-text">{i.puntajeFinal}</span>
        ) : (
          <span className="text-text-muted">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <Select value={i.resultadoFinal} onChange={(e) => onResultado(e.target.value as ResultadoFinalInscripto)}>
          <option value="PENDIENTE">Pendiente</option>
          <option value="ACEPTADO">Aceptado</option>
          <option value="RECHAZADO">Rechazado</option>
          <option value="LISTA_ESPERA">Lista de espera</option>
        </Select>
      </td>
    </tr>
  );
}
