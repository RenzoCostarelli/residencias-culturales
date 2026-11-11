import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listarAsignados } from "../../api/evaluaciones";
import { Card } from "../../components/ui/Card";
import { Badge, badgeEstadoEvaluacion } from "../../components/ui/Badge";
import { EmptyState, Spinner } from "../../components/ui/Feedback";

export function AsignadosPage() {
  const { data: inscriptos, isLoading } = useQuery({
    queryKey: ["asignados"],
    queryFn: listarAsignados,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text">Mis evaluaciones</h1>
        <p className="text-sm text-text-muted">Inscriptos que te fueron asignados para evaluar.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : !inscriptos?.length ? (
        <EmptyState titulo="Todavía no tenés inscriptos asignados" />
      ) : (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="px-5 py-3 font-medium">Inscripto</th>
                <th className="px-5 py-3 font-medium">Mi evaluación</th>
                <th className="px-5 py-3 font-medium">Estado general</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {inscriptos.map((i) => {
                const mia = i.miEvaluacion;
                const general = badgeEstadoEvaluacion(i.estadoGeneral);
                return (
                  <tr key={i.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 text-text">{i.nombreCompleto}</td>
                    <td className="px-5 py-3">
                      <Badge tono={mia?.estado === "COMPLETA" ? "success" : mia ? "warning" : "neutral"}>
                        {mia?.estado === "COMPLETA"
                          ? `Completa (${mia.puntajeTotal})`
                          : mia
                            ? "Borrador"
                            : "Sin empezar"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tono={general.tono}>{general.label}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to={`/evaluador/inscriptos/${i.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {mia?.estado === "COMPLETA" ? "Ver" : "Evaluar"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
