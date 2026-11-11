import type { ButtonHTMLAttributes } from "react";

type Variante = "primary" | "secondary" | "danger" | "ghost";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
};

const ESTILOS: Record<Variante, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover disabled:opacity-50",
  secondary:
    "bg-surface border border-border-strong text-text hover:bg-surface-muted disabled:opacity-50",
  danger: "bg-danger text-white hover:opacity-90 disabled:opacity-50",
  ghost: "text-text-muted hover:text-text hover:bg-surface-muted",
};

export function Button({ variante = "primary", className = "", ...props }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed ${ESTILOS[variante]} ${className}`}
      {...props}
    />
  );
}
