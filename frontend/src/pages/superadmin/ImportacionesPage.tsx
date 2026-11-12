import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cambiarHoja,
  confirmarImportacion,
  guardarMapeo,
  listarImportaciones,
  subirExcel,
} from "../../api/importaciones";
import { listarCampos } from "../../api/rubrica";
import { extraerMensajeError } from "../../api/client";
import { ETIQUETA_ROL_ESPECIAL, ETIQUETA_TIPO_DATO } from "../../lib/etiquetas";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Alerta, Spinner } from "../../components/ui/Feedback";
import type {
  ColumnaImportacion,
  EntradaMapeo,
  ImportacionExcel,
  RolEspecialCampo,
  TipoDatoCampo,
  VistaPreviaImportacion,
} from "../../types";

type FilaMapeo = {
  nombreExcel: string;
  accion: "ignorar" | "existente" | "nueva";
  campoId: string;
  etiquetaNueva: string;
  tipoNueva: "identificatorio" | "evaluable";
  tipoDatoNueva: TipoDatoCampo;
  puntajeMaximoNueva: string;
  rolEspecial: RolEspecialCampo | "";
  // Agrupación bajo un criterio evaluable (ver CampoFormulario.padreId): permite que columnas
  // sueltas del excel ("Experiencia 1 - Lugar", "Título Secundario") aparezcan agrupadas como
  // párrafos bajo el criterio correspondiente (2.1/2.2/2.3) en el formulario de evaluación.
  padreId: string;
  agrupador: string;
};

function primeraLinea(texto: string) {
  return texto.split("\n")[0]?.trim() ?? texto;
}

function filaDesdeColumna(col: ColumnaImportacion): FilaMapeo {
  const sug = col.sugerencia;
  const base = {
    nombreExcel: col.nombre,
    etiquetaNueva: primeraLinea(col.nombre).slice(0, 180),
    puntajeMaximoNueva: "0",
  };
  if (sug.accion === "ignorar") {
    return {
      ...base,
      accion: "ignorar",
      campoId: "",
      tipoNueva: "identificatorio",
      tipoDatoNueva: "TEXTO",
      rolEspecial: "",
      padreId: "",
      agrupador: "",
    };
  }
  if (sug.accion === "existente") {
    return {
      ...base,
      accion: "existente",
      campoId: sug.campoId,
      tipoNueva: "identificatorio",
      tipoDatoNueva: "TEXTO",
      rolEspecial: sug.rolEspecial ?? "",
      padreId: sug.padreId ?? "",
      agrupador: sug.agrupador ?? "",
    };
  }
  return {
    ...base,
    accion: "nueva",
    campoId: "",
    tipoNueva: sug.esEvaluable ? "evaluable" : "identificatorio",
    tipoDatoNueva: sug.tipoDato ?? "TEXTO",
    rolEspecial: sug.rolEspecial ?? "",
    padreId: sug.padreId ?? "",
    agrupador: sug.agrupador ?? "",
  };
}

function filaAEntrada(fila: FilaMapeo): EntradaMapeo {
  if (fila.accion === "ignorar") {
    return { accion: "ignorar", nombreExcel: fila.nombreExcel };
  }
  const etiquetaCorta = fila.padreId ? primeraLinea(fila.nombreExcel).slice(0, 200) : undefined;
  if (fila.accion === "existente") {
    return {
      accion: "existente",
      nombreExcel: fila.nombreExcel,
      campoId: fila.campoId,
      rolEspecial: fila.rolEspecial || undefined,
      padreId: fila.padreId || null,
      agrupador: fila.padreId ? fila.agrupador.trim() || null : null,
      etiquetaCorta: fila.padreId ? etiquetaCorta : null,
    };
  }
  return {
    accion: "nueva",
    nombreExcel: fila.nombreExcel,
    campoNuevo: {
      etiqueta: fila.etiquetaNueva,
      tipoDato: fila.tipoDatoNueva,
      esIdentificatorio: fila.tipoNueva === "identificatorio",
      esEvaluable: fila.tipoNueva === "evaluable",
      puntajeMaximo: fila.tipoNueva === "evaluable" ? Number(fila.puntajeMaximoNueva) : undefined,
      padreId: fila.padreId || undefined,
      agrupador: fila.padreId ? fila.agrupador.trim() || undefined : undefined,
      etiquetaCorta: fila.padreId ? etiquetaCorta : undefined,
    },
    rolEspecial: fila.rolEspecial || undefined,
  };
}

