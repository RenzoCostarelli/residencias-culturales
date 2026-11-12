import type { ReactNode } from "react";
import type {
  EstadoDocumentoPreseleccion,
  EstadoEvaluacionInscripto,
  EstadoPreseleccion,
  ResultadoFinalInscripto,
} from "../../types";

type Tono = "neutral" | "info" | "success" | "warning" | "danger";

const TONOS: Record<Tono, string> = {
  neutral: "bg-surface-muted text-text-muted",
  info: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export function Badge({
  tono = "neutral",
  title,
  children,
}: {
  tono?: Tono;
  title?: string;
  children: ReactNode;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${TONOS[tono]}`}
    >
      {children}
    </span>
  );
}

export function badgeEstadoEvaluacion(estado: EstadoEvaluacionInscripto) {
  switch (estado) {
    case "PENDIENTE":
      return { tono: "neutral" as const, label: "Pendiente" };
    case "EN_PROGRESO":
      return { tono: "warning" as const, label: "A medias" };
    case "EVALUADO":
      return { tono: "success" as const, label: "Evaluado" };
  }
}

export function badgeResultadoFinal(resultado: ResultadoFinalInscripto) {
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

export function badgeEstadoPreseleccion(estado: EstadoPreseleccion) {
  switch (estado) {
    case "PENDIENTE":
      return { tono: "neutral" as const, label: "Sin validar" };
    case "APROBADO":
      return { tono: "success" as const, label: "Documentación OK" };
    case "RECHAZADO":
      return { tono: "danger" as const, label: "Rechazado" };
  }
}

export function badgeEstadoDocumento(estado: EstadoDocumentoPreseleccion) {
  switch (estado) {
    case "CORRECTO":
      return { tono: "success" as const, label: "Correcto" };
    case "FALTANTE":
      return { tono: "warning" as const, label: "Faltante" };
    case "INCORRECTO":
      return { tono: "danger" as const, label: "Incorrecto" };
  }
}
