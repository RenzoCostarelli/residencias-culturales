import { Link } from "react-router-dom";
import { Card } from "./Card";
import { BarraProgreso } from "./BarraProgreso";

export type EstadisticaZona = { label: string; valor: number };

export function TarjetaZona({
  to,
  titulo,
  descripcion,
  inscripciones,
  estadisticas,
  progreso,
}: {
  to: string;
  titulo: string;
  descripcion?: string | null;
  inscripciones?: number;
  estadisticas: EstadisticaZona[];
  progreso: { actual: number; total: number };
}) {
  return (
    <Link to={to}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-medium text-text">{titulo}</p>
          {inscripciones != null && (
            <p className="shrink-0 text-xs text-text-muted">
              {inscripciones} inscripciones
            </p>
          )}
        </div>
        {descripcion && (
          <p className="mt-1 text-sm text-text-muted">{descripcion}</p>
        )}
        <dl className="mt-3 flex gap-3 justify-between items-center">
          {estadisticas.map((e) => (
            <div key={e.label}>
              <dt className="text-xs text-text-muted">{e.label}</dt>
              <dd className="text-lg font-semibold text-text">{e.valor}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4">
          <BarraProgreso actual={progreso.actual} total={progreso.total} />
        </div>
      </Card>
    </Link>
  );
}