export function ImportacionesPage() {
  const [vista, setVista] = useState<VistaPreviaImportacion | null>(null);
  const [filas, setFilas] = useState<FilaMapeo[]>([]);
  const [resultado, setResultado] = useState<ImportacionExcel | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: campos } = useQuery({ queryKey: ["rubrica"], queryFn: listarCampos });
  const queryClient = useQueryClient();
  const { data: historial } = useQuery({ queryKey: ["importaciones"], queryFn: listarImportaciones });

  const criteriosEvaluables = (campos?.campos ?? []).filter((c) => c.esEvaluable);

  const subir = useMutation({
    mutationFn: subirExcel,
    onSuccess: (data) => {
      setVista(data);
      setFilas(data.columnas.map(filaDesdeColumna));
      setResultado(null);
    },
  });

  const cambiarHojaMut = useMutation({
    mutationFn: ({ id, hoja }: { id: string; hoja: string }) => cambiarHoja(id, hoja),
    onSuccess: (data) => {
      setVista(data);
      setFilas(data.columnas.map(filaDesdeColumna));
    },
  });

  const guardarMapeoMut = useMutation({
    mutationFn: ({ id, columnas }: { id: string; columnas: EntradaMapeo[] }) => guardarMapeo(id, columnas),
  });

  const confirmar = useMutation({
    mutationFn: confirmarImportacion,
    onSuccess: (data) => {
      setResultado(data);
      queryClient.invalidateQueries({ queryKey: ["importaciones"] });
      queryClient.invalidateQueries({ queryKey: ["rubrica"] });
    },
  });

  function actualizarFila(index: number, cambios: Partial<FilaMapeo>) {
    setFilas((prev) => prev.map((f, i) => (i === index ? { ...f, ...cambios } : f)));
  }

  async function onGuardarYConfirmar() {
    if (!vista) return;
    await guardarMapeoMut.mutateAsync({ id: vista.importacionId, columnas: filas.map(filaAEntrada) });
    confirmar.mutate(vista.importacionId);
  }

  function reiniciar() {
    setVista(null);
    setFilas([]);
    setResultado(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text">Importar Excel</h1>
        <p className="text-sm text-text-muted">
          Subí el Excel exportado del Google Form de inscripción.
        </p>
      </div>

      {!vista && (
        <Card>
          <label className="flex flex-col gap-3">
            <span className="text-sm font-medium text-text">Archivo (.xlsx, .xls o .csv)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                const archivo = e.target.files?.[0];
                if (archivo) subir.mutate(archivo);
              }}
              className="text-sm text-text-muted"
            />
          </label>
          {subir.isPending && (
            <div className="mt-4 flex items-center gap-2 text-sm text-text-muted">
              <Spinner /> Procesando archivo...
            </div>
          )}
          {subir.error && (
            <div className="mt-4">
              <Alerta>{extraerMensajeError(subir.error)}</Alerta>
            </div>
          )}
        </Card>
      )}

      {vista && !resultado && (
        <>
          <Card>
            <div className="flex flex-wrap items-end gap-4">
              <Select
                label="Hoja del archivo"
                value={vista.hoja}
                onChange={(e) =>
                  cambiarHojaMut.mutate({ id: vista.importacionId, hoja: e.target.value })
                }
              >
                {vista.hojasDisponibles.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </Select>
              <p className="text-sm text-text-muted">{vista.filasTotales} fila(s) de datos detectadas.</p>
              <Button variante="ghost" onClick={reiniciar} className="ml-auto">
                Cancelar y subir otro archivo
              </Button>
            </div>
          </Card>

          <Card className="p-0">
            <div className="max-h-[60vh] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface">
                  <tr className="border-b border-border text-left text-text-muted">
                    <th className="px-4 py-3 font-medium">Columna del excel</th>
                    <th className="px-4 py-3 font-medium">Acción</th>
                    <th className="px-4 py-3 font-medium">Detalle</th>
                    <th className="px-4 py-3 font-medium">Rol especial</th>
                    <th className="px-4 py-3 font-medium">Criterio padre</th>
                    <th className="px-4 py-3 font-medium">Agrupador</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((fila, i) => (
                    <tr key={fila.nombreExcel} className="border-b border-border last:border-0 align-top">
                      <td className="max-w-55 truncate px-4 py-2 text-text" title={fila.nombreExcel}>
                        {primeraLinea(fila.nombreExcel)}
                      </td>
                      <td className="px-4 py-2">
                        <Select
                          value={fila.accion}
                          onChange={(e) =>
                            actualizarFila(i, { accion: e.target.value as FilaMapeo["accion"] })
                          }
                        >
                          <option value="ignorar">Ignorar</option>
                          <option value="existente">Campo existente</option>
                          <option value="nueva">Campo nuevo</option>
                        </Select>
                      </td>
                      <td className="px-4 py-2">
                        {fila.accion === "existente" && (
                          <Select
                            value={fila.campoId}
                            onChange={(e) => actualizarFila(i, { campoId: e.target.value })}
                          >
                            <option value="">Elegí un campo...</option>
                            {campos?.campos.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.etiqueta}
                              </option>
                            ))}
                          </Select>
                        )}
                        {fila.accion === "nueva" && (
                          <div className="flex flex-wrap items-center gap-2">
                            <Input
                              className="w-56"
                              value={fila.etiquetaNueva}
                              onChange={(e) => actualizarFila(i, { etiquetaNueva: e.target.value })}
                            />
                            <Select
                              value={fila.tipoNueva}
                              onChange={(e) =>
                                actualizarFila(i, {
                                  tipoNueva: e.target.value as FilaMapeo["tipoNueva"],
                                })
                              }
                            >
                              <option value="identificatorio">Identificatorio</option>
                              <option value="evaluable">Evaluable</option>
                            </Select>
                            {fila.tipoNueva === "identificatorio" && (
                              <Select
                                value={fila.tipoDatoNueva}
                                onChange={(e) =>
                                  actualizarFila(i, {
                                    tipoDatoNueva: e.target.value as TipoDatoCampo,
                                  })
                                }
                              >
                                {Object.entries(ETIQUETA_TIPO_DATO).map(([valor, etiqueta]) => (
                                  <option key={valor} value={valor}>
                                    {etiqueta}
                                  </option>
                                ))}
                              </Select>
                            )}
                            {fila.tipoNueva === "evaluable" && (
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                step="0.5"
                                className="w-20"
                                value={fila.puntajeMaximoNueva}
                                onChange={(e) =>
                                  actualizarFila(i, { puntajeMaximoNueva: e.target.value })
                                }
                              />
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {fila.accion !== "ignorar" && (
                          <Select
                            value={fila.rolEspecial}
                            onChange={(e) =>
                              actualizarFila(i, { rolEspecial: e.target.value as RolEspecialCampo | "" })
                            }
                          >
                            <option value="">—</option>
                            {Object.entries(ETIQUETA_ROL_ESPECIAL).map(([valor, etiqueta]) => (
                              <option key={valor} value={valor}>
                                {etiqueta}
                              </option>
                            ))}
                          </Select>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {fila.accion !== "ignorar" && !fila.rolEspecial && (
                          <Select
                            className="w-48"
                            value={fila.padreId}
                            onChange={(e) => actualizarFila(i, { padreId: e.target.value })}
                          >
                            <option value="">Sin agrupar</option>
                            {criteriosEvaluables.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.etiqueta}
                              </option>
                            ))}
                          </Select>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {fila.accion !== "ignorar" && !fila.rolEspecial && fila.padreId && (
                          <Input
                            className="w-40"
                            placeholder="Ej: Experiencia 1"
                            value={fila.agrupador}
                            onChange={(e) => actualizarFila(i, { agrupador: e.target.value })}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex items-center justify-end gap-3">
            {(guardarMapeoMut.error || confirmar.error) && (
              <Alerta>{extraerMensajeError(guardarMapeoMut.error ?? confirmar.error)}</Alerta>
            )}
            <Button
              onClick={onGuardarYConfirmar}
              disabled={guardarMapeoMut.isPending || confirmar.isPending}
            >
              {guardarMapeoMut.isPending || confirmar.isPending ? "Importando..." : "Confirmar importación"}
            </Button>
          </div>
        </>
      )}

      {resultado && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text">Importación completada</p>
              <p className="text-sm text-text-muted">
                {resultado.filasImportadas} inscripto(s) importados, {resultado.filasError} omitido(s) o con error.
              </p>
            </div>
            <Button variante="secondary" onClick={reiniciar}>
              Importar otro archivo
            </Button>
          </div>
          {!!resultado.logErrores?.length && (
            <ul className="mt-4 flex flex-col gap-1 text-sm text-text-muted">
              {resultado.logErrores.map((e, i) => (
                <li key={i}>
                  Fila {e.fila}: {e.motivo}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">Historial</h2>
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="px-5 py-3 font-medium">Archivo</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Importados</th>
                <th className="px-5 py-3 font-medium">Errores</th>
                <th className="px-5 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {historial?.map((h) => (
                <tr key={h.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-text">{h.archivoNombre}</td>
                  <td className="px-5 py-3">
                    <Badge tono={h.estado === "COMPLETADO" ? "success" : h.estado === "ERROR" ? "danger" : "neutral"}>
                      {h.estado}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-text-muted">{h.filasImportadas}</td>
                  <td className="px-5 py-3 text-text-muted">{h.filasError}</td>
                  <td className="px-5 py-3 text-text-muted">
                    {new Date(h.createdAt).toLocaleString("es-AR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}
