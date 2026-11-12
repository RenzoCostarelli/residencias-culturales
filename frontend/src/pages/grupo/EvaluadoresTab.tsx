import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { agregarEvaluador, listarEvaluadores, quitarEvaluador } from "../../api/grupos";
import { listarUsuarios } from "../../api/usuarios";
import { extraerMensajeError } from "../../api/client";
import { ETIQUETA_ROL, nombreCompleto } from "../../lib/etiquetas";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Alerta, EmptyState, Spinner } from "../../components/ui/Feedback";
import type { Usuario } from "../../types";

// Usuarios (de cualquier rol) habilitados para evaluar en este grupo. Los pares se arman solo entre ellos.
export function EvaluadoresTab({ grupoId }: { grupoId: string }) {
  const queryClient = useQueryClient();
  const { data: evaluadores, isLoading } = useQuery({
    queryKey: ["evaluadores", grupoId],
    queryFn: () => listarEvaluadores(grupoId),
  });
  const { data: usuarios } = useQuery({
    queryKey: ["usuarios", "activos"],
    queryFn: () => listarUsuarios({ activo: true }),
  });
  const [modalAbierto, setModalAbierto] = useState(false);

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ["evaluadores", grupoId] });
    queryClient.invalidateQueries({ queryKey: ["pares", grupoId] });
  };

  const agregar = useMutation({
    mutationFn: (usuarioId: string) => agregarEvaluador(grupoId, usuarioId),
    onSuccess: () => {
      invalidar();
      setModalAbierto(false);
    },
  });

  const quitar = useMutation({
    mutationFn: (usuarioId: string) => quitarEvaluador(grupoId, usuarioId),
    onSuccess: invalidar,
  });

  const miembros = new Set((evaluadores ?? []).map((e) => e.id));
  const candidatos = (usuarios ?? []).filter((u) => !miembros.has(u.id));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-text-muted">
          Usuarios habilitados para evaluar en este grupo. Puede ser cualquier rol; los pares se arman
          entre ellos.
        </p>
        <Button onClick={() => setModalAbierto(true)}>Agregar evaluador</Button>
      </div>

      {quitar.error && <Alerta>{extraerMensajeError(quitar.error)}</Alerta>}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : !evaluadores?.length ? (
        <EmptyState
          titulo="Todavía no hay evaluadores en este grupo"
          descripcion="Agregá al menos dos para poder armar pares."
        />
      ) : (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Rol</th>
                <th className="px-5 py-3 font-medium">Par</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {evaluadores.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-text">
                    {nombreCompleto(e)}
                    {!e.activo && <span className="ml-2 text-xs text-text-faint">(inactivo)</span>}
                  </td>
                  <td className="px-5 py-3 text-text-muted">{e.email}</td>
                  <td className="px-5 py-3">
                    <Badge tono="info">{ETIQUETA_ROL[e.rol]}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tono={e.enPar ? "success" : "neutral"}>{e.enPar ? "En un par" : "Sin par"}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      variante="ghost"
                      type="button"
                      disabled={e.enPar || quitar.isPending}
                      title={e.enPar ? "Integra un par activo: desactivá el par primero" : undefined}
                      onClick={() => quitar.mutate(e.id)}
                    >
                      Quitar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={modalAbierto} title="Agregar evaluador al grupo" onClose={() => setModalAbierto(false)}>
        <FormularioEvaluador
          candidatos={candidatos}
          enviando={agregar.isPending}
          error={agregar.error ? extraerMensajeError(agregar.error) : null}
          onSubmit={(usuarioId) => agregar.mutate(usuarioId)}
        />
      </Modal>
    </div>
  );
}

function FormularioEvaluador({
  candidatos,
  onSubmit,
  enviando,
  error,
}: {
  candidatos: Usuario[];
  onSubmit: (usuarioId: string) => void;
  enviando: boolean;
  error: string | null;
}) {
  const [usuarioId, setUsuarioId] = useState("");

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (usuarioId) onSubmit(usuarioId);
      }}
    >
      {candidatos.length === 0 && (
        <Alerta tipo="aviso">Todos los usuarios activos ya son evaluadores de este grupo.</Alerta>
      )}
      <Select
        id="evaluador-usuario"
        label="Usuario"
        required
        value={usuarioId}
        onChange={(e) => setUsuarioId(e.target.value)}
      >
        <option value="">Elegí un usuario...</option>
        {candidatos.map((u) => (
          <option key={u.id} value={u.id}>
            {nombreCompleto(u)} — {ETIQUETA_ROL[u.rol]}
          </option>
        ))}
      </Select>
      {error && <Alerta>{error}</Alerta>}
      <Button type="submit" disabled={enviando || !usuarioId}>
        {enviando ? "Agregando..." : "Agregar"}
      </Button>
    </form>
  );
}
