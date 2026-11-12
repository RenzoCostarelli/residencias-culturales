import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { crearGrupo, listarGrupos } from "../../api/grupos";
import { extraerMensajeError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Alerta, EmptyState, Spinner } from "../../components/ui/Feedback";
import { TarjetaZona } from "../../components/ui/TarjetaZona";

export function ZonasPage() {
  const { usuario } = useAuth();
  const esSuperadmin = usuario?.rol === "SUPERADMIN";
  const queryClient = useQueryClient();
  const { data: grupos, isLoading } = useQuery({ queryKey: ["grupos"], queryFn: listarGrupos });
  const [modalAbierto, setModalAbierto] = useState(false);

  const crear = useMutation({
    mutationFn: crearGrupo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grupos"] });
      setModalAbierto(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!esSuperadmin && grupos?.length === 1) {
    return <Navigate to={`/grupos/${grupos[0].id}`} replace />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Zonas</h1>
          <p className="text-sm text-text-muted">
            {esSuperadmin ? "Regiones/sedes del programa de residencias." : "Zonas que administrás."}
          </p>
        </div>
        {esSuperadmin && <Button onClick={() => setModalAbierto(true)}>Nuevo grupo</Button>}
      </div>

      {!grupos?.length ? (
        <EmptyState
          titulo={esSuperadmin ? "Todavía no hay grupos" : "Todavía no administrás ningún grupo"}
          descripcion={
            esSuperadmin
              ? "Creá uno para empezar a organizar evaluadores e inscriptos."
              : "Pedile al superadmin que te asigne como administrador de un grupo."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {grupos.map((g) => (
            <TarjetaZona
              key={g.id}
              to={`/grupos/${g.id}`}
              titulo={g.nombre}
              descripcion={g.descripcion}
              estadisticas={[
                { label: "Inscriptos", valor: g.stats.inscriptos },
                { label: "Evaluadores", valor: g.stats.evaluadores },
                { label: "Evaluaciones", valor: g.stats.evaluacionesRealizadas },
              ]}
              progreso={{ actual: g.stats.evaluacionesRealizadas, total: g.stats.inscriptos * 2 }}
            />
          ))}
        </div>
      )}

      {esSuperadmin && (
        <Modal open={modalAbierto} title="Nuevo grupo" onClose={() => setModalAbierto(false)}>
          <FormularioGrupo
            enviando={crear.isPending}
            error={crear.error ? extraerMensajeError(crear.error) : null}
            onSubmit={(data) => crear.mutate(data)}
          />
        </Modal>
      )}
    </div>
  );
}

function FormularioGrupo({
  onSubmit,
  enviando,
  error,
}: {
  onSubmit: (data: { nombre: string; descripcion?: string }) => void;
  enviando: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState({ nombre: "", descripcion: "" });

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
        placeholder="Zona Sur"
        value={form.nombre}
        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
      />
      <Textarea
        label="Descripción (opcional)"
        value={form.descripcion}
        onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
      />
      {error && <Alerta>{error}</Alerta>}
      <Button type="submit" disabled={enviando}>
        {enviando ? "Creando..." : "Crear grupo"}
      </Button>
    </form>
  );
}
