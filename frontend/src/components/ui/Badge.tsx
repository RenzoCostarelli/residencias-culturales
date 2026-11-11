import type { ReactNode } from "react";

type Tono = "neutral" | "info" | "success" | "warning" | "danger";

const TONOS: Record<Tono, string> = {
  neutral: "bg-surface-muted text-text-muted",
  info: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export function Badge({ tono = "neutral", children }: { tono?: Tono; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${TONOS[tono]}`}
    >
      {children}
    </span>
  );
}

export function badgeEstadoEvaluacion(estado: "PENDIENTE" | "EN_PROGRESO" | "EVALUADO") {
  switch (estado) {
    case "PENDIENTE":
      return { tono: "neutral" as const, label: "Pendiente" };
    case "EN_PROGRESO":
      return { tono: "warning" as const, label: "En progreso" };
    case "EVALUADO":
      return { tono: "success" as const, label: "Evaluado" };
  }
}

export function badgeResultadoFinal(
  resultado: "PENDIENTE" | "ACEPTADO" | "RECHAZADO" | "LISTA_ESPERA",
) {
  switch (resultado) {
    case "PENDIENTE":
      return { tono: "neutral" as const, label: "Pendiente" };
    case "ACEPTADO":
      return { tono: "success" as const, label: "Aceptado" };
    case "RECHAZADO":
      return { tono: "danger" as const, label: "Rechazado" };
    case "LISTA_ESPERA":
      return { tono: "warning" as const, label: "Lista de espera" };
  }
}
