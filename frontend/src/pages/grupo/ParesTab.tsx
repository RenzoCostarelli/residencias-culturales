import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { actualizarPar, crearPar, listarPares } from "../../api/grupos";
import { listarUsuarios } from "../../api/usuarios";
import { extraerMensajeError } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Alerta, EmptyState, Spinner } from "../../components/ui/Feedback";

export function ParesTab({ grupoId }: { grupoId: string }) {
  const queryClient = useQueryClient();
  const { data: pares, isLoading } = useQuery({
    queryKey: ["pares", grupoId],
    queryFn: () => listarPares(grupoId),
  });
  const { data: evaluadores } = useQuery({
    queryKey: ["usuarios", "EVALUADOR"],
    queryFn: () => listarUsuarios({ rol: "EVALUADOR", activo: true }),
  });
  const [modalAbierto, setModalAbierto] = useState(false);

  const crear = useMutation({
    mutationFn: (data: { evaluador1Id: string; evaluador2Id: string }) => crearPar(grupoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pares", grupoId] });
      setModalAbierto(false);
    },
  });

  const toggleActivo = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => actualizarPar(id, { activo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pares", grupoId] }),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">Parejas de evaluadores de este grupo.</p>
        <Button onClick={() => setModalAbierto(true)}>Nuevo par</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : !pares?.length ? (
        <EmptyState titulo="Todavía no hay pares de evaluadores en este grupo" />
      ) : (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="px-5 py-3 font-medium">Evaluador 1</th>
                <th className="px-5 py-3 font-medium">Evaluador 2</th>
                <th className="px-5 py-3 font-medium">Lotes</th>
                <th className="px-5 py-3 font-medium">Inscriptos</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {pares.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-text">
                    {p.evaluador1?.nombre} {p.evaluador1?.apellido}
                  </td>
                  <td className="px-5 py-3 text-text">
                    {p.evaluador2?.nombre} {p.evaluador2?.apellido}
                  </td>
                  <td className="px-5 py-3 text-text-muted">{p._count?.lotes ?? 0}</td>
                  <td className="px-5 py-3 text-text-muted">{p._count?.inscriptos ?? 0}</td>
                  <td className="px-5 py-3">
                    <Badge tono={p.activo ? "success" : "neutral"}>{p.activo ? "Activo" : "Inactivo"}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      variante="ghost"
                      onClick={() => toggleActivo.mutate({ id: p.id, activo: !p.activo })}
                    >
                      {p.activo ? "Desactivar" : "Activar"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={modalAbierto} title="Nuevo par de evaluadores" onClose={() => setModalAbierto(false)}>
        <FormularioPar
          evaluadores={evaluadores ?? []}
          enviando={crear.isPending}
          error={crear.error ? extraerMensajeError(crear.error) : null}
          onSubmit={(data) => crear.mutate(data)}
        />
      </Modal>
    </div>
  );
}

function FormularioPar({
  evaluadores,
  onSubmit,
  enviando,
  error,
}: {
  evaluadores: { id: string; nombre: string; apellido: string }[];
  onSubmit: (data: { evaluador1Id: string; evaluador2Id: string }) => void;
  enviando: boolean;
  error: string | null;
}) {
  const [evaluador1Id, setEvaluador1Id] = useState("");
  const [evaluador2Id, setEvaluador2Id] = useState("");

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ evaluador1Id, evaluador2Id });
      }}
    >
      {evaluadores.length < 2 && (
        <Alerta>Hacen falta al menos 2 evaluadores activos para formar un par.</Alerta>
      )}
      <Select label="Evaluador 1" required value={evaluador1Id} onChange={(e) => setEvaluador1Id(e.target.value)}>
        <option value="">Elegí un evaluador...</option>
        {evaluadores.map((ev) => (
          <option key={ev.id} value={ev.id} disabled={ev.id === evaluador2Id}>
            {ev.nombre} {ev.apellido}
          </option>
        ))}
      </Select>
      <Select label="Evaluador 2" required value={evaluador2Id} onChange={(e) => setEvaluador2Id(e.target.value)}>
        <option value="">Elegí un evaluador...</option>
        {evaluadores.map((ev) => (
          <option key={ev.id} value={ev.id} disabled={ev.id === evaluador1Id}>
            {ev.nombre} {ev.apellido}
          </option>
        ))}
      </Select>
      {error && <Alerta>{error}</Alerta>}
      <Button type="submit" disabled={enviando || !evaluador1Id || !evaluador2Id}>
        {enviando ? "Creando..." : "Crear par"}
      </Button>
    </form>
  );
}
