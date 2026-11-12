import type { ReactNode } from "react";

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-5 w-5 animate-spin rounded-full border-2 border-border-strong border-t-primary ${className}`}
      role="status"
      aria-label="Cargando"
    />
  );
}

export function PantallaCarga() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner />
    </div>
  );
}

export function EmptyState({ titulo, descripcion }: { titulo: string; descripcion?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-border-strong py-12 text-center">
      <p className="text-sm font-medium text-text">{titulo}</p>
      {descripcion && <p className="text-sm text-text-muted">{descripcion}</p>}
    </div>
  );
}

const ESTILOS_ALERTA = {
  error: "bg-danger-soft text-danger border-danger/20",
  exito: "bg-success-soft text-success border-success/20",
  aviso: "bg-warning-soft text-text border-warning/30",
};

export function Alerta({
  tipo = "error",
  children,
}: {
  tipo?: keyof typeof ESTILOS_ALERTA;
  children: ReactNode;
}) {
  return (
    <div role={tipo === "error" ? "alert" : "status"} className={`rounded-md border px-3 py-2 text-sm ${ESTILOS_ALERTA[tipo]}`}>
      {children}
    </div>
  );
}
