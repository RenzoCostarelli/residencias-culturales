import type { ReactNode } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { Alerta } from "./Feedback";

type Props = {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variante?: "primary" | "danger";
  pending?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmModal({
  open,
  title,
  children,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variante = "primary",
  pending = false,
  error,
  onConfirm,
  onClose,
}: Props) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="text-sm text-text-muted">{children}</div>
        {error && <Alerta>{error}</Alerta>}
        <div className="flex justify-end gap-3">
          <Button type="button" variante="secondary" onClick={onClose} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button type="button" variante={variante} onClick={onConfirm} disabled={pending}>
            {pending ? "Procesando..." : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
