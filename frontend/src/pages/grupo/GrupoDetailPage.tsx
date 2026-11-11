import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listarGrupos } from "../../api/grupos";
import { useAuth } from "../../context/AuthContext";
import { Spinner } from "../../components/ui/Feedback";
import { ParesTab } from "./ParesTab";
import { LotesTab } from "./LotesTab";
import { InscriptosTab } from "./InscriptosTab";

type Pestania = "pares" | "lotes" | "inscriptos";

const PESTANIAS: { id: Pestania; label: string }[] = [
  { id: "pares", label: "Pares de evaluadores" },
  { id: "lotes", label: "Lotes" },
  { id: "inscriptos", label: "Inscriptos" },
];

export function GrupoDetailPage() {
  const { grupoId } = useParams<{ grupoId: string }>();
  const { usuario } = useAuth();
  const [pestania, setPestania] = useState<Pestania>("pares");
  const { data: grupos, isLoading } = useQuery({ queryKey: ["grupos"], queryFn: listarGrupos });

  if (!grupoId) return null;
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const grupo = grupos?.find((g) => g.id === grupoId);

  const esSuperadmin = usuario?.rol === "SUPERADMIN";
  const mostrarVolver = esSuperadmin || (grupos?.length ?? 0) > 1;

  return (
    <div className="flex flex-col gap-6">
      <div>
        {mostrarVolver && (
          <Link
            to={esSuperadmin ? "/superadmin/grupos" : "/admin-grupo"}
            className="text-sm text-text-muted hover:text-text"
          >
            ← {esSuperadmin ? "Grupos" : "Mis grupos"}
          </Link>
        )}
        <h1 className="mt-1 text-xl font-semibold text-text">{grupo?.nombre ?? "Grupo"}</h1>
        {grupo?.descripcion && <p className="text-sm text-text-muted">{grupo.descripcion}</p>}
      </div>

      <div className="flex gap-1 border-b border-border">
        {PESTANIAS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPestania(p.id)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors duration-150 ${
              pestania === p.id
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {pestania === "pares" && <ParesTab grupoId={grupoId} />}
      {pestania === "lotes" && <LotesTab grupoId={grupoId} />}
      {pestania === "inscriptos" && <InscriptosTab grupoId={grupoId} />}
    </div>
  );
}
