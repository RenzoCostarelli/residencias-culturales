import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  actualizarPar,
  crearLoteParaPar,
  crearPar,
  crearParesAutomaticos,
  listarEvaluadores,
  listarInscriptosDeGrupo,
  listarPares,
} from "../../api/grupos";
import { extraerMensajeError } from "../../api/client";
import { nombreCompleto } from "../../lib/etiquetas";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { Alerta, EmptyState, Spinner } from "../../components/ui/Feedback";
import type { EvaluadorResumen } from "../../types";

const TAMANOS_LOTE = [10, 20, 30] as const;

export function ParesTab({ grupoId }: { grupoId: string }) {
  const queryClient = useQueryClient();
  const { data: pares, isLoading } = useQuery({
    queryKey: ["pares", grupoId],
    queryFn: () => listarPares(grupoId),
  });
  const { data: evaluadores } = useQuery({
    queryKey: ["evaluadores", grupoId],
    queryFn: () => listarEvaluadores(grupoId),
  });
  const { data: inscriptos } = useQuery({
    queryKey: ["inscriptos-grupo", grupoId],
    queryFn: () => listarInscriptosDeGrupo(grupoId),
  });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [confirmarAutomaticos, setConfirmarAutomaticos] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [errorLote, setErrorLote] = useState<string | null>(null);

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ["pares", grupoId] });
    queryClient.invalidateQueries({ queryKey: ["evaluadores", grupoId] });
    queryClient.invalidateQueries({ queryKey: ["inscriptos-grupo", grupoId] });
  };

  const crear = useMutation({
    mutationFn: (data: { evaluador1Id: string; evaluador2Id: string }) => crearPar(grupoId, data),
    onSuccess: () => {
      invalidar();
      setModalAbierto(false);
    },
  });

  const automaticos = useMutation({
    mutationFn: () => crearParesAutomaticos(grupoId),
    onSuccess: (resultado) => {
      invalidar();
      setConfirmarAutomaticos(false);
      const sobrante = resultado.sinPareja
        ? ` Quedó sin pareja: ${nombreCompleto(resultado.sinPareja)} (armá su par a mano cuando haya otro evaluador).`
        : "";
      setMensaje(`Se crearon ${resultado.creados.length} par(es) al azar.${sobrante}`);
    },
  });

  const toggleActivo = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => actualizarPar(id, { activo }),
    onSuccess: invalidar,
  });

  const lote = useMutation({
    mutationFn: ({ parId, cantidad }: { parId: string; cantidad: (typeof TAMANOS_LOTE)[number] }) =>
      crearLoteParaPar(parId, cantidad),
    onSuccess: (resultado) => {
      invalidar();
      setErrorLote(null);
      setMensaje(
        resultado.asignados < resultado.solicitados
          ? `Se asignaron ${resultado.asignados} inscripto(s) en ${resultado.lote.nombre}: eran los últimos sin asignar del grupo.`
          : `Se asignaron ${resultado.asignados} inscriptos en ${resultado.lote.nombre}.`,
      );
    },
    onError: (err) => setErrorLote(extraerMensajeError(err)),
  });

  const sinAsignar = (inscriptos ?? []).filter((i) => !i.parId).length;
  const miembrosActivos = (evaluadores ?? []).filter((e) => e.activo);
  const miembrosSinPar = miembrosActivos.filter((e) => !e.enPar).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-text-muted">
            Parejas de evaluadores de este grupo. Cada par recibe lotes de inscriptos del grupo.
          </p>
          <p className="mt-1 text-sm text-text">
            <span className="font-medium">{sinAsignar}</span> inscripto(s) sin asignar ·{" "}
            <span className="font-medium">{miembrosSinPar}</span> evaluador(es) sin par
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variante="secondary"
            type="button"
            disabled={miembrosSinPar < 2}
            title={miembrosSinPar < 2 ? "Hacen falta al menos 2 evaluadores sin par" : undefined}
            onClick={() => setConfirmarAutomaticos(true)}
          >
            Crear pares automáticamente
          </Button>
          <Button onClick={() => setModalAbierto(true)}>Nuevo par</Button>
        </div>
      </div>

      {mensaje && (
        <div className="flex items-start justify-between gap-3">
          <Alerta tipo="exito">{mensaje}</Alerta>
          <Button variante="ghost" type="button" onClick={() => setMensaje(null)}>
            Cerrar
          </Button>
        </div>
      )}
      {errorLote && <Alerta>{errorLote}</Alerta>}
      {toggleActivo.error && <Alerta>{extraerMensajeError(toggleActivo.error)}</Alerta>}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : !pares?.length ? (
        <EmptyState
          titulo="Todavía no hay pares de evaluadores en este grupo"
          descripcion={
            miembrosActivos.length < 2
              ? "Primero agregá evaluadores al grupo en la pestaña Evaluadores."
              : "Crealos a mano o automáticamente."
          }
        />
      ) : (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="px-5 py-3 font-medium">Evaluadores</th>
                <th className="px-5 py-3 font-medium">Lotes</th>
                <th className="px-5 py-3 font-medium">Inscriptos</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Agregar inscriptos</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {pares.map((p) => (
                <tr key={p.id} className="border-b border-border align-top last:border-0">
                  <td className="px-5 py-3 text-text">
                    <p>{p.evaluador1 && nombreCompleto(p.evaluador1)}</p>
                    <p>{p.evaluador2 && nombreCompleto(p.evaluador2)}</p>
                  </td>
                  <td className="px-5 py-3 text-text-muted">
                    {p.lotes?.length ? (
                      <ul className="flex flex-col gap-0.5">
                        {p.lotes.map((l) => (
                          <li key={l.id}>
                            {l.nombre} · {l._count.inscriptos}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-3 text-text-muted">{p._count?.inscriptos ?? 0}</td>
                  <td className="px-5 py-3">
                    <Badge tono={p.activo ? "success" : "neutral"}>{p.activo ? "Activo" : "Inactivo"}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      {TAMANOS_LOTE.map((cantidad) => (
                        <Button
                          key={cantidad}
                          type="button"
                          variante="secondary"
                          className="px-2.5 py-1 text-xs"
                          disabled={!p.activo || sinAsignar === 0 || lote.isPending}
                          title={
                            sinAsignar === 0
                              ? "No quedan inscriptos sin asignar en este grupo"
                              : `Asignar los próximos ${cantidad} inscriptos del grupo a este par`
                          }
                          onClick={() => lote.mutate({ parId: p.id, cantidad })}
                        >
                          +{cantidad}
                        </Button>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      variante="ghost"
                      type="button"
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
          evaluadores={miembrosActivos}
          enviando={crear.isPending}
          error={crear.error ? extraerMensajeError(crear.error) : null}
          onSubmit={(data) => crear.mutate(data)}
        />
      </Modal>

      <ConfirmModal
        open={confirmarAutomaticos}
        title="Crear pares automáticamente"
        confirmLabel="Crear pares"
        pending={automaticos.isPending}
        error={automaticos.error ? extraerMensajeError(automaticos.error) : null}
        onConfirm={() => automaticos.mutate()}
        onClose={() => setConfirmarAutomaticos(false)}
      >
        Se van a emparejar al azar los <strong>{miembrosSinPar}</strong> evaluadores del grupo que todavía no
        tienen par ({Math.floor(miembrosSinPar / 2)} par(es)).
        {miembrosSinPar % 2 === 1 && " Como son impares, uno va a quedar sin pareja y se te va a informar."}
      </ConfirmModal>
    </div>
  );
}

function FormularioPar({
  evaluadores,
  onSubmit,
  enviando,
  error,
}: {
  evaluadores: EvaluadorResumen[];
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
        <Alerta>
          Hacen falta al menos 2 evaluadores activos en el grupo para formar un par. Agregalos en la pestaña
          Evaluadores.
        </Alerta>
      )}
      <Select
        id="par-evaluador-1"
        label="Evaluador 1"
        required
        value={evaluador1Id}
        onChange={(e) => setEvaluador1Id(e.target.value)}
      >
        <option value="">Elegí un evaluador...</option>
        {evaluadores.map((ev) => (
          <option key={ev.id} value={ev.id} disabled={ev.id === evaluador2Id}>
            {nombreCompleto(ev)}
          </option>
        ))}
      </Select>
      <Select
        id="par-evaluador-2"
        label="Evaluador 2"
        required
        value={evaluador2Id}
        onChange={(e) => setEvaluador2Id(e.target.value)}
      >
        <option value="">Elegí un evaluador...</option>
        {evaluadores.map((ev) => (
          <option key={ev.id} value={ev.id} disabled={ev.id === evaluador1Id}>
            {nombreCompleto(ev)}
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
