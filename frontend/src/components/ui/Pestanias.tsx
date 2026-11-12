import type { ReactNode } from "react";

type Props<T extends string> = {
  items: { id: T; label: ReactNode }[];
  activa: T;
  onChange: (id: T) => void;
};

export function Pestanias<T extends string>({ items, activa, onChange }: Props<T>) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border" role="tablist">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={activa === item.id}
          onClick={() => onChange(item.id)}
          className={`border-b-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
            activa === item.id
              ? "border-primary text-primary"
              : "border-transparent text-text-muted hover:text-text"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
