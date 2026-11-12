import { useState, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label?: string; error?: string };

// Campo de contraseña con botón para mostrar/ocultar el texto.
export function PasswordInput({ label, error, id, className = "", ...props }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          className={`w-full rounded-md border border-border-strong bg-surface py-2 pr-20 pl-3 text-sm text-text placeholder:text-text-faint focus:border-primary ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-text-muted hover:text-text"
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
