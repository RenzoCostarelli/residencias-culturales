import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { actualizarUsuario, crearUsuario, listarUsuarios } from "../../api/usuarios";
import { extraerMensajeError } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Alerta, EmptyState, Spinner } from "../../components/ui/Feedback";
import type { Rol } from "../../types";

const ETIQUETA_ROL: Record<Rol, string> = {
  SUPERADMIN: "Superadmin",
  ADMIN_GRUPO: "Admin de grupo",
  EVALUADOR: "Evaluador",
};

export function UsuariosPage() {
  const queryClient = useQueryClient();
  const { data: usuarios, isLoading } = useQuery({
    queryKey: ["usuarios"],
    queryFn: () => listarUsuarios(),
  });
  const [modalAbierto, setModalAbierto] = useState(false);

  const crear = useMutation({
    mutationFn: crearUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setModalAbierto(false);
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
          <p className="text-sm text-text-muted">Admins de grupo y evaluadores del sistema.</p>
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
                  <td className="px-5 py-3 text-text">
                    {u.nombre} {u.apellido}
                  </td>
                  <td className="px-5 py-3 text-text-muted">{u.email}</td>
                  <td className="px-5 py-3">
                    <Badge tono="info">{ETIQUETA_ROL[u.rol]}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tono={u.activo ? "success" : "neutral"}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      variante="ghost"
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
    </div>
  );
}

function FormularioUsuario({
  onSubmit,
  enviando,
  error,
}: {
  onSubmit: (data: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    rol: Rol;
  }) => void;
  enviando: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState({
    email: "",
    password: "",
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
        label="Nombre"
        required
        value={form.nombre}
        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
      />
      <Input
        label="Apellido"
        required
        value={form.apellido}
        onChange={(e) => setForm({ ...form, apellido: e.target.value })}
      />
      <Input
        label="Email"
        type="email"
        required
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <Input
        label="Contraseña"
        type="password"
        minLength={8}
        required
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <Select
        label="Rol"
        value={form.rol}
        onChange={(e) => setForm({ ...form, rol: e.target.value as Rol })}
      >
        <option value="EVALUADOR">Evaluador</option>
        <option value="ADMIN_GRUPO">Admin de grupo</option>
        <option value="SUPERADMIN">Superadmin</option>
      </Select>
      {error && <Alerta>{error}</Alerta>}
      <Button type="submit" disabled={enviando}>
        {enviando ? "Creando..." : "Crear usuario"}
      </Button>
    </form>
  );
}
