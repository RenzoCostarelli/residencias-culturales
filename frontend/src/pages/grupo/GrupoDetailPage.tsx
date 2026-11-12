import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listarGrupos } from "../../api/grupos";
import { useAuth } from "../../context/AuthContext";
import { Spinner } from "../../components/ui/Feedback";
import { Pestanias } from "../../components/ui/Pestanias";
import { EvaluadoresTab } from "./EvaluadoresTab";
import { ParesTab } from "./ParesTab";
import { InscriptosTab } from "./InscriptosTab";

type Pestania = "evaluadores" | "pares" | "inscriptos";

const PESTANIAS: { id: Pestania; label: string }[] = [
  { id: "evaluadores", label: "Evaluadores" },
  { id: "pares", label: "Pares de evaluadores" },
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
          <Link to="/grupos" className="text-sm text-text-muted hover:text-text">
            ← Zonas
          </Link>
        )}
        <h1 className="mt-1 text-xl font-semibold text-text">{grupo?.nombre ?? "Grupo"}</h1>
        {grupo?.descripcion && <p className="text-sm text-text-muted">{grupo.descripcion}</p>}
      </div>

      <Pestanias items={PESTANIAS} activa={pestania} onChange={setPestania} />

      {pestania === "evaluadores" && <EvaluadoresTab grupoId={grupoId} />}
      {pestania === "pares" && <ParesTab grupoId={grupoId} />}
      {pestania === "inscriptos" && <InscriptosTab grupoId={grupoId} />}
    </div>
  );
}
