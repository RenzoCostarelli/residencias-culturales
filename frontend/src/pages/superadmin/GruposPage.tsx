import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { crearGrupo, listarGrupos } from "../../api/grupos";
import { extraerMensajeError } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { Modal } from "../../components/ui/Modal";
import { Alerta, EmptyState, Spinner } from "../../components/ui/Feedback";

export function GruposPage() {
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Grupos</h1>
          <p className="text-sm text-text-muted">Regiones/sedes del programa de residencias.</p>
        </div>
        <Button onClick={() => setModalAbierto(true)}>Nuevo grupo</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : !grupos?.length ? (
        <EmptyState titulo="Todavía no hay grupos" descripcion="Creá uno para empezar a organizar evaluadores e inscriptos." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {grupos.map((g) => (
            <Link key={g.id} to={`/grupos/${g.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <p className="font-medium text-text">{g.nombre}</p>
                {g.descripcion && <p className="mt-1 text-sm text-text-muted">{g.descripcion}</p>}
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Modal open={modalAbierto} title="Nuevo grupo" onClose={() => setModalAbierto(false)}>
        <FormularioGrupo
          enviando={crear.isPending}
          error={crear.error ? extraerMensajeError(crear.error) : null}
          onSubmit={(data) => crear.mutate(data)}
        />
      </Modal>
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
