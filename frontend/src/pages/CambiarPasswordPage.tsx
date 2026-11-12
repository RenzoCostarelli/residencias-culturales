import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { cambiarPassword } from "../api/auth";
import { extraerMensajeError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PasswordInput } from "../components/ui/PasswordInput";
import { Alerta } from "../components/ui/Feedback";

export function CambiarPasswordPage() {
  const { usuario, actualizarUsuario } = useAuth();
  const [form, setForm] = useState({ actual: "", nueva: "", repetir: "" });
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const cambiar = useMutation({
    mutationFn: () => cambiarPassword({ passwordActual: form.actual, passwordNueva: form.nueva }),
    onSuccess: () => {
      actualizarUsuario({ debeCambiarPassword: false });
      setForm({ actual: "", nueva: "", repetir: "" });
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorLocal(null);
    if (form.nueva.length < 8) {
      setErrorLocal("La contraseña nueva debe tener al menos 8 caracteres");
      return;
    }
    if (form.nueva !== form.repetir) {
      setErrorLocal("Las contraseñas nuevas no coinciden");
      return;
    }
    cambiar.mutate();
  }

  const error = errorLocal ?? (cambiar.error ? extraerMensajeError(cambiar.error) : null);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text">Cambiar contraseña</h1>
        <p className="text-sm text-text-muted">Elegí una contraseña nueva de al menos 8 caracteres.</p>
      </div>

      {usuario?.debeCambiarPassword && !cambiar.isSuccess && (
        <Alerta tipo="aviso">
          Tu contraseña actual fue generada por el sistema. Cambiala por una propia para seguir usando la
          plataforma con tranquilidad.
        </Alerta>
      )}

      {cambiar.isSuccess ? (
        <Card className="flex flex-col gap-4">
          <Alerta tipo="exito">Contraseña actualizada. Usala la próxima vez que ingreses.</Alerta>
          <Link to="/" className="text-sm font-medium text-primary hover:underline">
            Ir al inicio →
          </Link>
        </Card>
      ) : (
        <Card>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <PasswordInput
              id="password-actual"
              label="Contraseña actual"
              autoComplete="current-password"
              required
              value={form.actual}
              onChange={(e) => setForm({ ...form, actual: e.target.value })}
            />
            <PasswordInput
              id="password-nueva"
              label="Contraseña nueva"
              autoComplete="new-password"
              required
              minLength={8}
              value={form.nueva}
              onChange={(e) => setForm({ ...form, nueva: e.target.value })}
            />
            <PasswordInput
              id="password-repetir"
              label="Repetir contraseña nueva"
              autoComplete="new-password"
              required
              minLength={8}
              value={form.repetir}
              onChange={(e) => setForm({ ...form, repetir: e.target.value })}
            />
            {error && <Alerta>{error}</Alerta>}
            <Button type="submit" disabled={cambiar.isPending}>
              {cambiar.isPending ? "Guardando..." : "Guardar contraseña"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
