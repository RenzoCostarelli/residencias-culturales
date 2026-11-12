import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  actualizarUsuario,
  crearUsuario,
  listarUsuarios,
  restablecerPassword,
} from "../../api/usuarios";
import { extraerMensajeError } from "../../api/client";
import { copiarAlPortapapeles } from "../../lib/portapapeles";
import { ETIQUETA_ROL, nombreCompleto } from "../../lib/etiquetas";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { Alerta, EmptyState, Spinner } from "../../components/ui/Feedback";
import type { Rol, Usuario } from "../../types";

type Credenciales = { titulo: string; email: string; password: string };

export function UsuariosPage() {
  const queryClient = useQueryClient();
  const { data: usuarios, isLoading } = useQuery({
    queryKey: ["usuarios"],
    queryFn: () => listarUsuarios(),
  });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [credenciales, setCredenciales] = useState<Credenciales | null>(null);
  const [usuarioAReset, setUsuarioAReset] = useState<Usuario | null>(null);

  const crear = useMutation({
    mutationFn: crearUsuario,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setModalAbierto(false);
      setCredenciales({
        titulo: "Usuario creado",
        email: data.usuario.email,
        password: data.passwordGenerada,
      });
    },
  });

  const restablecer = useMutation({
    mutationFn: (id: string) => restablecerPassword(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setUsuarioAReset(null);
      setCredenciales({
        titulo: "Contraseña restablecida",
        email: data.usuario.email,
        password: data.passwordGenerada,
      });
    },
  });

  const toggleActivo = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => actualizarUsuario(id, { activo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["usuarios"] }),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Usuarios</h1>
          <p className="text-sm text-text-muted">
            Superadmins, admins de grupo y evaluadores. Cualquier usuario puede ser evaluador.
          </p>
        </div>
        <Button onClick={() => setModalAbierto(true)}>Nuevo usuario</Button>
      </div>

      <Card className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : !usuarios?.length ? (
          <div className="p-6">
            <EmptyState titulo="Todavía no hay usuarios" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Rol</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-text">{nombreCompleto(u)}</td>
                  <td className="px-5 py-3 text-text-muted">{u.email}</td>
                  <td className="px-5 py-3">
                    <Badge tono="info">{ETIQUETA_ROL[u.rol]}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge tono={u.activo ? "success" : "neutral"}>{u.activo ? "Activo" : "Inactivo"}</Badge>
                      {u.debeCambiarPassword && (
                        <Badge tono="warning" title="Todavía no cambió la contraseña generada por el sistema">
                          Contraseña temporal
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <Button variante="ghost" type="button" onClick={() => setUsuarioAReset(u)}>
                      Restablecer contraseña
                    </Button>
                    <Button
                      variante="ghost"
                      type="button"
                      onClick={() => toggleActivo.mutate({ id: u.id, activo: !u.activo })}
                    >
                      {u.activo ? "Desactivar" : "Activar"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={modalAbierto} title="Nuevo usuario" onClose={() => setModalAbierto(false)}>
        <FormularioUsuario
          enviando={crear.isPending}
          error={crear.error ? extraerMensajeError(crear.error) : null}
          onSubmit={(data) => crear.mutate(data)}
        />
      </Modal>

      <ConfirmModal
        open={!!usuarioAReset}
        title="Restablecer contraseña"
        confirmLabel="Generar contraseña nueva"
        pending={restablecer.isPending}
        error={restablecer.error ? extraerMensajeError(restablecer.error) : null}
        onConfirm={() => usuarioAReset && restablecer.mutate(usuarioAReset.id)}
        onClose={() => setUsuarioAReset(null)}
      >
        Se va a generar una contraseña nueva para <strong>{usuarioAReset && nombreCompleto(usuarioAReset)}</strong>.
        La actual deja de funcionar y el usuario va a ver el aviso para cambiarla en su próximo ingreso.
      </ConfirmModal>

      <ModalCredenciales credenciales={credenciales} onClose={() => setCredenciales(null)} />
    </div>
  );
}

function ModalCredenciales({
  credenciales,
  onClose,
}: {
  credenciales: Credenciales | null;
  onClose: () => void;
}) {
  const [copiado, setCopiado] = useState<"password" | "todo" | "error" | null>(null);

  async function copiar(texto: string, clave: "password" | "todo") {
    const ok = await copiarAlPortapapeles(texto);
    setCopiado(ok ? clave : "error");
    window.setTimeout(() => setCopiado(null), 2500);
  }

  if (!credenciales) return null;

  const { titulo, email, password } = credenciales;

  return (
    <Modal open title={titulo} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Alerta tipo="aviso">
          Guardá o compartí esta contraseña ahora: por seguridad no se vuelve a mostrar. Al ingresar, el
          usuario va a ver un aviso para cambiarla.
        </Alerta>
        <dl className="flex flex-col gap-2 rounded-md border border-border bg-surface-muted px-4 py-3 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-text-muted">Email</dt>
            <dd className="font-medium text-text select-all">{email}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-text-muted">Contraseña</dt>
            <dd className="font-mono text-base font-semibold tracking-wide text-text select-all">{password}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {copiado === "error" && <span className="text-sm text-danger">No se pudo copiar, seleccionala a mano.</span>}
          {(copiado === "password" || copiado === "todo") && (
            <span className="text-sm text-success">Copiado</span>
          )}
          <Button
            type="button"
            variante="secondary"
            onClick={() => copiar(`Email: ${email}\nContraseña: ${password}`, "todo")}
          >
            Copiar email y contraseña
          </Button>
          <Button type="button" onClick={() => copiar(password, "password")}>
            Copiar contraseña
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function FormularioUsuario({
  onSubmit,
  enviando,
  error,
}: {
  onSubmit: (data: { email: string; nombre: string; apellido: string; rol: Rol }) => void;
  enviando: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState({
    email: "",
    nombre: "",
    apellido: "",
    rol: "EVALUADOR" as Rol,
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <Input
        id="nuevo-nombre"
        label="Nombre"
        required
        value={form.nombre}
        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
      />
      <Input
        id="nuevo-apellido"
        label="Apellido"
        required
        value={form.apellido}
        onChange={(e) => setForm({ ...form, apellido: e.target.value })}
      />
      <Input
        id="nuevo-email"
        label="Email"
        type="email"
        required
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <Select
        id="nuevo-rol"
        label="Rol"
        value={form.rol}
        onChange={(e) => setForm({ ...form, rol: e.target.value as Rol })}
      >
        <option value="EVALUADOR">Evaluador</option>
        <option value="ADMIN_GRUPO">Admin de grupo</option>
        <option value="SUPERADMIN">Superadmin</option>
      </Select>
      <p className="text-xs text-text-muted">
        La contraseña se genera automáticamente y se muestra una única vez al crear el usuario.
      </p>
      {error && <Alerta>{error}</Alerta>}
      <Button type="submit" disabled={enviando}>
        {enviando ? "Creando..." : "Crear usuario"}
      </Button>
    </form>
  );
}
