import { Link, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listarAsignados, listarMisGrupos } from "../../api/evaluaciones";
import { Card } from "../../components/ui/Card";
import { Badge, badgeEstadoEvaluacion, badgeEstadoPreseleccion } from "../../components/ui/Badge";
import { Pestanias } from "../../components/ui/Pestanias";
import { Paginacion } from "../../components/ui/Paginacion";
import { EmptyState, Spinner } from "../../components/ui/Feedback";
import type { InscriptoAsignado, StatsEvaluacion } from "../../types";

const PAGE_SIZE = 20;

export function AsignadosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: grupos, isLoading: cargandoGrupos } = useQuery({
    queryKey: ["mis-grupos"],
    queryFn: listarMisGrupos,
  });

  const grupoParam = searchParams.get("grupo");
  const grupoActivo = grupos?.find((g) => g.id === grupoParam)?.id ?? grupos?.[0]?.id;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const { data: pagina, isLoading: cargandoPagina } = useQuery({
    queryKey: ["asignados", grupoActivo, page],
    queryFn: () => listarAsignados({ grupoId: grupoActivo, page, pageSize: PAGE_SIZE }),
    enabled: !!grupoActivo,
    placeholderData: keepPreviousData,
  });

  if (cargandoGrupos) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const grupo = grupos?.find((g) => g.id === grupoActivo);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text">Mis evaluaciones</h1>
        <p className="text-sm text-text-muted">
          Inscriptos asignados a tus pares de evaluadores. Primero se valida la documentación
          (preselección) y después se evalúa.
        </p>
      </div>

      {!grupos?.length || !grupo ? (
        <EmptyState
          titulo="Todavía no integrás ningún par de evaluadores"
          descripcion="Cuando un administrador te sume a un par de un grupo, vas a ver acá los inscriptos a evaluar."
        />
      ) : (
        <>
          {grupos.length > 1 && (
            <Pestanias
              items={grupos.map((g) => ({ id: g.id, label: g.nombre }))}
              activa={grupo.id}
              onChange={(id) => setSearchParams({ grupo: id })}
            />
          )}

          <TarjetasStats stats={pagina?.stats ?? grupo.stats} />

          {cargandoPagina || !pagina ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : pagina.total === 0 ? (
            <EmptyState titulo="Todavía no hay inscriptos asignados a tus pares en este grupo" />
          ) : (
            <Card className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-text-muted">
                      <th className="px-4 py-3 font-medium">Inscripto</th>
                      <th className="px-4 py-3 font-medium">Lote</th>
                      <th className="px-4 py-3 font-medium">Preselección</th>
                      <th className="px-4 py-3 font-medium">Mi evaluación</th>
                      <th className="px-4 py-3 font-medium">Estado general</th>
                      <th className="px-4 py-3 font-medium">Promedio</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagina.items.map((i) => (
                      <FilaAsignado key={i.id} inscripto={i} />
                    ))}
                  </tbody>
                </table>
              </div>
              <Paginacion
                page={pagina.page}
                pageSize={pagina.pageSize}
                total={pagina.total}
                onChange={(p) => setSearchParams({ grupo: grupo.id, page: String(p) })}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function TarjetasStats({ stats }: { stats: StatsEvaluacion }) {
  const tarjetas = [
    { label: "Pendientes", valor: stats.pendientes, ayuda: "Ningún evaluador envió todavía" },
    { label: "A medias", valor: stats.aMedias, ayuda: "Evaluados por uno solo de los dos" },
    { label: "Completadas", valor: stats.completadas, ayuda: "Evaluados por ambos, con promedio" },
    { label: "Rechazados", valor: stats.rechazadosPreseleccion, ayuda: "No pasaron la preselección" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tarjetas.map((t) => (
        <Card key={t.label}>
          <p className="text-sm text-text-muted">{t.label}</p>
          <p className="mt-1 text-2xl font-semibold text-text">{t.valor}</p>
          <p className="mt-1 text-xs text-text-faint">{t.ayuda}</p>
        </Card>
      ))}
    </div>
  );
}

function FilaAsignado({ inscripto: i }: { inscripto: InscriptoAsignado }) {
  const general = badgeEstadoEvaluacion(i.estadoGeneral);
  const preseleccion = badgeEstadoPreseleccion(i.estadoPreseleccion);
  const yaEnvie = i.miPuntaje != null;

  // La preselección (validar documentación) es un paso previo en su propia pantalla:
  // hasta que no esté aprobada, cualquier acción lleva ahí, nunca a las preguntas de evaluación.
  const noAprobado = i.estadoPreseleccion !== "APROBADO";
  const href = noAprobado ? `/evaluador/inscriptos/${i.id}/preseleccion` : `/evaluador/inscriptos/${i.id}`;
  const accion = i.estadoPreseleccion === "PENDIENTE" ? "Validar documentación" : i.estadoPreseleccion === "RECHAZADO" ? "Ver rechazo" : yaEnvie ? "Ver" : "Evaluar";

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3">
        <p className="text-text">{i.nombreCompleto}</p>
        <p className="font-mono text-xs text-text-faint">{i.uid}</p>
      </td>
      <td className="px-4 py-3 text-text-muted">{i.lote ?? "—"}</td>
      <td className="px-4 py-3">
        <Badge tono={preseleccion.tono}>{preseleccion.label}</Badge>
      </td>
      <td className="px-4 py-3">
        <Badge tono={yaEnvie ? "success" : "neutral"}>{yaEnvie ? `Enviada (${i.miPuntaje})` : "Sin enviar"}</Badge>
      </td>
      <td className="px-4 py-3">
        <Badge tono={general.tono}>{general.label}</Badge>
      </td>
      <td className="px-4 py-3">
        {i.puntajeFinal ? (
          <span className="font-semibold text-text">{i.puntajeFinal}</span>
        ) : (
          <span className="text-text-muted">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <Link to={href} className="text-sm font-medium text-primary hover:underline">
          {accion}
        </Link>
      </td>
    </tr>
  );
}
