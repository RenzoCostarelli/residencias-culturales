import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { actualizarCampo, crearCampo, listarCampos } from "../../api/rubrica";
import { extraerMensajeError } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Alerta, Spinner } from "../../components/ui/Feedback";
import type { CampoFormulario, TipoDatoCampo } from "../../types";

export function RubricaPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["rubrica"],
    queryFn: listarCampos,
  });
  const [modalAbierto, setModalAbierto] = useState(false);

  const actualizar = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof actualizarCampo>[1];
    }) => actualizarCampo(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rubrica"] }),
  });

  const crear = useMutation({
    mutationFn: crearCampo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rubrica"] });
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

  const campos = data?.campos ?? [];
  const evaluables = campos.filter((c) => c.esEvaluable);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Rúbrica</h1>
          <p className="text-sm text-text-muted">
            Criterios de evaluación y campos del formulario.
          </p>
        </div>
        <Button onClick={() => setModalAbierto(true)}>Nuevo campo</Button>
      </div>

      <Card
        className={data?.esValida ? "border-success/30" : "border-warning/30"}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-muted">
              Suma de criterios evaluables activos
            </p>
            <p className="text-2xl font-semibold text-text">
              {data?.sumaEvaluable} / 100
            </p>
          </div>
          <Badge tono={data?.esValida ? "success" : "warning"}>
            {data?.esValida ? "Rúbrica válida" : "No suma 100"}
          </Badge>
        </div>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
          Criterios evaluables
        </h2>
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="px-5 py-3 font-medium">Criterio</th>
                <th className="px-5 py-3 font-medium">Puntaje máximo</th>
                <th className="px-5 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {evaluables.map((campo) => (
                <FilaEvaluable
                  key={campo.id}
                  campo={campo}
                  onGuardar={(puntajeMaximo) =>
                    actualizar.mutate({ id: campo.id, data: { puntajeMaximo } })
                  }
                  onToggleActivo={() =>
                    actualizar.mutate({
                      id: campo.id,
                      data: { activo: !campo.activo },
                    })
                  }
                />
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      <Modal
        open={modalAbierto}
        title="Nuevo campo de rúbrica"
        onClose={() => setModalAbierto(false)}
      >
        <FormularioCampo
          enviando={crear.isPending}
          error={crear.error ? extraerMensajeError(crear.error) : null}
          onSubmit={(datos) => crear.mutate(datos)}
        />
      </Modal>
    </div>
  );
}

function FilaEvaluable({
  campo,
  onGuardar,
  onToggleActivo,
}: {
  campo: CampoFormulario;
  onGuardar: (puntajeMaximo: number) => void;
  onToggleActivo: () => void;
}) {
  const [valor, setValor] = useState(campo.puntajeMaximo ?? "0");
  const cambio = valor !== campo.puntajeMaximo;

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-5 py-3 text-text">{campo.etiqueta}</td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            max={100}
            step="1"
            className="w-24"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
          {cambio && (
            <Button variante="ghost" onClick={() => onGuardar(Number(valor))}>
              Guardar
            </Button>
          )}
        </div>
      </td>
      <td className="px-5 py-3">
        <button type="button" onClick={onToggleActivo}>
          <Badge tono={campo.activo ? "success" : "neutral"}>
            {campo.activo ? "Activo" : "Inactivo"}
          </Badge>
        </button>
      </td>
    </tr>
  );
}

function FormularioCampo({
  onSubmit,
  enviando,
  error,
}: {
  onSubmit: (data: {
    etiqueta: string;
    tipoDato: TipoDatoCampo;
    esEvaluable: boolean;
    esIdentificatorio: boolean;
    puntajeMaximo?: number;
  }) => void;
  enviando: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState({
    etiqueta: "",
    tipoDato: "TEXTO" as TipoDatoCampo,
    tipo: "identificatorio" as "identificatorio" | "evaluable",
    puntajeMaximo: "0",
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          etiqueta: form.etiqueta,
          tipoDato: form.tipoDato,
          esIdentificatorio: form.tipo === "identificatorio",
          esEvaluable: form.tipo === "evaluable",
          puntajeMaximo:
            form.tipo === "evaluable" ? Number(form.puntajeMaximo) : undefined,
        });
      }}
    >
      <Input
        label="Etiqueta"
        required
        value={form.etiqueta}
        onChange={(e) => setForm({ ...form, etiqueta: e.target.value })}
      />
      <Select
        label="Tipo de campo"
        value={form.tipo}
        onChange={(e) =>
          setForm({
            ...form,
            tipo: e.target.value as "identificatorio" | "evaluable",
          })
        }
      >
        <option value="identificatorio">Identificatorio (no se puntúa)</option>
        <option value="evaluable">Evaluable (criterio de rúbrica)</option>
      </Select>
      {form.tipo === "evaluable" && (
        <Input
          label="Puntaje máximo"
          type="number"
          min={0}
          max={100}
          step="1"
          required
          value={form.puntajeMaximo}
          onChange={(e) => setForm({ ...form, puntajeMaximo: e.target.value })}
        />
      )}
      {error && <Alerta>{error}</Alerta>}
      <Button type="submit" disabled={enviando}>
        {enviando ? "Creando..." : "Crear campo"}
      </Button>
    </form>
  );
}
