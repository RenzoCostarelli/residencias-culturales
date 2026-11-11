import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  asignarParALote,
  crearLote,
  listarInscriptosDeGrupo,
  listarLotes,
  listarPares,
} from "../../api/grupos";
import { extraerMensajeError } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Alerta, EmptyState, Spinner } from "../../components/ui/Feedback";

export function LotesTab({ grupoId }: { grupoId: string }) {
  const queryClient = useQueryClient();
  const { data: lotes, isLoading } = useQuery({
    queryKey: ["lotes", grupoId],
    queryFn: () => listarLotes(grupoId),
  });
  const { data: pares } = useQuery({ queryKey: ["pares", grupoId], queryFn: () => listarPares(grupoId) });
  const { data: inscriptos } = useQuery({
    queryKey: ["inscriptos-grupo", grupoId],
    queryFn: () => listarInscriptosDeGrupo(grupoId),
  });
  const [modalAbierto, setModalAbierto] = useState(false);

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ["lotes", grupoId] });
    queryClient.invalidateQueries({ queryKey: ["inscriptos-grupo", grupoId] });
    queryClient.invalidateQueries({ queryKey: ["pares", grupoId] });
  };

  const crear = useMutation({
    mutationFn: (data: { nombre: string; inscriptoIds: string[] }) => crearLote(grupoId, data),
    onSuccess: () => {
      invalidar();
      setModalAbierto(false);
    },
  });

  const asignarPar = useMutation({
    mutationFn: ({ loteId, parId }: { loteId: string; parId: string }) => asignarParALote(loteId, parId),
    onSuccess: invalidar,
  });

  const sinLote = (inscriptos ?? []).filter((i) => !i.loteId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          Lotes de inscriptos asignados (o por asignar) a un par de evaluadores.
        </p>
        <Button onClick={() => setModalAbierto(true)} disabled={!sinLote.length}>
          Nuevo lote
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : !lotes?.length ? (
        <EmptyState
          titulo="Todavía no hay lotes"
          descripcion={!sinLote.length ? "No hay inscriptos sin lote en este grupo." : undefined}
        />
      ) : (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="px-5 py-3 font-medium">Lote</th>
                <th className="px-5 py-3 font-medium">Inscriptos</th>
                <th className="px-5 py-3 font-medium">Par asignado</th>
              </tr>
            </thead>
            <tbody>
              {lotes.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-text">{l.nombre}</td>
                  <td className="px-5 py-3 text-text-muted">{l._count?.inscriptos ?? 0}</td>
                  <td className="px-5 py-3">
                    {l.parId ? (
                      <Badge tono="success">
                        {l.par?.evaluador1?.nombre} {l.par?.evaluador1?.apellido} /{" "}
                        {l.par?.evaluador2?.nombre} {l.par?.evaluador2?.apellido}
                      </Badge>
                    ) : (
                      <Select
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) asignarPar.mutate({ loteId: l.id, parId: e.target.value });
                        }}
                      >
                        <option value="">Asignar par...</option>
                        {pares?.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.evaluador1?.nombre} / {p.evaluador2?.nombre}
                          </option>
                        ))}
                      </Select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={modalAbierto} title="Nuevo lote" onClose={() => setModalAbierto(false)}>
        <FormularioLote
          inscriptos={sinLote}
          enviando={crear.isPending}
          error={crear.error ? extraerMensajeError(crear.error) : null}
          onSubmit={(data) => crear.mutate(data)}
        />
      </Modal>
    </div>
  );
}

function FormularioLote({
  inscriptos,
  onSubmit,
  enviando,
  error,
}: {
  inscriptos: { id: string; uid: string; nombreCompleto: string }[];
  onSubmit: (data: { nombre: string; inscriptoIds: string[] }) => void;
  enviando: boolean;
  error: string | null;
}) {
  const [nombre, setNombre] = useState("");
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ nombre, inscriptoIds: Array.from(seleccionados) });
      }}
    >
      <Input label="Nombre del lote" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
      <div>
        <p className="mb-2 text-sm font-medium text-text">Inscriptos sin lote ({inscriptos.length})</p>
        <div className="max-h-56 overflow-y-auto rounded-md border border-border-strong">
          {inscriptos.map((i) => (
            <label key={i.id} className="flex items-center gap-2 border-b border-border px-3 py-2 text-sm last:border-0">
              <input type="checkbox" checked={seleccionados.has(i.id)} onChange={() => toggle(i.id)} />
              <span className="text-text">{i.nombreCompleto}</span>
              <span className="text-text-faint">{i.uid}</span>
            </label>
          ))}
        </div>
      </div>
      {error && <Alerta>{error}</Alerta>}
      <Button type="submit" disabled={enviando || !nombre || seleccionados.size === 0}>
        {enviando ? "Creando..." : `Crear lote (${seleccionados.size} inscriptos)`}
      </Button>
    </form>
  );
}
