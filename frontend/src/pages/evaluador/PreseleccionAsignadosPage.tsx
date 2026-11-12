import { Link, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listarAsignadosPreseleccion, listarMisGruposPreseleccion } from "../../api/evaluaciones";
import { Card } from "../../components/ui/Card";
import { Paginacion } from "../../components/ui/Paginacion";
import { Pestanias } from "../../components/ui/Pestanias";
import { EmptyState, Spinner } from "../../components/ui/Feedback";
import { TarjetaZona } from "../../components/ui/TarjetaZona";
import type { EstadoPreseleccion, InscriptoAsignadoPreseleccion, MiGrupoPreseleccion } from "../../types";

const PAGE_SIZE = 13;

export function PreseleccionAsignadosPage() {
  const [searchParams] = useSearchParams();
  const { data: grupos, isLoading: cargandoGrupos } = useQuery({
    queryKey: ["mis-grupos-preseleccion"],
    queryFn: listarMisGruposPreseleccion,
  });

  const grupoParam = searchParams.get("grupo");
  const grupo = grupos?.find((g) => g.id === grupoParam);

  if (cargandoGrupos) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {!grupos?.length ? (
        <>
          <div>
            <h1 className="text-xl font-semibold text-text">Preselección</h1>
            <p className="text-sm text-text-muted">
              Validación de documentación de los inscriptos asignados a tus pares de evaluadores.
            </p>
          </div>
          <EmptyState
            titulo="Todavía no integrás ningún par de evaluadores"
            descripcion="Cuando un administrador te sume a un par de un grupo, vas a ver acá los inscriptos a preseleccionar."
          />
        </>
      ) : grupo ? (
        <GrupoDetalle grupo={grupo} />
      ) : (
        <GrillaZonas grupos={grupos} />
      )}
    </div>
  );
}

function GrillaZonas({ grupos }: { grupos: MiGrupoPreseleccion[] }) {
  return (
    <>
      <div>
        <h1 className="text-xl font-semibold text-text">Preselección</h1>
        <p className="text-sm text-text-muted">Elegí una zona para validar documentación.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {grupos.map((g) => (
          <TarjetaZona
            key={g.id}
            to={`?grupo=${g.id}`}
            titulo={g.nombre}
            descripcion={g.descripcion}
            inscripciones={g.statsZona.inscriptos}
            estadisticas={[
              { label: "Asignados a mí", valor: g.misStats.asignados },
              { label: "Validados", valor: g.misStats.hechas },
              { label: "Pendientes", valor: g.misStats.quedan },
            ]}
            progreso={{ actual: g.statsZona.decididos, total: g.statsZona.inscriptos }}
          />
        ))}
      </div>
    </>
  );
}

const TABS_PRESELECCION: { id: EstadoPreseleccion; label: string }[] = [
  { id: "PENDIENTE", label: "Pendientes" },
  { id: "APROBADO", label: "Aprobados" },
  { id: "RECHAZADO", label: "Rechazados" },
];

function GrupoDetalle({ grupo }: { grupo: MiGrupoPreseleccion }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const estadoParam = searchParams.get("estado");
  const estado = (TABS_PRESELECCION.some((t) => t.id === estadoParam) ? estadoParam : "PENDIENTE") as EstadoPreseleccion;

  const { data: pagina, isLoading: cargandoPagina } = useQuery({
    queryKey: ["asignados-preseleccion", grupo.id, estado, page],
    queryFn: () => listarAsignadosPreseleccion({ grupoId: grupo.id, page, pageSize: PAGE_SIZE, estado }),
    placeholderData: keepPreviousData,
  });

  const stats = pagina?.stats ?? grupo.stats;
  const CONTADOR: Record<EstadoPreseleccion, number> = {
    PENDIENTE: stats.pendientes,
    APROBADO: stats.aprobados,
    RECHAZADO: stats.rechazados,
  };

  return (
    <>
      <div>
        <Link to="/preseleccion" className="text-sm text-text-muted hover:text-text">
          ← Volver a mis zonas
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-text">{grupo.nombre}</h1>
      </div>

      <Pestanias
        items={TABS_PRESELECCION.map((t) => ({ id: t.id, label: `${t.label} (${CONTADOR[t.id]})` }))}
        activa={estado}
        onChange={(id) => setSearchParams({ grupo: grupo.id, estado: id })}
      />

      {cargandoPagina || !pagina ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : pagina.total === 0 ? (
        <EmptyState titulo="No hay inscriptos en esta pestaña para este grupo" />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-muted">
                  <th className="px-4 py-3 font-medium">Inscripto</th>
                  <th className="px-4 py-3 font-medium">Lote</th>
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
  );
}

function FilaAsignado({ inscripto: i }: { inscripto: InscriptoAsignadoPreseleccion }) {
  const accion =
    i.estadoPreseleccion === "PENDIENTE" ? "Validar documentación" : i.estadoPreseleccion === "RECHAZADO" ? "Ver rechazo" : "Ver";

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3">
        <p className="text-text">{i.nombreCompleto}</p>
        <p className="font-mono text-xs text-text-faint">{i.uid}</p>
      </td>
      <td className="px-4 py-3 text-text-muted">{i.lote ?? "—"}</td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <Link to={`/evaluador/inscriptos/${i.id}/preseleccion`} className="text-sm font-medium text-primary hover:underline">
          {accion}
        </Link>
      </td>
    </tr>
  );
}
