import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fijarResultadoFinal, listarInscriptosDeGrupo } from "../../api/grupos";
import { Card } from "../../components/ui/Card";
import { Badge, badgeEstadoEvaluacion } from "../../components/ui/Badge";
import { Select } from "../../components/ui/Input";
import { EmptyState, Spinner } from "../../components/ui/Feedback";
import type { ResultadoFinalInscripto } from "../../types";

export function InscriptosTab({ grupoId }: { grupoId: string }) {
  const queryClient = useQueryClient();
  const { data: inscriptos, isLoading } = useQuery({
    queryKey: ["inscriptos-grupo", grupoId],
    queryFn: () => listarInscriptosDeGrupo(grupoId),
  });

  const fijarResultado = useMutation({
    mutationFn: ({ id, resultadoFinal }: { id: string; resultadoFinal: ResultadoFinalInscripto }) =>
      fijarResultadoFinal(id, resultadoFinal),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inscriptos-grupo", grupoId] }),
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

  return (
    <Card className="p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-text-muted">
            <th className="px-5 py-3 font-medium">UID</th>
            <th className="px-5 py-3 font-medium">Nombre</th>
            <th className="px-5 py-3 font-medium">Estado evaluación</th>
            <th className="px-5 py-3 font-medium">Puntaje final</th>
            <th className="px-5 py-3 font-medium">Resultado</th>
          </tr>
        </thead>
        <tbody>
          {inscriptos.map((i) => {
            const estado = badgeEstadoEvaluacion(i.estadoEvaluacion);
            return (
              <tr key={i.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3 font-mono text-xs text-text-muted">{i.uid}</td>
                <td className="px-5 py-3 text-text">{i.nombreCompleto}</td>
                <td className="px-5 py-3">
                  <Badge tono={estado.tono}>{estado.label}</Badge>
                </td>
                <td className="px-5 py-3 text-text-muted">{i.puntajeFinal ?? "—"}</td>
                <td className="px-5 py-3">
                  <Select
                    value={i.resultadoFinal}
                    onChange={(e) =>
                      fijarResultado.mutate({
                        id: i.id,
                        resultadoFinal: e.target.value as ResultadoFinalInscripto,
                      })
                    }
                  >
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="ACEPTADO">Aceptado</option>
                    <option value="RECHAZADO">Rechazado</option>
                    <option value="LISTA_ESPERA">Lista de espera</option>
                  </Select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
