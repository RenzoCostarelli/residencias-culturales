import { Navigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listarGrupos } from "../../api/grupos";
import { Card } from "../../components/ui/Card";
import { EmptyState, Spinner } from "../../components/ui/Feedback";

export function MisGruposPage() {
  const { data: grupos, isLoading } = useQuery({ queryKey: ["grupos"], queryFn: listarGrupos });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!grupos?.length) {
    return (
      <EmptyState
        titulo="Todavía no administrás ningún grupo"
        descripcion="Pedile al superadmin que te asigne como administrador de un grupo."
      />
    );
  }

  if (grupos.length === 1) {
    return <Navigate to={`/grupos/${grupos[0].id}`} replace />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text">Mis grupos</h1>
        <p className="text-sm text-text-muted">Grupos que administrás.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {grupos.map((g) => (
          <Link key={g.id} to={`/grupos/${g.id}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <p className="font-medium text-text">{g.nombre}</p>
              {g.descripcion && <p className="mt-1 text-sm text-text-muted">{g.descripcion}</p>}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
